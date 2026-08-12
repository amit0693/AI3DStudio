import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

type CommerceBindings = {
  DB?: D1Database;
  UPLOADS?: R2Bucket;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  RESEND_API_KEY?: string;
  AUTH_EMAIL_FROM?: string;
};

function bindings(): CommerceBindings {
  return env as unknown as CommerceBindings;
}

export function getD1(): D1Database {
  const database = bindings().DB;
  if (!database) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Configure the `d1` field in .openai/hosting.json.",
    );
  }
  return database;
}

export function getUploadsBucket(): R2Bucket {
  const bucket = bindings().UPLOADS;
  if (!bucket) {
    throw new Error(
      "Cloudflare R2 binding `UPLOADS` is unavailable. Configure the `r2` field in .openai/hosting.json.",
    );
  }
  return bucket;
}

export function getDb() {
  return drizzle(getD1(), { schema });
}

export function getStripeConfig() {
  const runtime = bindings();
  return {
    secretKey: runtime.STRIPE_SECRET_KEY?.trim() || null,
    webhookSecret: runtime.STRIPE_WEBHOOK_SECRET?.trim() || null,
  };
}

export function getAuthConfig() {
  const runtime = bindings();
  const baseUrl =
    runtime.BETTER_AUTH_URL?.trim() ||
    (process.env.NODE_ENV === "production"
      ? "https://baylayer-labs.amitcodecraft.chatgpt.site"
      : "http://localhost:3000");

  return {
    baseUrl,
    secret: runtime.BETTER_AUTH_SECRET?.trim() || null,
    googleClientId: runtime.GOOGLE_CLIENT_ID?.trim() || null,
    googleClientSecret: runtime.GOOGLE_CLIENT_SECRET?.trim() || null,
    resendApiKey: runtime.RESEND_API_KEY?.trim() || null,
    emailFrom:
      runtime.AUTH_EMAIL_FROM?.trim() ||
      "BayLayer Labs <sign-in@baylayerlabs.com>",
  };
}
