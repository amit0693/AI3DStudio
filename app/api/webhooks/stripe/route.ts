import { getD1, getStripeConfig } from "@/db";
import { json } from "../../products/_shared";
import { verifyStripeSignature } from "../../stripe/_shared";

type StripeEvent = {
  id: string;
  type: string;
  data?: {
    object?: {
      id?: string;
      client_reference_id?: string | null;
      amount_subtotal?: number | null;
      amount_total?: number | null;
      currency?: string | null;
      payment_status?: string | null;
      amount_refunded?: number | null;
      refunded?: boolean | null;
      metadata?: Record<string, string>;
      shipping_details?: StripeShippingDetails | null;
      collected_information?: { shipping_details?: StripeShippingDetails | null } | null;
    };
  };
};

type StripeShippingDetails = {
  name?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
};

type OrderPaymentRow = {
  id: string;
  payment_status: string;
  subtotal_cents: number;
  shipping_cents: number;
  discount_cents: number;
  total_cents: number;
  fulfillment_method: string;
};

function verifiedShippingJson(session: NonNullable<StripeEvent["data"]>["object"]) {
  const details = session?.collected_information?.shipping_details ?? session?.shipping_details;
  const address = details?.address;
  if (!address || address.country?.toUpperCase() !== "US" || !address.line1 || !address.city || !address.state || !address.postal_code) return null;
  return JSON.stringify({
    name: details?.name ?? null,
    line1: address.line1,
    line2: address.line2 ?? null,
    city: address.city,
    state: address.state,
    postalCode: address.postal_code,
    country: "US",
  });
}

export async function POST(request: Request) {
  const { webhookSecret } = getStripeConfig();
  if (!webhookSecret) return json({ error: "Stripe webhook is not configured." }, 503);
  const signature = request.headers.get("stripe-signature") ?? "";
  const rawBody = await request.text();
  if (!(await verifyStripeSignature(rawBody, signature))) {
    return json({ error: "Invalid Stripe signature." }, 400);
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return json({ error: "Invalid webhook JSON." }, 400);
  }

  const session = event.data?.object;
  const orderId = session?.metadata?.order_id || session?.client_reference_id;
  if (!orderId || !/^ord_[a-f0-9-]{36}$/.test(orderId)) return json({ received: true });

  const db = getD1();
  const alreadyProcessed = await db
    .prepare(`SELECT id FROM payment_events WHERE id = ? LIMIT 1`)
    .bind(event.id)
    .first<{ id: string }>();
  if (alreadyProcessed) return json({ received: true, duplicate: true });
  const order = await db
    .prepare(
      `SELECT id, payment_status, subtotal_cents, shipping_cents, discount_cents,
              total_cents, fulfillment_method FROM orders WHERE id = ? LIMIT 1`,
    )
    .bind(orderId)
    .first<OrderPaymentRow>();
  if (!order) return json({ received: true });

  const paidEvent = event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded";
  if (paidEvent && session?.payment_status === "paid" && order.payment_status !== "paid") {
    const expectedBeforeTax = order.subtotal_cents + order.shipping_cents - order.discount_cents;
    if (session.currency?.toLowerCase() !== "usd" || session.amount_subtotal !== expectedBeforeTax || !Number.isInteger(session.amount_total) || session.amount_total! < expectedBeforeTax) {
      console.error("Stripe amount mismatch", { eventId: event.id, orderId });
      return json({ error: "Payment amount did not match the order." }, 409);
    }
    const taxCents = session.amount_total! - expectedBeforeTax;
    const shippingAddressJson = order.fulfillment_method === "shipping" ? verifiedShippingJson(session) : null;
    await db.batch([
      db
        .prepare(
          `INSERT INTO payment_events (id, order_id, provider, event_type)
           VALUES (?, ?, 'stripe', ?)`,
        )
        .bind(event.id, orderId, event.type),
      db
        .prepare(
          `UPDATE orders SET status = 'confirmed', payment_status = 'paid',
                  payment_provider = 'stripe', payment_reference = ?, tax_cents = ?,
                  total_cents = ?, shipping_address_json = COALESCE(?, shipping_address_json),
                  updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND payment_status != 'paid'`,
        )
        .bind(session.id ?? null, taxCents, session.amount_total, shippingAddressJson, orderId),
      db
        .prepare(
          `INSERT INTO order_status_history (id, order_id, status, note, actor)
           VALUES (?, ?, 'confirmed', ?, 'stripe')`,
        )
        .bind(`osh_${crypto.randomUUID()}`, orderId, `Payment verified by Stripe event ${event.id}.`),
    ]);
  }

  if ((event.type === "checkout.session.async_payment_failed" || event.type === "checkout.session.expired") && order.payment_status !== "paid") {
    const paymentStatus = event.type === "checkout.session.expired" ? "expired" : "failed";
    await db.batch([
      db
        .prepare(
          `INSERT INTO payment_events (id, order_id, provider, event_type)
           VALUES (?, ?, 'stripe', ?)`,
        )
        .bind(event.id, orderId, event.type),
      db
        .prepare(
          `UPDATE orders SET payment_status = ?, updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND payment_status != 'paid'`,
        )
        .bind(paymentStatus, orderId),
    ]);
  }

  if (event.type === "charge.refunded" && session?.refunded === true && order.payment_status === "paid") {
    await db.batch([
      db
        .prepare(
          `INSERT INTO payment_events (id, order_id, provider, event_type)
           VALUES (?, ?, 'stripe', ?)`,
        )
        .bind(event.id, orderId, event.type),
      db
        .prepare(
          `UPDATE orders SET status = 'refunded', payment_status = 'refunded',
                  updated_at = CURRENT_TIMESTAMP WHERE id = ? AND payment_status = 'paid'`,
        )
        .bind(orderId),
      db
        .prepare(
          `INSERT INTO order_status_history (id, order_id, status, note, actor)
           VALUES (?, ?, 'refunded', ?, 'stripe')`,
        )
        .bind(`osh_${crypto.randomUUID()}`, orderId, `Refund confirmed by Stripe event ${event.id}.`),
    ]);
  }

  return json({ received: true });
}
