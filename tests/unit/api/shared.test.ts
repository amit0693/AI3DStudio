import { afterEach, describe, expect, test, vi } from "vitest";
import {
  ApiError,
  cleanEmail,
  cleanText,
  handleApiError,
  integerInRange,
  json,
  parseJsonColumn,
  publicProduct,
  randomToken,
  readJsonObject,
  sha256Hex,
  type ProductRow,
} from "@/app/api/products/_shared";

function jsonRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request("https://baylayer.test/api", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("json", () => {
  test("returns a no-store JSON response", async () => {
    const response = json({ ok: true });

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-type")).toMatch(/application\/json/);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  test("accepts a status and extra headers", () => {
    const response = json({ ok: true }, 201, { "x-test": "1" });

    expect(response.status).toBe(201);
    expect(response.headers.get("x-test")).toBe("1");
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});

describe("handleApiError", () => {
  test("preserves the status and message of an ApiError", async () => {
    const response = handleApiError(new ApiError(404, "Product not found."));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Product not found.",
    });
  });

  test.each([
    "Cloudflare binding `DB` is missing",
    "R2 binding `UPLOADS` is missing",
    "D1_ERROR: no such table: products",
  ])("maps storage setup failures to 503 (%s)", async (message) => {
    const response = handleApiError(new Error(message));

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error:
        "Commerce storage is not ready yet. Apply the bundled D1 migration and verify the Sites storage bindings.",
    });
  });

  test("returns a generic 500 for unexpected failures", async () => {
    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = handleApiError(new Error("kaboom"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Unable to complete this request.",
    });
    expect(logged).toHaveBeenCalledOnce();
  });

  test("handles thrown non-Error values", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(handleApiError("nope").status).toBe(500);
  });
});

describe("readJsonObject", () => {
  test("parses a JSON object body", async () => {
    await expect(readJsonObject(jsonRequest({ a: 1 }))).resolves.toEqual({
      a: 1,
    });
  });

  test("accepts a charset suffix on the content type", async () => {
    const request = jsonRequest({ a: 1 }, {
      "content-type": "Application/JSON; charset=utf-8",
    });

    await expect(readJsonObject(request)).resolves.toEqual({ a: 1 });
  });

  test("rejects a non-JSON content type with 415", async () => {
    const request = new Request("https://baylayer.test/api", {
      method: "POST",
      headers: { "content-type": "text/plain" },
      body: "{}",
    });

    await expect(readJsonObject(request)).rejects.toMatchObject({ status: 415 });
  });

  test("rejects an oversized declared body with 413", async () => {
    const request = jsonRequest({ a: 1 }, { "content-length": "999999" });

    await expect(readJsonObject(request, 1_024)).rejects.toMatchObject({
      status: 413,
    });
  });

  test("rejects malformed JSON with 400", async () => {
    await expect(readJsonObject(jsonRequest("{"))).rejects.toMatchObject({
      status: 400,
      message: "Request body must be valid JSON.",
    });
  });

  test.each([["an array", "[]"], ["a string", '"text"'], ["null", "null"]])(
    "rejects %s body with 400",
    async (_label, body) => {
      await expect(readJsonObject(jsonRequest(body))).rejects.toMatchObject({
        status: 400,
        message: "Request body must be a JSON object.",
      });
    },
  );
});

describe("cleanText", () => {
  test("trims and returns text", () => {
    expect(cleanText("  Amit  ", "name", 20)).toBe("Amit");
  });

  test("returns null for optional empty values", () => {
    expect(cleanText(null, "name", 20)).toBeNull();
    expect(cleanText(undefined, "name", 20)).toBeNull();
    expect(cleanText("", "name", 20)).toBeNull();
    expect(cleanText("   ", "name", 20)).toBeNull();
  });

  test("rejects missing required values", () => {
    expect(() => cleanText(null, "name", 20, true)).toThrow("name is required.");
    expect(() => cleanText("   ", "name", 20, true)).toThrow(
      "name is required.",
    );
  });

  test("rejects non-string values", () => {
    expect(() => cleanText(42, "name", 20)).toThrow("name must be text.");
  });

  test("rejects values longer than the limit", () => {
    expect(() => cleanText("abcdef", "name", 5)).toThrow(
      "name must be 5 characters or fewer.",
    );
  });
});

describe("cleanEmail", () => {
  test("lower-cases a valid address", () => {
    expect(cleanEmail(" Person@Example.COM ")).toBe("person@example.com");
  });

  test.each(["person", "person@example", "person @example.com", "@example.com"])(
    "rejects %s",
    (value) => {
      expect(() => cleanEmail(value)).toThrow("Enter a valid email address.");
    },
  );

  test("requires an address by default and allows opting out", () => {
    expect(() => cleanEmail(null)).toThrow("email is required.");
    expect(cleanEmail(null, false)).toBeNull();
  });
});

describe("integerInRange", () => {
  test("returns an in-range integer", () => {
    expect(integerInRange(5, "quantity", 1, 10)).toBe(5);
  });

  test("uses the fallback only for nullish values", () => {
    expect(integerInRange(null, "quantity", 1, 10, 2)).toBe(2);
    expect(integerInRange(undefined, "quantity", 1, 10, 2)).toBe(2);
    expect(() => integerInRange(null, "quantity", 1, 10)).toThrow(
      "quantity must be a whole number from 1 to 10.",
    );
  });

  test.each([0, 11, 1.5, "3", Number.NaN])("rejects %s", (value) => {
    expect(() => integerInRange(value, "quantity", 1, 10, 2)).toThrow(
      "quantity must be a whole number from 1 to 10.",
    );
  });
});

describe("parseJsonColumn", () => {
  test("parses stored JSON", () => {
    expect(parseJsonColumn('{"a":1}', {})).toEqual({ a: 1 });
  });

  test("falls back for empty or invalid JSON", () => {
    expect(parseJsonColumn(null, [])).toEqual([]);
    expect(parseJsonColumn("", [])).toEqual([]);
    expect(parseJsonColumn("{oops}", { a: 1 })).toEqual({ a: 1 });
  });
});

describe("publicProduct", () => {
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
    compare_at_price_cents: null,
    currency: "USD",
    material: "PLA",
    image_url: null,
    gallery_json: '["a.png"]',
    personalization_schema_json: '[{"name":"text"}]',
    attributes_json: '{"color":"black"}',
    lead_time_min_days: 3,
    lead_time_max_days: 7,
    is_featured: 1,
  };

  test("maps a database row to the public shape", () => {
    expect(publicProduct(row)).toEqual({
      id: "prod_1",
      slug: "desk-tray",
      sku: "BL-001",
      name: "Desk Tray",
      shortDescription: "A tray",
      description: "A longer description",
      category: "home",
      productType: "printed",
      price: { amountCents: 4_200, compareAtAmountCents: null, currency: "USD" },
      material: "PLA",
      imageUrl: null,
      gallery: ["a.png"],
      personalization: [{ name: "text" }],
      attributes: { color: "black" },
      leadTimeDays: { min: 3, max: 7 },
      featured: true,
    });
  });

  test("defaults invalid JSON columns and normalises the featured flag", () => {
    const product = publicProduct({
      ...row,
      gallery_json: "not json",
      personalization_schema_json: "",
      attributes_json: "[",
      is_featured: 0,
    });

    expect(product.gallery).toEqual([]);
    expect(product.personalization).toEqual([]);
    expect(product.attributes).toEqual({});
    expect(product.featured).toBe(false);
  });
});

describe("sha256Hex", () => {
  test("hashes a string to lower-case hex", async () => {
    await expect(sha256Hex("abc")).resolves.toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });

  test("hashes binary content", async () => {
    const bytes = new TextEncoder().encode("abc");
    const buffer = bytes.buffer.slice(0, bytes.byteLength) as ArrayBuffer;

    await expect(sha256Hex(buffer)).resolves.toBe(await sha256Hex("abc"));
  });
});

describe("randomToken", () => {
  test("returns a 64-character hex-only token", () => {
    const token = randomToken();

    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(token).not.toBe(randomToken());
  });
});
