import { getD1 } from "@/db";
import {
  ApiError,
  cleanEmail,
  cleanText,
  enforceRateLimit,
  handleApiError,
  json,
  readJsonObject,
} from "../products/_shared";

const ALLOWED_FEATURES = new Set(["ai-scan", "mobile-app", "custom-printing"]);
const ALLOWED_PHONE_TYPES = new Set(["iphone", "android", "other"]);
const WAITLIST_RATE_LIMIT = {
  bucket: "waitlist",
  limit: 5,
  windowSeconds: 600,
};

export async function POST(request: Request) {
  try {
    await enforceRateLimit(request, WAITLIST_RATE_LIMIT);

    const body = await readJsonObject(request, 16 * 1024);
    const email = cleanEmail(body.email)!;
    const name = cleanText(body.name, "name", 100);
    const feature = cleanText(body.feature, "feature", 32) ?? "ai-scan";
    const city = cleanText(body.city, "city", 80);
    const phoneType = cleanText(body.phoneType, "phoneType", 20)?.toLowerCase() ?? null;
    const intendedObject = cleanText(body.intendedObject, "intendedObject", 500);
    const source = cleanText(body.source, "source", 48) ?? "website";
    if (!ALLOWED_FEATURES.has(feature)) {
      throw new ApiError(400, "feature is invalid.");
    }
    if (phoneType && !ALLOWED_PHONE_TYPES.has(phoneType)) {
      throw new ApiError(400, "phoneType must be iphone, android, or other.");
    }
    if (body.marketingConsent !== true) {
      throw new ApiError(400, "Consent is required to join the email waitlist.");
    }
    if (!/^[a-zA-Z0-9._-]{1,48}$/.test(source)) {
      throw new ApiError(400, "source is invalid.");
    }

    await getD1()
      .prepare(
        `INSERT INTO waitlist_entries (
           id, email, name, feature, city, phone_type, intended_object,
           marketing_consent, source
         ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
         ON CONFLICT(email, feature) DO UPDATE SET
           name = excluded.name,
           city = excluded.city,
           phone_type = excluded.phone_type,
           intended_object = excluded.intended_object,
           marketing_consent = 1,
           source = excluded.source,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .bind(
        `wait_${crypto.randomUUID()}`,
        email,
        name,
        feature,
        city,
        phoneType,
        intendedObject,
        source,
      )
      .run();

    // The same response for inserts and updates avoids exposing list membership.
    return json(
      {
        joined: true,
        feature,
        message: "You're on the early-access list.",
      },
      201,
    );
  } catch (error) {
    return handleApiError(error);
  }
}
