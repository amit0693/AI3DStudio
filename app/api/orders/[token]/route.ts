import { getD1 } from "@/db";
import {
  ApiError,
  enforceRateLimit,
  handleApiError,
  json,
  parseJsonColumn,
} from "../../products/_shared";

const LOOKUP_RATE_LIMIT = {
  bucket: "order-lookup",
  limit: 60,
  windowSeconds: 600,
};

type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  fulfillment_method: string;
  currency: string;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  discount_cents: number;
  total_cents: number;
  created_at: string;
  updated_at: string;
};

type ItemRow = {
  id: string;
  sku_snapshot: string;
  name_snapshot: string;
  quantity: number;
  unit_price_cents: number;
  line_total_cents: number;
  personalization_json: string;
};

type HistoryRow = {
  status: string;
  note: string | null;
  created_at: string;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    await enforceRateLimit(request, LOOKUP_RATE_LIMIT);

    const { token: rawToken } = await params;
    const token = decodeURIComponent(rawToken);
    if (!/^[a-f0-9]{64}$/.test(token)) {
      throw new ApiError(404, "Order not found.");
    }

    const db = getD1();
    const order = await db
      .prepare(
        `SELECT id, order_number, status, payment_status, fulfillment_method,
                currency, subtotal_cents, shipping_cents, tax_cents,
                discount_cents, total_cents, created_at, updated_at
         FROM orders WHERE public_token = ? LIMIT 1`,
      )
      .bind(token)
      .first<OrderRow>();
    if (!order) throw new ApiError(404, "Order not found.");

    const [itemsResult, historyResult] = await Promise.all([
      db
        .prepare(
          `SELECT id, sku_snapshot, name_snapshot, quantity, unit_price_cents,
                  line_total_cents, personalization_json
           FROM order_items WHERE order_id = ? ORDER BY created_at ASC, id ASC`,
        )
        .bind(order.id)
        .all<ItemRow>(),
      db
        .prepare(
          `SELECT status, note, created_at
           FROM order_status_history WHERE order_id = ?
           ORDER BY created_at ASC, id ASC`,
        )
        .bind(order.id)
        .all<HistoryRow>(),
    ]);

    return json({
      order: {
        orderNumber: order.order_number,
        status: order.status,
        paymentStatus: order.payment_status,
        fulfillmentMethod: order.fulfillment_method,
        amounts: {
          subtotalCents: order.subtotal_cents,
          shippingCents: order.shipping_cents,
          taxCents: order.tax_cents,
          discountCents: order.discount_cents,
          totalCents: order.total_cents,
          currency: order.currency,
        },
        items: itemsResult.results.map((item) => ({
          id: item.id,
          sku: item.sku_snapshot,
          name: item.name_snapshot,
          quantity: item.quantity,
          unitPriceCents: item.unit_price_cents,
          lineTotalCents: item.line_total_cents,
          personalization: parseJsonColumn<Record<string, unknown>>(
            item.personalization_json,
            {},
          ),
        })),
        timeline: historyResult.results.map((event) => ({
          status: event.status,
          note: event.note,
          createdAt: event.created_at,
        })),
        createdAt: order.created_at,
        updatedAt: order.updated_at,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
