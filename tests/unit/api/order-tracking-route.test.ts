import { beforeEach, describe, expect, test, vi } from "vitest";
import { createD1Fake, type D1Fake } from "../helpers/d1";

let d1: D1Fake;

vi.mock("@/db", () => ({ getD1: () => d1.database }));

const { GET } = await import("@/app/api/orders/[token]/route");

const token = "f".repeat(64);

const orderRow = {
  id: "ord_1",
  order_number: "BL-2026-ABCD1234",
  status: "awaiting_payment",
  payment_status: "unpaid",
  fulfillment_method: "pickup",
  currency: "USD",
  subtotal_cents: 4_200,
  shipping_cents: 0,
  tax_cents: 0,
  discount_cents: 0,
  total_cents: 4_200,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-02T00:00:00.000Z",
};

function trackingRequest() {
  return new Request(`https://baylayer.test/api/orders/${token}`);
}

beforeEach(() => {
  d1 = createD1Fake();
});

describe("GET /api/orders/[token]", () => {
  test("returns the order with its items and timeline", async () => {
    d1.respond(/FROM orders WHERE public_token/, [orderRow])
      .respond(/FROM order_items/, [
        {
          id: "item_1",
          sku_snapshot: "BL-001",
          name_snapshot: "Desk Tray",
          quantity: 1,
          unit_price_cents: 4_200,
          line_total_cents: 4_200,
          personalization_json: '{"text":"Hi"}',
        },
      ])
      .respond(/FROM order_status_history/, [
        {
          status: "awaiting_payment",
          note: "Order created from storefront.",
          created_at: "2026-01-01T00:00:00.000Z",
        },
      ]);

    const response = await GET(trackingRequest(), {
      params: Promise.resolve({ token }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      order: {
        orderNumber: "BL-2026-ABCD1234",
        status: "awaiting_payment",
        paymentStatus: "unpaid",
        fulfillmentMethod: "pickup",
        amounts: {
          subtotalCents: 4_200,
          shippingCents: 0,
          taxCents: 0,
          discountCents: 0,
          totalCents: 4_200,
          currency: "USD",
        },
        items: [
          {
            id: "item_1",
            sku: "BL-001",
            name: "Desk Tray",
            quantity: 1,
            unitPriceCents: 4_200,
            lineTotalCents: 4_200,
            personalization: { text: "Hi" },
          },
        ],
        timeline: [
          {
            status: "awaiting_payment",
            note: "Order created from storefront.",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
        ],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    });
    expect(d1.callsMatching(/FROM order_items/)[0].values).toEqual(["ord_1"]);
  });

  test("returns empty collections when the order has no items or history", async () => {
    d1.respond(/FROM orders WHERE public_token/, [orderRow]);

    const response = await GET(trackingRequest(), {
      params: Promise.resolve({ token }),
    });

    await expect(response.json()).resolves.toMatchObject({
      order: { items: [], timeline: [] },
    });
  });

  test("returns 404 for an unknown token", async () => {
    const response = await GET(trackingRequest(), {
      params: Promise.resolve({ token }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Order not found." });
  });

  test.each(["short", "F".repeat(64), `${"f".repeat(63)}g`])(
    "returns 404 for the malformed token %j without querying D1",
    async (value) => {
      const response = await GET(trackingRequest(), {
        params: Promise.resolve({ token: value }),
      });

      expect(response.status).toBe(404);
      expect(d1.calls).toHaveLength(0);
    },
  );
});
