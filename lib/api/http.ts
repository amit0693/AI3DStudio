import { ApiError } from "./errors";

export function json(data: unknown, status = 200, headers?: HeadersInit) {
  return Response.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

export const CACHEABLE_HEADERS: HeadersInit = {
  "Cache-Control": "public, max-age=60, s-maxage=300",
};

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
  assertContentLengthWithin(request, maxBytes, "Request body is too large.");

  let value: unknown;
  try {
    value = await request.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }

  if (!isPlainObject(value)) {
    throw new ApiError(400, "Request body must be a JSON object.");
  }
  return value;
}

export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isMultipartFormData(request: Request) {
  return (request.headers.get("content-type") ?? "")
    .toLowerCase()
    .includes("multipart/form-data");
}

export function assertContentLengthWithin(
  request: Request,
  maxBytes: number,
  message: string,
) {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new ApiError(413, message);
  }
}

/**
 * Reads an uploaded file from a form field. Structural detection keeps this
 * usable on runtimes where `File` is not a global constructor.
 */
export function readFormFile(form: FormData, field: string): File | null {
  const value = form.get(field);
  if (
    typeof value === "object" &&
    value !== null &&
    "arrayBuffer" in value &&
    "name" in value &&
    typeof value.name === "string"
  ) {
    return value as File;
  }
  return null;
}

export function readFormText(form: FormData, field: string) {
  const value = form.get(field);
  return typeof value === "string" ? value : null;
}

export interface PathParamRules {
  pattern: RegExp;
  message: string;
  status?: number;
  lowercase?: boolean;
}

export async function readPathParam<Key extends string>(
  params: Promise<Record<Key, string>>,
  key: Key,
  { pattern, message, status = 400, lowercase = false }: PathParamRules,
): Promise<string> {
  const raw = decodeURIComponent((await params)[key] ?? "");
  const value = lowercase ? raw.toLowerCase() : raw;
  if (!pattern.test(value)) {
    throw new ApiError(status, message);
  }
  return value;
}
