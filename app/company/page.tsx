import type { Metadata } from "next";
import Link from "next/link";
import {
  CHANNEL_ROADMAP, COMPANY_PHASE, DECISIONS, INITIATIVES,
  KPI_TARGETS, LAUNCH_PRODUCTS, TEAM,
} from "@/app/data/company";
import "./company.css";

export const metadata: Metadata = {
  title: "Company Operating Tracker",
  description: "BayLayer Labs launch priorities, owners, metrics, and verification gates.",
};

const statusLabel = (value: string) => value.replace("_", " ");

export default function CompanyTracker() {
  const overall = Math.round(INITIATIVES.reduce((sum, item) => sum + item.progress, 0) / INITIATIVES.length);
  const ownerName = (id: string) => TEAM.find((member) => member.id === id)?.name ?? id;

  return (
    <main className="company-shell">
      <header className="company-header">
        <Link className="company-brand" href="/" aria-label="BayLayer Labs storefront"><i />BayLayer <b>Labs</b></Link>
        <nav aria-label="Company tracker navigation"><a href="#priorities">Priorities</a><a href="#team">Team</a><a href="#metrics">Metrics</a><Link href="/">Storefront ↗</Link></nav>
      </header>

      <section className="command" aria-labelledby="company-title">
        <div className="command-copy">
          <p className="company-kicker">INTERNAL OPERATING VIEW · UPDATED {COMPANY_PHASE.lastUpdated}</p>
          <h1 id="company-title">The pilot is focused.<br /><em>Evidence decides what scales.</em></h1>
          <p>{COMPANY_PHASE.summary}</p>
          <div className="command-actions"><a href="#priorities">Review priorities</a><a href="mailto:baylayerlabs@gmail.com?subject=BayLayer%20Labs%20operating%20review">Request a review</a></div>
        </div>
        <aside className="ceo-card" aria-label="CEO operating status">
          <div><span>CEO STATUS</span><b className="live-dot">Operating</b></div>
          <strong>{overall}%</strong><small>launch-system readiness</small>
          <div className="readiness"><i style={{ width: `${overall}%` }} /></div>
          <dl><div><dt>Active company priorities</dt><dd>3 max</dd></div><div><dt>Launch offers</dt><dd>{LAUNCH_PRODUCTS.length}</dd></div><div><dt>Execution mode</dt><dd>On demand</dd></div></dl>
          <p>{COMPANY_PHASE.operatingNote}</p>
        </aside>
      </section>

      <section className="tracker-section" id="priorities">
        <div className="tracker-heading"><div><p>01 · EXECUTION</p><h2>Company priorities</h2></div><span>Owner → evidence → verification</span></div>
        <div className="initiative-grid">{INITIATIVES.map((item) => <article key={item.id} className="initiative-card">
          <div><span className={`status status-${item.status}`}>{statusLabel(item.status)}</span><small>{ownerName(item.owner)}</small></div>
          <h3>{item.title}</h3><p>{item.outcome}</p>
          <div className="progress" aria-label={`${item.progress}% complete`}><i style={{ width: `${item.progress}%` }} /></div>
          <footer><b>{item.progress}%</b><span>Next: {item.next}</span></footer>
        </article>)}</div>
      </section>

      <section className="tracker-section team-section" id="team">
        <div className="tracker-heading"><div><p>02 · OWNERSHIP</p><h2>Lean agent team</h2></div><span>Configured for short, bounded assignments</span></div>
        <div className="team-grid">{TEAM.map((member, index) => <article key={member.id}>
          <div className="agent-id"><span>{String(index + 1).padStart(2, "0")}</span><i className={member.status} /></div>
          <h3>{member.name}</h3><p>{member.remit}</p>
          <footer><code>{member.id}</code><span>{member.status} · {statusLabel(member.execution)}</span></footer>
        </article>)}</div>
      </section>

      <section className="tracker-section" id="metrics">
        <div className="tracker-heading"><div><p>03 · CONTROL</p><h2>Scale gates</h2></div><span>Targets are gates, not vanity metrics</span></div>
        <div className="kpi-grid">{KPI_TARGETS.map((item) => <article key={item.id}>
          <p>{item.label}</p><strong>{item.target}</strong><span>{item.gate}</span><small>{ownerName(item.owner)}</small>
        </article>)}</div>
      </section>

      <section className="split-section">
        <div className="launch-list"><div className="tracker-heading compact"><div><p>04 · ASSORTMENT</p><h2>Eight launch offers</h2></div></div>
          {LAUNCH_PRODUCTS.map((product, index) => <article key={product.name}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{product.name}</h3><p>{product.segment} · {ownerName(product.owner)}</p></div><strong>{product.price}</strong></article>)}
        </div>
        <div className="roadmap"><div className="tracker-heading compact"><div><p>05 · DISTRIBUTION</p><h2>Channel sequence</h2></div></div>
          {CHANNEL_ROADMAP.map((step) => <article key={step.channel}><span>{step.order}</span><div><h3>{step.channel}</h3><p>{step.rule}</p></div><b className={`status status-${step.status}`}>{statusLabel(step.status)}</b></article>)}
        </div>
      </section>

      <section className="decision-section">
        <div className="tracker-heading"><div><p>06 · GOVERNANCE</p><h2>Decision and verification log</h2></div><span>Green is approved; amber needs field evidence</span></div>
        <div>{DECISIONS.map((item) => <article key={item.id}><span className={`decision-mark ${item.status}`} /> <p>{item.decision}</p><small>{ownerName(item.owner)}</small><b>{item.status}</b></article>)}</div>
      </section>

      <footer className="company-footer"><div><b>BayLayer Labs</b><span>Ideas, made local.</span></div><p>This tracker records an on-demand agent operating model. It does not imply continuous autonomous activity.</p><Link href="/">Return to storefront →</Link></footer>
    </main>
  );
}
