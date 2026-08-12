import { getStripeConfig } from "@/db";

export type StripeCheckoutSession = {
  id: string;
  url: string | null;
  payment_status?: string;
  status?: string;
};

export async function stripeRequest<T>(
  path: string,
  init: { method?: "GET" | "POST"; body?: URLSearchParams; idempotencyKey?: string } = {},
) {
  const { secretKey } = getStripeConfig();
  if (!secretKey) return null;
  const headers = new Headers({ Authorization: `Bearer ${secretKey}` });
  if (init.body) headers.set("Content-Type", "application/x-www-form-urlencoded");
  if (init.idempotencyKey) headers.set("Idempotency-Key", init.idempotencyKey);
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body,
  });
  const payload = (await response.json()) as T & { error?: { message?: string } };
  if (!response.ok) {
    throw new Error(payload.error?.message || "Stripe could not start checkout.");
  }
  return payload;
}

export async function verifyStripeSignature(rawBody: string, signatureHeader: string) {
  const { webhookSecret } = getStripeConfig();
  if (!webhookSecret) return false;
  const fields = signatureHeader.split(",").map((part) => part.trim().split("=", 2));
  const timestamp = fields.find(([key]) => key === "t")?.[1];
  const signatures = fields.filter(([key]) => key === "v1").map(([, value]) => value);
  if (!timestamp || !signatures.length || !/^\d+$/.test(timestamp)) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`),
  );
  const expected = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return signatures.some((candidate) => {
    if (candidate.length !== expected.length) return false;
    let mismatch = 0;
    for (let index = 0; index < expected.length; index += 1) {
      mismatch |= expected.charCodeAt(index) ^ candidate.charCodeAt(index);
    }
    return mismatch === 0;
  });
}
