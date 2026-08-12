import type { Metadata } from "next";
import Link from "next/link";
import "./order.css";

export const metadata: Metadata = { title: "Track order" };

export default async function OrderPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const valid = /^[a-f0-9]{64}$/.test(token);
  return (
    <main className="order-track">
      <section data-order-token={valid ? token : undefined}>
        <p>BAYLAYER LABS · ORDER TRACKING</p>
        <h1>{valid ? "Your made-to-order progress." : "Order link unavailable."}</h1>
        {valid ? <><div id="order-status" aria-live="polite">Loading verified order status…</div><script dangerouslySetInnerHTML={{ __html: `fetch('/api/orders/${token}').then(r=>r.json().then(b=>({r,b}))).then(({r,b})=>{const e=document.getElementById('order-status');if(!r.ok)throw new Error(b.error||'Order unavailable');const o=b.order;e.innerHTML='<strong>'+o.orderNumber+'</strong><span>Order: '+o.status.replaceAll('_',' ')+'</span><span>Payment: '+o.paymentStatus.replaceAll('_',' ')+'</span><span>Total: '+new Intl.NumberFormat('en-US',{style:'currency',currency:o.amounts.currency}).format(o.amounts.totalCents/100)+'</span>';}).catch(x=>{document.getElementById('order-status').textContent=x.message;});` }} /></> : <p>This tracking token is invalid.</p>}
        <Link href="/">Return to shop</Link>
      </section>
    </main>
  );
}
