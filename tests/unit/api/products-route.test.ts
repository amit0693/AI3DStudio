import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ProductRow } from "@/app/api/products/_shared";
import { createD1Fake, type D1Fake } from "../helpers/d1";

let d1: D1Fake;
let resolveD1: () => unknown;

vi.mock("@/db", () => ({ getD1: () => resolveD1() }));

const { GET: listProducts } = await import("@/app/api/products/route");
const { GET: getProduct } = await import("@/app/api/products/[slug]/route");

const row: ProductRow = {
  id: "prod_1",
  slug: "desk-tray",
  sku: "BL-001",
  name: "Desk Tray",
  short_description: "A tray",
  description: "A longer description",
  category: "home",
  product_type: "printed",
  base_price_cents: 4_200,
  compare_at_price_cents: 5_000,
  currency: "USD",
  material: "PLA",
  image_url: "https://cdn.test/tray.png",
  gallery_json: "[]",
  personalization_schema_json: "[]",
  attributes_json: "{}",
  lead_time_min_days: 3,
  lead_time_max_days: 7,
  is_featured: 1,
};

function listRequest(query = "") {
  return new Request(`https://baylayer.test/api/products${query}`);
}

beforeEach(() => {
  d1 = createD1Fake();
  resolveD1 = () => d1.database;
});

describe("GET /api/products", () => {
  test("returns active products with a cacheable response", async () => {
    d1.respond(/FROM products/, [row]);
    const response = await listProducts(listRequest());

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=60, s-maxage=300",
    );

    const body = await response.json();
    expect(body.products).toHaveLength(1);
    expect(body.products[0]).toMatchObject({ slug: "desk-tray", featured: true });
    expect(d1.calls[0].sql).toContain("is_active = 1");
    expect(d1.calls[0].values).toEqual([24]);
  });

  test("filters by category and featured flag", async () => {
    d1.respond(/FROM products/, []);
    await listProducts(listRequest("?category=Home&featured=true&limit=5"));

    const [call] = d1.calls;
    expect(call.sql).toContain("category = ?");
    expect(call.sql).toContain("is_featured = ?");
    expect(call.values).toEqual(["home", 1, 5]);
  });

  test("binds featured=false as zero", async () => {
    d1.respond(/FROM products/, []);
    await listProducts(listRequest("?featured=false"));

    expect(d1.calls[0].values).toEqual([0, 24]);
  });

  test.each(["?limit=0", "?limit=101", "?limit=abc", "?limit=2.5"])(
    "rejects %s",
    async (query) => {
      const response = await listProducts(listRequest(query));

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "limit must be a whole number from 1 to 100.",
      });
    },
  );

  test("rejects an invalid category", async () => {
    const response = await listProducts(listRequest("?category=home%20decor"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "category is invalid.",
    });
  });

  test("rejects a non-boolean featured filter", async () => {
    const response = await listProducts(listRequest("?featured=yes"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "featured must be true or false.",
    });
  });

  test("reports 503 when the catalog table is missing", async () => {
    resolveD1 = () => {
      throw new Error("D1_ERROR: no such table: products");
    };

    const response = await listProducts(listRequest());

    expect(response.status).toBe(503);
  });
});

describe("GET /api/products/[slug]", () => {
  test("returns a single product", async () => {
    d1.respond(/FROM products/, [row]);
    const response = await getProduct(
      new Request("https://baylayer.test/api/products/desk-tray"),
      { params: Promise.resolve({ slug: "Desk-Tray" }) },
    );

    expect(response.status).toBe(200);
    expect(d1.calls[0].values).toEqual(["desk-tray"]);
    await expect(response.json()).resolves.toMatchObject({ slug: "desk-tray" });
  });

  test("decodes a percent-encoded slug", async () => {
    d1.respond(/FROM products/, [row]);
    await getProduct(new Request("https://baylayer.test/api/products/x"), {
      params: Promise.resolve({ slug: "desk%2Dtray" }),
    });

    expect(d1.calls[0].values).toEqual(["desk-tray"]);
  });

  test("returns 404 for an unknown slug", async () => {
    d1.respond(/FROM products/, []);
    const response = await getProduct(
      new Request("https://baylayer.test/api/products/missing"),
      { params: Promise.resolve({ slug: "missing" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Product not found.",
    });
  });

  test.each(["desk tray", "desk_tray", "a".repeat(81), ""])(
    "rejects the invalid slug %j",
    async (slug) => {
      const response = await getProduct(
        new Request("https://baylayer.test/api/products/x"),
        { params: Promise.resolve({ slug }) },
      );

      expect(response.status).toBe(400);
      await expect(response.json()).resolves.toEqual({
        error: "Product slug is invalid.",
      });
    },
  );
});
