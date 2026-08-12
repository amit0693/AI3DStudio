import { ApiError } from "./errors";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export function oneOf<T extends string>(
  value: string,
  allowed: ReadonlySet<T>,
  message: string,
): T {
  if (!allowed.has(value as T)) {
    throw new ApiError(400, message);
  }
  return value as T;
}

export function parseJsonColumn<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
