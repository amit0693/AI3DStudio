import type { Metadata } from "next";
import Link from "next/link";

import { SignInCard } from "@/app/components/auth/SignInCard";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const requested = (await searchParams).returnTo;
  const returnTo = requested?.startsWith("/") && !requested.startsWith("//")
    ? requested
    : "/account";

  return (
    <main className="auth-page">
      <Link className="policy-brand brand" href="/"><span className="brand-mark" /><span>BayLayer <b>Labs</b></span></Link>
      <SignInCard returnTo={returnTo} />
      <aside className="auth-benefits" aria-label="Account benefits">
        <span>01</span><div><strong>One account</strong><p>Use Google or your verified email on web and mobile.</p></div>
        <span>02</span><div><strong>Order history</strong><p>Every signed-in purchase is saved to your private account.</p></div>
        <span>03</span><div><strong>Secure by design</strong><p>Short-lived one-time codes, hashed verification records, and revocable sessions.</p></div>
      </aside>
    </main>
  );
}
