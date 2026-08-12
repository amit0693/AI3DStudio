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

export async function readJsonObject(
  request: Request,
  maxBytes = 64 * 1024,
): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ApiError(415, "Content-Type must be application/json.");
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new ApiError(413, "Request body is too large.");
  }

  let value: unknown;
  try {
    value = await request.json();
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
