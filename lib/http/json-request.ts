/**
 * Sends a request and returns the parsed JSON payload, turning both transport
 * failures and `{ error }` payloads into a thrown `Error`.
 */
export async function requestJson<T>(
  url: string,
  init: RequestInit,
  fallbackError: string,
): Promise<T> {
  const response = await fetch(url, init);
  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;

  if (!response.ok || !payload || payload.error) {
    throw new Error(payload?.error || fallbackError);
  }
  return payload;
}

export function postJson<T>(
  url: string,
  body: unknown,
  fallbackError: string,
): Promise<T> {
  return requestJson<T>(
    url,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    fallbackError,
  );
}

export function postFormData<T>(
  url: string,
  body: FormData,
  fallbackError: string,
): Promise<T> {
  return requestJson<T>(url, { method: "POST", body }, fallbackError);
}
