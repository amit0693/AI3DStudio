import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/app/components/auth/SignOutButton";
import { getD1 } from "@/db";
import { auth, authAvailability } from "@/lib/auth";

export const metadata: Metadata = { title: "Your account" };
export const dynamic = "force-dynamic";

type AccountOrder = {
  order_number: string;
  public_token: string;
  status: string;
  payment_status: string;
  total_cents: number;
  created_at: string;
};

export default async function AccountPage() {
  if (!authAvailability.core) redirect("/sign-in?returnTo=/account");
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in?returnTo=/account");

  const result = await getD1()
    .prepare(`SELECT order_number, public_token, status, payment_status, total_cents, created_at
              FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`)
    .bind(session.user.id)
    .all<AccountOrder>();

  return (
    <main className="account-page">
      <header className="account-header">
        <Link className="brand" href="/"><span className="brand-mark" /><span>BayLayer <b>Labs</b></span></Link>
        <SignOutButton />
      </header>
      <section className="account-hero">
        <p className="eyebrow"><span /> Your customer account</p>
        <h1>Hello, <em>{session.user.name || session.user.email.split("@")[0]}.</em></h1>
        <div className="account-identity">
          {/* OAuth avatars can come from provider hosts that are not known at build time. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {session.user.image && <img src={session.user.image} alt="" referrerPolicy="no-referrer" />}
          <div><strong>{session.user.email}</strong><span>✓ Verified email</span></div>
        </div>
      </section>
      <section className="account-orders">
        <div><p className="eyebrow"><span /> Purchase history</p><h2>Your orders</h2></div>
        {result.results.length ? (
          <div className="account-order-list">
            {result.results.map((order) => <Link key={order.order_number} href={`/orders/${order.public_token}`}>
              <span><small>Order</small><strong>{order.order_number}</strong></span>
              <span><small>Placed</small><strong>{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong></span>
              <span><small>Status</small><strong>{order.payment_status === "paid" ? order.status.replaceAll("_", " ") : "Payment pending"}</strong></span>
              <span><small>Total</small><strong>${(order.total_cents / 100).toFixed(2)}</strong></span>
              <b aria-hidden="true">→</b>
            </Link>)}
          </div>
        ) : (
          <div className="account-empty"><h3>No account orders yet.</h3><p>Orders placed while you are signed in will appear here automatically.</p><Link className="button button-dark" href="/#catalog">Shop the collection</Link></div>
        )}
      </section>
    </main>
  );
}
