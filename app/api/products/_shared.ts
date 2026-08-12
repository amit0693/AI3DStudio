import { getD1 } from "@/db";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return json({ error: error.message }, error.status);
  }

  const message = error instanceof Error ? error.message : "Unknown error";
  if (
    message.includes("binding `DB`") ||
    message.includes("binding `UPLOADS`") ||
    message.includes("no such table")
  ) {
    return json(
      {
        error:
          "Commerce storage is not ready yet. Apply the bundled D1 migration and verify the Sites storage bindings.",
      },
      503,
    );
  }

  console.error("Commerce API error", error);
  return json({ error: "Unable to complete this request." }, 500);
}

/**
 * Buffers a request body while enforcing `maxBytes` on the bytes actually
 * received. `Content-Length` is caller-controlled and absent on chunked
 * bodies, so it is only used as an early rejection hint.
 */
export async function readBoundedBody(
  request: Request,
  maxBytes: number,
): Promise<Uint8Array> {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new ApiError(413, "Request body is too large.");
  }

  const body = request.body;
  if (!body) return new Uint8Array(0);

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
      if (received > maxBytes) {
        throw new ApiError(413, "Request body is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
    if (received > maxBytes) await body.cancel().catch(() => undefined);
  }

  const buffer = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return buffer;
}

export async function readBoundedFormData(
  request: Request,
  maxBytes: number,
): Promise<FormData> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    throw new ApiError(415, "Use multipart/form-data with a file field.");
  }

  const bytes = await readBoundedBody(request, maxBytes);
  try {
    return await new Response(bytes.buffer as ArrayBuffer, {
      headers: { "content-type": contentType },
    }).formData();
  } catch {
    throw new ApiError(400, "The multipart form data could not be parsed.");
  }
}

export async function readJsonObject(
  request: Request,
  maxBytes = 64 * 1024,
): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ApiError(415, "Content-Type must be application/json.");
  }

  const bytes = await readBoundedBody(request, maxBytes);

  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ApiError(400, "Request body must be a JSON object.");
  }
  return value as Record<string, unknown>;
}

export function cleanText(
  value: unknown,
  field: string,
  maxLength: number,
  required = false,
) {
  if (value == null || value === "") {
    if (required) throw new ApiError(400, `${field} is required.`);
    return null;
  }
  if (typeof value !== "string") {
    throw new ApiError(400, `${field} must be text.`);
  }
  const cleaned = value.trim();
  if (required && !cleaned) {
    throw new ApiError(400, `${field} is required.`);
  }
  if (cleaned.length > maxLength) {
    throw new ApiError(400, `${field} must be ${maxLength} characters or fewer.`);
  }
  return cleaned || null;
}

export function cleanEmail(value: unknown, required = true) {
  const email = cleanText(value, "email", 254, required)?.toLowerCase() ?? null;
  if (email && !EMAIL_PATTERN.test(email)) {
    throw new ApiError(400, "Enter a valid email address.");
  }
  return email;
}

export function integerInRange(
  value: unknown,
  field: string,
  minimum: number,
  maximum: number,
  fallback?: number,
) {
  if (value == null && fallback != null) return fallback;
  if (!Number.isInteger(value) || (value as number) < minimum || (value as number) > maximum) {
    throw new ApiError(
      400,
      `${field} must be a whole number from ${minimum} to ${maximum}.`,
    );
  }
  return value as number;
}

export function parseJsonColumn<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function publicProduct(row: ProductRow) {
  return {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    category: row.category,
    productType: row.product_type,
    price: {
      amountCents: row.base_price_cents,
      compareAtAmountCents: row.compare_at_price_cents,
      currency: row.currency,
    },
    material: row.material,
    imageUrl: row.image_url,
    gallery: parseJsonColumn<unknown[]>(row.gallery_json, []),
    personalization: parseJsonColumn<unknown[]>(
      row.personalization_schema_json,
      [],
    ),
    attributes: parseJsonColumn<Record<string, unknown>>(
      row.attributes_json,
      {},
    ),
    leadTimeDays: {
      min: row.lead_time_min_days,
      max: row.lead_time_max_days,
    },
    featured: Boolean(row.is_featured),
  };
}

export type ProductRow = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  short_description: string;
  description: string;
  category: string;
  product_type: string;
  base_price_cents: number;
  compare_at_price_cents: number | null;
  currency: string;
  material: string;
  image_url: string | null;
  gallery_json: string;
  personalization_schema_json: string;
  attributes_json: string;
  lead_time_min_days: number;
  lead_time_max_days: number;
  is_featured: number;
};

export async function sha256Hex(value: string | ArrayBuffer) {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export function randomToken() {
  return `${crypto.randomUUID()}${crypto.randomUUID()}`.replaceAll("-", "");
}

/** Length-independent, constant-time comparison for hex digests. */
export function secretsMatch(left: string, right: string) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

export type RateLimitRule = {
  bucket: string;
  limit: number;
  windowSeconds: number;
};

function clientIdentifier(request: Request) {
  const direct = request.headers.get("cf-connecting-ip");
  if (direct) return direct.trim().slice(0, 64);
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first ? first.slice(0, 64) : "unknown";
}

/**
 * Fixed-window per-caller limit for write endpoints. Storage failures fail
 * open so that a rate-limit outage cannot take down the storefront.
 */
export async function enforceRateLimit(request: Request, rule: RateLimitRule) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const windowStart = nowSeconds - (nowSeconds % rule.windowSeconds);
  const key = `${rule.bucket}:${clientIdentifier(request)}:${windowStart}`;
  const expiresAt = windowStart + rule.windowSeconds * 2;

  let hits: number;
  try {
    const database = getD1();
    const row = await database
      .prepare(
        `INSERT INTO rate_limits (id, hit_count, expires_at_epoch)
         VALUES (?, 1, ?)
         ON CONFLICT(id) DO UPDATE SET hit_count = hit_count + 1
         RETURNING hit_count`,
      )
      .bind(key, expiresAt)
      .first<{ hit_count: number }>();
    hits = row?.hit_count ?? 1;

    if (hits === 1) {
      await database
        .prepare(`DELETE FROM rate_limits WHERE expires_at_epoch < ?`)
        .bind(nowSeconds)
        .run();
    }
  } catch (error) {
    console.error("Rate limit storage unavailable", error);
    return;
  }

  if (hits > rule.limit) {
    throw new ApiError(429, "Too many requests. Please wait and try again.");
  }
}
