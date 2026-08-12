import type { ReactNode } from "react";
import Link from "next/link";

export function PolicyPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="policy-page">
      <Link className="policy-brand" href="/">BayLayer <b>Labs</b></Link>
      <article>
        <p className="eyebrow"><span /> CUSTOMER NOTICE</p>
        <h1>{title}</h1>
        <p className="policy-updated">Last updated {updated}</p>
        {children}
        <p><a href="mailto:baylayerlabs@gmail.com">Contact BayLayer Labs</a> with questions or deletion requests.</p>
      </article>
    </main>
  );
}
