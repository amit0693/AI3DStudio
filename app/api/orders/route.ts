import { getD1 } from "@/db";
import {
  ApiError,
  cleanEmail,
  cleanText,
  enforceRateLimit,
  handleApiError,
  integerInRange,
  json,
  readJsonObject,
  randomToken,
} from "../products/_shared";

type CatalogRow = {
  id: string;
  sku: string;
  name: string;
  base_price_cents: number;
  currency: string;
};

type ExistingOrderRow = {
  id: string;
  order_number: string;
  public_token: string;
  customer_email: string;
  status: string;
  payment_status: string;
  currency: string;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  discount_cents: number;
  total_cents: number;
  created_at: string;
};

type RequestedItem = {
  productId: string;
  quantity: number;
  personalization: Record<string, string | number | boolean>;
};

const MAX_ORDER_ITEMS = 20;
const ORDER_RATE_LIMIT = { bucket: "orders", limit: 10, windowSeconds: 600 };
const FLAT_SHIPPING_CENTS = 699;

function cleanPersonalization(value: unknown) {
  if (value == null) return {};
  if (!value || typeof value !== "object" || Array.isArray(value)) {
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
      if (text.length > 160) {
        throw new ApiError(400, `${key} must be 160 characters or fewer.`);
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
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new ApiError(400, `items[${index}] must be an object.`);
    }
    const record = item as Record<string, unknown>;
    const productId = cleanText(record.productId, `items[${index}].productId`, 80, true)!;
    if (!/^[a-zA-Z0-9_-]+$/.test(productId)) {
      throw new ApiError(400, `items[${index}].productId is invalid.`);
    }
    return {
      productId,
      quantity: integerInRange(record.quantity, `items[${index}].quantity`, 1, 25, 1),
      personalization: cleanPersonalization(record.personalization),
    };
  });
}

function cleanShippingAddress(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "shippingAddress is required for shipping orders.");
  }
  const address = value as Record<string, unknown>;
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
    amounts: {
      subtotalCents: row.subtotal_cents,
      shippingCents: row.shipping_cents,
      taxCents: row.tax_cents,
      discountCents: row.discount_cents,
      totalCents: row.total_cents,
      currency: row.currency,
    },
    createdAt: row.created_at,
  };
}

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, ORDER_RATE_LIMIT);

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
                tax_cents, discount_cents, total_cents, created_at
         FROM orders WHERE idempotency_key = ? LIMIT 1`,
      )
      .bind(idempotencyKey)
      .first<ExistingOrderRow>();
    if (existing) {
      if (existing.customer_email !== customerEmail) {
        throw new ApiError(409, "Idempotency-Key has already been used.");
      }
      return json({ order: orderResponse(existing), reused: true });
    }

    const productIds = [...new Set(requestedItems.map((item) => item.productId))];
    const placeholders = productIds.map(() => "?").join(", ");
    const catalog = await db
      .prepare(
        `SELECT id, sku, name, base_price_cents, currency
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

    const pricedItems = requestedItems.map((item) => {
      const product = byId.get(item.productId)!;
      return {
        ...item,
        product,
        lineTotalCents: product.base_price_cents * item.quantity,
      };
    });
    const subtotalCents = pricedItems.reduce((sum, item) => sum + item.lineTotalCents, 0);
    const shippingCents = fulfillmentMethod === "shipping" ? FLAT_SHIPPING_CENTS : 0;
    const taxCents = 0;
    const discountCents = 0;
    const totalCents = subtotalCents + shippingCents + taxCents - discountCents;

    const orderId = `ord_${crypto.randomUUID()}`;
    const trackingToken = randomToken();
    const orderNumber = `BL-${new Date().getUTCFullYear()}-${crypto.randomUUID()
      .replaceAll("-", "")
      .slice(0, 8)
      .toUpperCase()}`;

    const statements = [
      db
        .prepare(
          `INSERT INTO orders (
             id, order_number, public_token, idempotency_key, customer_email,
             customer_name, customer_phone, status, payment_status,
             fulfillment_method, shipping_address_json, customer_notes, currency,
             subtotal_cents, shipping_cents, tax_cents, discount_cents, total_cents
           ) VALUES (?, ?, ?, ?, ?, ?, ?, 'awaiting_payment', 'unpaid', ?, ?, ?,
                     'USD', ?, ?, ?, ?, ?)`,
        )
        .bind(
          orderId,
          orderNumber,
          trackingToken,
          idempotencyKey,
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
            `item_${crypto.randomUUID()}`,
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
        .bind(`osh_${crypto.randomUUID()}`, orderId),
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
    };
    return json(
      {
        order: orderResponse(created),
        checkout: {
          available: false,
          message: "Payment checkout is not configured yet; no card data was collected.",
        },
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
