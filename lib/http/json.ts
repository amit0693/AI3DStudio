/**
 * Reads a JSON payload from a fetch response and converts failures into
 * actionable errors. Non-JSON bodies (proxy errors, empty responses) surface
 * the HTTP status instead of a parser message.
 */
export async function readJsonResponse<T>(
  response: Response,
  fallbackMessage: string,
): Promise<T> {
  const statusSuffix = ` (HTTP ${response.status})`;
  let text: string;
  try {
    text = await response.text();
  } catch {
    throw new Error(`${fallbackMessage}${statusSuffix}`);
  }

  let payload: unknown = null;
  if (text.trim()) {
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(`${fallbackMessage}${statusSuffix}`);
    }
  }

  const serverMessage =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as { error?: unknown }).error
      : undefined;
  const errorMessage = typeof serverMessage === "string" ? serverMessage : null;

  if (!response.ok) {
    throw new Error(errorMessage ?? `${fallbackMessage}${statusSuffix}`);
  }
  if (errorMessage) throw new Error(errorMessage);
  if (payload === null) {
    throw new Error(`${fallbackMessage}${statusSuffix}`);
  }
  return payload as T;
}
