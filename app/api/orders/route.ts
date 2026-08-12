import { getD1 } from "@/db";
import {
  ApiError,
  cleanEmail,
  cleanText,
  handleApiError,
  integerInRange,
  isPlainObject,
  json,
  orderAmounts,
  type OrderAmountColumns,
  prefixedId,
  readJsonObject,
  randomToken,
  parseJsonColumn,
  sha256Hex,
} from "@/lib/api";
import { stripeRequest, type StripeCheckoutSession } from "../stripe/_shared";
import { auth, authAvailability } from "@/lib/auth";

type CatalogRow = {
  id: string;
  sku: string;
  name: string;
  base_price_cents: number;
  currency: string;
  minimum_quantity: number;
  personalization_schema_json: string;
};

type ExistingOrderRow = OrderAmountColumns & {
  id: string;
  order_number: string;
  public_token: string;
  customer_email: string;
  status: string;
  payment_status: string;
  created_at: string;
  payment_reference?: string | null;
  fulfillment_method: "pickup" | "shipping";
};

type RequestedItem = {
  productId: string;
  quantity: number;
  personalization: Record<string, string | number | boolean>;
};

const MAX_ORDER_ITEMS = 20;
const FLAT_SHIPPING_CENTS = 699;
const FREE_SHIPPING_CENTS = 6500;

type PersonalizationField = {
  key: string;
  label?: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  options?: string[];
};

function cleanPersonalization(value: unknown) {
  if (value == null) return {};
  if (!isPlainObject(value)) {
    throw new ApiError(400, "personalization must be an object.");
  }
  const entries = Object.entries(value);
  if (entries.length > 12) {
    throw new ApiError(400, "personalization has too many fields.");
  }

  const cleaned: Record<string, string | number | boolean> = {};
  for (const [key, item] of entries) {
    if (!/^[a-zA-Z0-9_-]{1,40}$/.test(key)) {
      throw new ApiError(400, "A personalization field name is invalid.");
    }
    if (typeof item === "string") {
      const text = item.trim();
      if (text.length > 2000) {
        throw new ApiError(400, `${key} must be 2000 characters or fewer.`);
      }
      cleaned[key] = text;
    } else if (typeof item === "boolean") {
      cleaned[key] = item;
    } else if (typeof item === "number" && Number.isFinite(item)) {
      cleaned[key] = item;
    } else {
      throw new ApiError(400, `${key} has an unsupported value.`);
    }
  }
  return cleaned;
}

function cleanItems(value: unknown): RequestedItem[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_ORDER_ITEMS) {
    throw new ApiError(400, `items must contain 1 to ${MAX_ORDER_ITEMS} products.`);
  }
  return value.map((item, index) => {
    if (!isPlainObject(item)) {
      throw new ApiError(400, `items[${index}] must be an object.`);
    }
    const productId = cleanText(item.productId, `items[${index}].productId`, 80, true)!;
    if (!/^[a-zA-Z0-9_-]+$/.test(productId)) {
      throw new ApiError(400, `items[${index}].productId is invalid.`);
    }
    return {
      productId,
      quantity: integerInRange(item.quantity, `items[${index}].quantity`, 1, 100, 1),
      personalization: cleanPersonalization(item.personalization),
    };
  });
}

async function validatePersonalization(
  item: RequestedItem,
  product: CatalogRow,
  db: ReturnType<typeof getD1>,
) {
  if (item.quantity < product.minimum_quantity) {
    throw new ApiError(400, `${product.name} requires at least ${product.minimum_quantity}.`);
  }
  const schema = parseJsonColumn<PersonalizationField[]>(product.personalization_schema_json, []);
  const allowed = new Set(schema.flatMap((field) => [field.key, `${field.key}Token`]));
  for (const key of Object.keys(item.personalization)) {
    if (!allowed.has(key) && key !== "color" && key !== "material" && key !== "rightsConfirmed") {
      throw new ApiError(400, `${product.name} does not support ${key}.`);
    }
  }
  for (const field of schema) {
    const value = item.personalization[field.key];
    if (field.required && (value == null || value === "")) {
      throw new ApiError(400, `${field.label ?? field.key} is required for ${product.name}.`);
    }
    if (typeof value === "string" && field.maxLength && value.length > field.maxLength) {
      throw new ApiError(400, `${field.label ?? field.key} is too long.`);
    }
    if (typeof value === "string" && field.options?.length && !field.options.includes(value)) {
      throw new ApiError(400, `${field.label ?? field.key} has an invalid selection.`);
    }
    if (field.type === "url" && typeof value === "string") {
      try {
        const url = new URL(value);
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error();
      } catch {
        throw new ApiError(400, `${field.label ?? field.key} must be a valid web URL.`);
      }
    }
    if (field.type === "file" && typeof value === "string" && value) {
      const token = item.personalization[`${field.key}Token`];
      if (typeof token !== "string" || !token) {
        throw new ApiError(400, `${field.label ?? field.key} must be uploaded before checkout.`);
      }
      const asset = await db
        .prepare(
          `SELECT id, access_token_hash, expires_at
           FROM personalization_uploads WHERE id = ? LIMIT 1`,
        )
        .bind(value)
        .first<{ id: string; access_token_hash: string; expires_at: string }>();
      if (!asset || asset.access_token_hash !== (await sha256Hex(token)) || Date.parse(asset.expires_at) <= Date.now()) {
        throw new ApiError(400, `${field.label ?? field.key} upload is invalid or expired.`);
      }
      delete item.personalization[`${field.key}Token`];
    }
  }
  if (schema.some((field) => field.type === "file" && item.personalization[field.key]) && item.personalization.rightsConfirmed !== true) {
    throw new ApiError(400, `Confirm that you have permission to use the files for ${product.name}.`);
  }
}

async function createCheckoutSession(
  request: Request,
  order: ExistingOrderRow,
  items: Array<{ quantity: number; product: Pick<CatalogRow, "id" | "name" | "base_price_cents"> }>,
  idempotencyKey: string,
  fulfillmentMethod: "pickup" | "shipping",
) {
  const origin = new URL(request.url).origin;
  const form = new URLSearchParams({
    mode: "payment",
    customer_email: order.customer_email,
    client_reference_id: order.id,
    success_url: `${origin}/checkout/success?order=${order.public_token}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/?checkout=cancelled`,
    "metadata[order_id]": order.id,
    "metadata[order_number]": order.order_number,
    "payment_intent_data[metadata][order_id]": order.id,
    "payment_intent_data[metadata][order_number]": order.order_number,
    "automatic_tax[enabled]": "true",
    billing_address_collection: "auto",
  });
  if (fulfillmentMethod === "shipping") {
    form.set("shipping_address_collection[allowed_countries][0]", "US");
  }
  items.forEach((item, index) => {
    form.set(`line_items[${index}][price_data][currency]`, "usd");
    form.set(`line_items[${index}][price_data][unit_amount]`, String(item.product.base_price_cents));
    form.set(`line_items[${index}][price_data][product_data][name]`, item.product.name);
    form.set(`line_items[${index}][price_data][product_data][metadata][product_id]`, item.product.id);
    form.set(`line_items[${index}][quantity]`, String(item.quantity));
  });
  if (order.shipping_cents > 0) {
    const index = items.length;
    form.set(`line_items[${index}][price_data][currency]`, "usd");
    form.set(`line_items[${index}][price_data][unit_amount]`, String(order.shipping_cents));
    form.set(`line_items[${index}][price_data][product_data][name]`, "Standard US shipping");
    form.set(`line_items[${index}][quantity]`, "1");
  }
  return stripeRequest<StripeCheckoutSession>("/checkout/sessions", {
    method: "POST",
    body: form,
    idempotencyKey: `baylayer-${idempotencyKey}`,
  });
}

function cleanShippingAddress(value: unknown) {
  if (!isPlainObject(value)) {
    throw new ApiError(400, "shippingAddress is required for shipping orders.");
  }
  const address = value;

  const country = cleanText(address.country, "shippingAddress.country", 2, true)!.toUpperCase();
  if (country !== "US") {
    throw new ApiError(400, "Phase 1 shipping is available only within the United States.");
  }
  const state = cleanText(address.state, "shippingAddress.state", 2, true)!.toUpperCase();
  if (!/^[A-Z]{2}$/.test(state)) {
    throw new ApiError(400, "shippingAddress.state must be a 2-letter code.");
  }
  const postalCode = cleanText(address.postalCode, "shippingAddress.postalCode", 10, true)!;
  if (!/^\d{5}(?:-\d{4})?$/.test(postalCode)) {
    throw new ApiError(400, "Enter a valid US postal code.");
  }
  return {
    line1: cleanText(address.line1, "shippingAddress.line1", 120, true),
    line2: cleanText(address.line2, "shippingAddress.line2", 120),
    city: cleanText(address.city, "shippingAddress.city", 80, true),
    state,
    postalCode,
    country,
  };
}

function orderResponse(row: ExistingOrderRow) {
  return {
    id: row.id,
    orderNumber: row.order_number,
    trackingToken: row.public_token,
    status: row.status,
    paymentStatus: row.payment_status,
    amounts: orderAmounts(row),
    createdAt: row.created_at,
  };
}

export async function POST(request: Request) {
  try {
    const session = authAvailability.core
      ? await auth.api.getSession({ headers: request.headers })
      : null;
    const body = await readJsonObject(request);
    const idempotencyKey = cleanText(
      request.headers.get("idempotency-key") ?? body.idempotencyKey,
      "Idempotency-Key",
      128,
      true,
    )!;
    if (!/^[a-zA-Z0-9._:-]{8,128}$/.test(idempotencyKey)) {
      throw new ApiError(400, "Idempotency-Key must be 8 to 128 safe characters.");
    }
    const customerEmail = cleanEmail(body.email)!;
    const customerName = cleanText(body.name, "name", 100, true)!;
    const customerPhone = cleanText(body.phone, "phone", 32);
    const customerNotes = cleanText(body.notes, "notes", 1000);
    const fulfillmentMethod = cleanText(
      body.fulfillmentMethod,
      "fulfillmentMethod",
      16,
      true,
    );
    if (fulfillmentMethod !== "pickup" && fulfillmentMethod !== "shipping") {
      throw new ApiError(400, "fulfillmentMethod must be pickup or shipping.");
    }
    const shippingAddress =
      fulfillmentMethod === "shipping" ? cleanShippingAddress(body.shippingAddress) : null;
    const requestedItems = cleanItems(body.items);

    const db = getD1();
    const existing = await db
      .prepare(
        `SELECT id, order_number, public_token, customer_email, status,
                payment_status, currency, subtotal_cents, shipping_cents,
                tax_cents, discount_cents, total_cents, created_at,
                payment_reference, fulfillment_method
         FROM orders WHERE idempotency_key = ? LIMIT 1`,
      )
      .bind(idempotencyKey)
      .first<ExistingOrderRow>();
    if (existing) {
      if (existing.customer_email !== customerEmail) {
        throw new ApiError(409, "Idempotency-Key has already been used.");
      }
      if (existing.payment_status === "paid") {
        return json({ order: orderResponse(existing), reused: true, checkout: { available: false, paid: true } });
      }
      if (existing.payment_reference) {
        const session = await stripeRequest<StripeCheckoutSession>(`/checkout/sessions/${encodeURIComponent(existing.payment_reference)}`);
        return json({ order: orderResponse(existing), reused: true, checkout: { available: Boolean(session?.url), url: session?.url ?? null } });
      }
      const existingLines = await db
        .prepare(
          `SELECT product_id, name_snapshot, quantity, unit_price_cents
           FROM order_items WHERE order_id = ? ORDER BY created_at ASC, id ASC`,
        )
        .bind(existing.id)
        .all<{ product_id: string | null; name_snapshot: string; quantity: number; unit_price_cents: number }>();
      const retrySession = await createCheckoutSession(
        request,
        existing,
        existingLines.results.map((line) => ({
          quantity: line.quantity,
          product: {
            id: line.product_id ?? line.name_snapshot,
            name: line.name_snapshot,
            base_price_cents: line.unit_price_cents,
          },
        })),
        idempotencyKey,
        existing.fulfillment_method,
      );
      if (retrySession?.url) {
        await db
          .prepare(
            `UPDATE orders SET payment_provider = 'stripe', payment_reference = ?,
                    updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          )
          .bind(retrySession.id, existing.id)
          .run();
      }
      return json({
        order: orderResponse(existing),
        reused: true,
        checkout: retrySession?.url
          ? { available: true, provider: "stripe", url: retrySession.url }
          : { available: false, message: "Payment checkout needs the Stripe site secrets; no card data was collected." },
      });
    }

    const productIds = [...new Set(requestedItems.map((item) => item.productId))];
    const placeholders = productIds.map(() => "?").join(", ");
    const catalog = await db
      .prepare(
        `SELECT id, sku, name, base_price_cents, currency, minimum_quantity,
                personalization_schema_json
         FROM products
         WHERE is_active = 1 AND id IN (${placeholders})`,
      )
      .bind(...productIds)
      .all<CatalogRow>();
    const byId = new Map(catalog.results.map((product) => [product.id, product]));
    if (byId.size !== productIds.length) {
      throw new ApiError(400, "One or more products are unavailable.");
    }
    if (catalog.results.some((product) => product.currency !== "USD")) {
      throw new ApiError(409, "The cart contains incompatible currencies.");
    }

    const pricedItems = [] as Array<RequestedItem & { product: CatalogRow; lineTotalCents: number }>;
    for (const item of requestedItems) {
      const product = byId.get(item.productId)!;
      await validatePersonalization(item, product, db);
      pricedItems.push({
        ...item,
        product,
        lineTotalCents: product.base_price_cents * item.quantity,
      });
    }
    const subtotalCents = pricedItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
    const shippingCents = fulfillmentMethod === "shipping" && subtotalCents < FREE_SHIPPING_CENTS
      ? FLAT_SHIPPING_CENTS
      : 0;
    const taxCents = 0;
    const discountCents = 0;
    const totalCents = subtotalCents + shippingCents + taxCents - discountCents;

    const orderId = prefixedId("ord");
    const trackingToken = randomToken();
    const orderNumber = `BL-${new Date().getUTCFullYear()}-${crypto.randomUUID()
      .replaceAll("-", "")
      .slice(0, 8)
      .toUpperCase()}`;

    const statements = [
      db
        .prepare(
          `INSERT INTO orders (
             id, order_number, public_token, idempotency_key, user_id, customer_email,
             customer_name, customer_phone, status, payment_status,
             fulfillment_method, shipping_address_json, customer_notes, currency,
             subtotal_cents, shipping_cents, tax_cents, discount_cents, total_cents
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_payment', 'unpaid', ?, ?, ?,
                     'USD', ?, ?, ?, ?, ?)`,
        )
        .bind(
          orderId,
          orderNumber,
          trackingToken,
          idempotencyKey,
          session?.user.id ?? null,
          customerEmail,
          customerName,
          customerPhone,
          fulfillmentMethod,
          shippingAddress ? JSON.stringify(shippingAddress) : null,
          customerNotes,
          subtotalCents,
          shippingCents,
          taxCents,
          discountCents,
          totalCents,
        ),
    ];
    for (const item of pricedItems) {
      statements.push(
        db
          .prepare(
            `INSERT INTO order_items (
               id, order_id, product_id, sku_snapshot, name_snapshot, quantity,
               unit_price_cents, line_total_cents, personalization_json
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            prefixedId("item"),
            orderId,
            item.product.id,
            item.product.sku,
            item.product.name,
            item.quantity,
            item.product.base_price_cents,
            item.lineTotalCents,
            JSON.stringify(item.personalization),
          ),
      );
    }
    statements.push(
      db
        .prepare(
          `INSERT INTO order_status_history (id, order_id, status, note, actor)
           VALUES (?, ?, 'awaiting_payment', 'Order created from storefront.', 'customer')`,
        )
        .bind(prefixedId("osh"), orderId),
    );
    await db.batch(statements);

    const created: ExistingOrderRow = {
      id: orderId,
      order_number: orderNumber,
      public_token: trackingToken,
      customer_email: customerEmail,
      status: "awaiting_payment",
      payment_status: "unpaid",
      currency: "USD",
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      tax_cents: taxCents,
      discount_cents: discountCents,
      total_cents: totalCents,
      created_at: new Date().toISOString(),
      fulfillment_method: fulfillmentMethod,
    };
    const checkout = await createCheckoutSession(
      request,
      created,
      pricedItems,
      idempotencyKey,
      fulfillmentMethod,
    );
    if (checkout) {
      if (!checkout.url) throw new Error("Stripe did not return a checkout URL.");
      await db
        .prepare(
          `UPDATE orders SET payment_provider = 'stripe', payment_reference = ?,
                  updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        )
        .bind(checkout.id, orderId)
        .run();
    }
    return json(
      {
        order: orderResponse(created),
        checkout: checkout
          ? { available: true, provider: "stripe", url: checkout.url }
          : { available: false, message: "Payment checkout needs the Stripe site secrets; no card data was collected." },
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
