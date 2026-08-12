import { toNextJsHandler } from "better-auth/next-js";

import { auth, authAvailability } from "@/lib/auth";

export const dynamic = "force-dynamic";

const handlers = toNextJsHandler(auth);

function unavailable(request: Request) {
  if (!authAvailability.core) {
    return "Authentication is not configured yet.";
  }

  const pathname = new URL(request.url).pathname;
  if (pathname.includes("email-otp") && !authAvailability.emailOtp) {
    return "Email verification is not configured yet.";
  }
  if (pathname.includes("sign-in/social") && !authAvailability.google) {
    return "Google sign-in is not configured yet.";
  }
  return null;
}

export async function GET(request: Request) {
  const message = unavailable(request);
  return message
    ? Response.json({ error: message }, { status: 503 })
    : handlers.GET(request);
}

export async function POST(request: Request) {
  const message = unavailable(request);
  return message
    ? Response.json({ error: message }, { status: 503 })
    : handlers.POST(request);
}
