import type { Metadata } from "next";
import Link from "next/link";
import "./success.css";
import { PaymentReturnStatus } from "./PaymentReturnStatus";

export const metadata: Metadata = { title: "Order received" };

export default async function CheckoutSuccess({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  const safeToken = order && /^[a-f0-9]{64}$/.test(order) ? order : null;
  return (
    <main className="checkout-success">
      <section>
        <p>BAYLAYER LABS · PAYMENT RETURN</p>
        <span aria-hidden="true">✓</span>
        <h1>Payment submitted.<br /><em>We’re verifying your order.</em></h1>
        <p>Stripe sends the final payment confirmation securely. Your order page updates from that verified event—never from the browser redirect alone.</p>
        {safeToken ? <PaymentReturnStatus token={safeToken} /> : null}
        {safeToken ? <div className="success-actions"><Link href={`/orders/${safeToken}`}>Track this order</Link><a href={`baylayer://orders?token=${safeToken}`}>Open in the app</a></div> : <Link href="/">Return to the shop</Link>}
        <small>Do not close a pending bank-payment window until Stripe confirms it is complete.</small>
      </section>
    </main>
  );
}
