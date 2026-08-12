import { beforeEach, describe, expect, test, vi } from "vitest";
import { createD1Fake, type D1Fake } from "../helpers/d1";

let d1: D1Fake;

vi.mock("@/db", () => ({ getD1: () => d1.database }));

const { POST } = await import("@/app/api/orders/route");

const catalogRow = {
  id: "prod_1",
  sku: "BL-001",
  name: "Desk Tray",
  base_price_cents: 4_200,
  currency: "USD",
};

const existingOrderRow = {
  id: "ord_1",
  order_number: "BL-2026-ABCD1234",
  public_token: "token",
  customer_email: "person@example.com",
  status: "awaiting_payment",
  payment_status: "unpaid",
  currency: "USD",
  subtotal_cents: 4_200,
  shipping_cents: 0,
  tax_cents: 0,
  discount_cents: 0,
  total_cents: 4_200,
  created_at: "2026-01-01T00:00:00.000Z",
};

const validBody = {
  email: "Person@Example.com",
  name: "Person",
  phone: "555-0100",
  notes: "Leave at the door",
  fulfillmentMethod: "pickup",
  items: [{ productId: "prod_1", quantity: 2, personalization: { text: " Hi " } }],
};

const shippingAddress = {
  line1: "1 Main St",
  line2: "Apt 2",
  city: "Oakland",
  state: "ca",
  postalCode: "94607",
  country: "us",
};

function orderRequest(
  body: unknown,
  headers: Record<string, string> = { "idempotency-key": "order-key-0001" },
) {
  return new Request("https://baylayer.test/api/orders", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  d1 = createD1Fake();
  d1.respond(/FROM products/, [catalogRow]);
});

describe("POST /api/orders", () => {
  test("creates a pickup order without checkout", async () => {
    const response = await POST(orderRequest(validBody));

    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.checkout).toEqual({
      available: false,
      message:
        "Payment checkout is not configured yet; no card data was collected.",
    });
    expect(body.order).toMatchObject({
      status: "awaiting_payment",
      paymentStatus: "unpaid",
      amounts: {
        subtotalCents: 8_400,
        shippingCents: 0,
        taxCents: 0,
        discountCents: 0,
        totalCents: 8_400,
        currency: "USD",
      },
    });
    expect(body.order.id).toMatch(/^ord_/);
    expect(body.order.orderNumber).toMatch(/^BL-\d{4}-[0-9A-F]{8}$/);
    expect(body.order.trackingToken).toMatch(/^[0-9a-f]{64}$/);
  });

  test("writes the order, its items, and a status history row in one batch", async () => {
    await POST(orderRequest(validBody));

    const [batch] = d1.batched;
    expect(batch).toHaveLength(3);
    expect(batch[0].sql).toContain("INSERT INTO orders");
    expect(batch[0].values).toContain("person@example.com");
    expect(batch[1].sql).toContain("INSERT INTO order_items");
    expect(batch[1].values).toContain(4_200);
    expect(batch[1].values).toContain('{"text":"Hi"}');
    expect(batch[2].sql).toContain("INSERT INTO order_status_history");
  });

  test("adds flat shipping and stores a normalised address", async () => {
    const response = await POST(
      orderRequest({
        ...validBody,
        fulfillmentMethod: "shipping",
        shippingAddress,
      }),
    );

    const body = await response.json();
    expect(body.order.amounts.shippingCents).toBe(699);
    expect(body.order.amounts.totalCents).toBe(8_400 + 699);

    const stored = d1.batched[0][0].values.find(
      (value): value is string =>
        typeof value === "string" && value.startsWith("{"),
    );
    expect(JSON.parse(stored!)).toEqual({
      line1: "1 Main St",
      line2: "Apt 2",
      city: "Oakland",
      state: "CA",
      postalCode: "94607",
      country: "US",
    });
  });

  test("replays an order for a reused idempotency key", async () => {
    d1.respond(/FROM orders WHERE idempotency_key/, [existingOrderRow]);

    const response = await POST(orderRequest(validBody));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      reused: true,
      order: { id: "ord_1" },
    });
    expect(d1.batched).toHaveLength(0);
  });

  test("rejects a reused idempotency key from a different customer", async () => {
    d1.respond(/FROM orders WHERE idempotency_key/, [
      { ...existingOrderRow, customer_email: "other@example.com" },
    ]);

    const response = await POST(orderRequest(validBody));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Idempotency-Key has already been used.",
    });
  });

  test("accepts the idempotency key from the body when the header is absent", async () => {
    const response = await POST(
      orderRequest({ ...validBody, idempotencyKey: "body-key-0001" }, {}),
    );

    expect(response.status).toBe(201);
    expect(d1.calls[0].values).toEqual(["body-key-0001"]);
  });

  test.each([
    ["missing", {}, "Idempotency-Key is required."],
    ["too short", { "idempotency-key": "abc" }, "Idempotency-Key must be 8 to 128 safe characters."],
    ["unsafe", { "idempotency-key": "key with spaces" }, "Idempotency-Key must be 8 to 128 safe characters."],
  ])("rejects a %s idempotency key", async (_label, headers, error) => {
    const response = await POST(orderRequest(validBody, headers));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error });
  });

  test("requires a supported fulfillment method", async () => {
    const response = await POST(
      orderRequest({ ...validBody, fulfillmentMethod: "drone" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "fulfillmentMethod must be pickup or shipping.",
    });
  });

  test.each([
    ["a missing address", undefined, "shippingAddress is required for shipping orders."],
    [
      "a non-US country",
      { ...shippingAddress, country: "CA" },
      "Phase 1 shipping is available only within the United States.",
    ],
    [
      "a bad state code",
      { ...shippingAddress, state: "C1" },
      "shippingAddress.state must be a 2-letter code.",
    ],
    [
      "a bad postal code",
      { ...shippingAddress, postalCode: "9460" },
      "Enter a valid US postal code.",
    ],
  ])("rejects shipping with %s", async (_label, address, error) => {
    const response = await POST(
      orderRequest({
        ...validBody,
        fulfillmentMethod: "shipping",
        shippingAddress: address,
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error });
  });

  test("accepts a ZIP+4 postal code", async () => {
    const response = await POST(
      orderRequest({
        ...validBody,
        fulfillmentMethod: "shipping",
        shippingAddress: { ...shippingAddress, postalCode: "94607-1234" },
      }),
    );

    expect(response.status).toBe(201);
  });

  test.each([
    ["an empty cart", [], "items must contain 1 to 20 products."],
    ["a non-array cart", {}, "items must contain 1 to 20 products."],
    [
      "an oversized cart",
      Array.from({ length: 21 }, () => ({ productId: "prod_1" })),
      "items must contain 1 to 20 products.",
    ],
    ["a non-object item", ["prod_1"], "items[0] must be an object."],
    [
      "an unsafe product id",
      [{ productId: "prod 1" }],
      "items[0].productId is invalid.",
    ],
    [
      "an out-of-range quantity",
      [{ productId: "prod_1", quantity: 26 }],
      "items[0].quantity must be a whole number from 1 to 25.",
    ],
  ])("rejects %s", async (_label, items, error) => {
    const response = await POST(orderRequest({ ...validBody, items }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error });
  });

  test("defaults a missing item quantity to one", async () => {
    const response = await POST(
      orderRequest({ ...validBody, items: [{ productId: "prod_1" }] }),
    );

    await expect(response.json()).resolves.toMatchObject({
      order: { amounts: { subtotalCents: 4_200 } },
    });
  });

  test.each([
    [
      "a non-object personalization",
      ["nope"],
      "personalization must be an object.",
    ],
    [
      "too many personalization fields",
      [Object.fromEntries(Array.from({ length: 13 }, (_, i) => [`f${i}`, "x"]))],
      "personalization has too many fields.",
    ],
    [
      "an unsafe personalization key",
      [{ "bad key": "x" }],
      "A personalization field name is invalid.",
    ],
    [
      "an overlong personalization value",
      [{ text: "x".repeat(161) }],
      "text must be 160 characters or fewer.",
    ],
    [
      "an unsupported personalization value",
      [{ text: { nested: true } }],
      "text has an unsupported value.",
    ],
    ["a non-finite number", [{ text: null }], "text has an unsupported value."],
  ])("rejects %s", async (_label, [personalization], error) => {
    const response = await POST(
      orderRequest({
        ...validBody,
        items: [{ productId: "prod_1", personalization }],
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error });
  });

  test("keeps boolean and numeric personalization values", async () => {
    await POST(
      orderRequest({
        ...validBody,
        items: [
          {
            productId: "prod_1",
            personalization: { gift: true, count: 3, note: " hi " },
          },
        ],
      }),
    );

    expect(d1.batched[0][1].values).toContain(
      '{"gift":true,"count":3,"note":"hi"}',
    );
  });

  test("rejects a cart containing an unavailable product", async () => {
    d1 = createD1Fake();

    const response = await POST(orderRequest(validBody));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "One or more products are unavailable.",
    });
  });

  test("rejects a cart with a non-USD product", async () => {
    d1 = createD1Fake().respond(/FROM products/, [
      { ...catalogRow, currency: "EUR" },
    ]);

    const response = await POST(orderRequest(validBody));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "The cart contains incompatible currencies.",
    });
  });

  test("requires a customer email and name", async () => {
    const withoutEmail = await POST(
      orderRequest({ ...validBody, email: undefined }),
    );
    expect(withoutEmail.status).toBe(400);
    await expect(withoutEmail.json()).resolves.toEqual({
      error: "email is required.",
    });

    const withoutName = await POST(orderRequest({ ...validBody, name: "" }));
    expect(withoutName.status).toBe(400);
    await expect(withoutName.json()).resolves.toEqual({
      error: "name is required.",
    });
  });

  test("reports 503 when the orders table is missing", async () => {
    d1.failNextRun(new Error("D1_ERROR: no such table: orders"));

    const response = await POST(orderRequest(validBody));

    expect(response.status).toBe(503);
  });
});
