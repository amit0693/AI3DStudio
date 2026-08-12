import { env } from "cloudflare:workers";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

type CommerceBindings = {
  DB?: D1Database;
  UPLOADS?: R2Bucket;
};

/** Raised when a Cloudflare storage binding is missing from the environment. */
export class StorageBindingError extends Error {
  constructor(
    readonly binding: "DB" | "UPLOADS",
    message: string,
  ) {
    super(message);
    this.name = "StorageBindingError";
  }
}

function bindings(): CommerceBindings {
  return env as unknown as CommerceBindings;
}

export function getD1(): D1Database {
  const database = bindings().DB;
  if (!database) {
    throw new StorageBindingError(
      "DB",
      "Cloudflare D1 binding `DB` is unavailable. Configure the `d1` field in .openai/hosting.json.",
    );
  }
  return database;
}

export function getUploadsBucket(): R2Bucket {
  const bucket = bindings().UPLOADS;
  if (!bucket) {
    throw new StorageBindingError(
      "UPLOADS",
      "Cloudflare R2 binding `UPLOADS` is unavailable. Configure the `r2` field in .openai/hosting.json.",
    );
  }
  return bucket;
}

export function getDb() {
  return drizzle(getD1(), { schema });
}
