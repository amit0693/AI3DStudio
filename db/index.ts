import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

type CommerceBindings = {
  DB?: D1Database;
  UPLOADS?: R2Bucket;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
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
