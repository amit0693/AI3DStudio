import { authAvailability } from "@/lib/auth";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    {
      enabled: authAvailability.core,
      google: authAvailability.core && authAvailability.google,
      emailOtp: authAvailability.core && authAvailability.emailOtp,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
