export type AgentId =
  | "chief-executive"
  | "technology-lead"
  | "marketing-growth"
  | "brand-design"
  | "product-research"
  | "operations-supply"
  | "finance-unit-economics"
  | "quality-verification";

export type WorkStatus = "complete" | "in_progress" | "queued" | "gated";

export type TeamMember = {
  id: AgentId; name: string; remit: string; status: "configured" | "working";
  execution: "on_demand"; budgetMode: "lean";
};
export type Initiative = {
  id: string; title: string; owner: AgentId; status: WorkStatus; progress: number;
  outcome: string; next: string;
};
export type KpiTarget = {
  id: string; label: string; target: string; owner: AgentId; gate: string;
};
export type LaunchProduct = {
  name: string; price: string; owner: AgentId; segment: string; status: "launch";
};
export type ChannelStep = {
  order: number; channel: string; status: WorkStatus; rule: string; owner: AgentId;
};
export type Decision = {
  id: string; decision: string; owner: AgentId; status: "approved" | "verify";
};

export const COMPANY_PHASE = {
  name: "Pilot launch build",
  summary: "Web, mobile, and server-checkout work are in progress. Launch remains gated by production payment validation, public access, and store credentials.",
  lastUpdated: "2026-08-11",
  operatingNote: "Agents run on demand in short, bounded assignments; they are not background services.",
  lowTokenRules: ["One owner per task", "Read only scoped files", "Report evidence, blockers, and next action", "Stop when the acceptance gate is met"],
} as const;

export const TEAM: TeamMember[] = [
  { id:"chief-executive", name:"Chief Executive", remit:"Priorities, capital gates, delegation, final decisions", status:"working", execution:"on_demand", budgetMode:"lean" },
  { id:"technology-lead", name:"Technology Lead", remit:"Web, mobile, data, deployment and reliability", status:"working", execution:"on_demand", budgetMode:"lean" },
  { id:"marketing-growth", name:"Marketing & Growth", remit:"Positioning, listings, content tests and acquisition", status:"configured", execution:"on_demand", budgetMode:"lean" },
  { id:"brand-design", name:"Brand Design", remit:"Conversion UX, reusable assets and brand consistency", status:"configured", execution:"on_demand", budgetMode:"lean" },
  { id:"product-research", name:"Product Research", remit:"Demand signals, offer scorecards and experiment briefs", status:"configured", execution:"on_demand", budgetMode:"lean" },
  { id:"operations-supply", name:"Operations & Supply", remit:"Materials, vendors, production, packing and shipping", status:"configured", execution:"on_demand", budgetMode:"lean" },
  { id:"finance-unit-economics", name:"Finance & Unit Economics", remit:"Contribution margin, pricing, cash and scale gates", status:"configured", execution:"on_demand", budgetMode:"lean" },
  { id:"quality-verification", name:"Quality & Verification", remit:"Claims, checkout, product safety and release evidence", status:"working", execution:"on_demand", budgetMode:"lean" },
];

export const INITIATIVES: Initiative[] = [
  { id:"platform", title:"Commerce foundation", owner:"technology-lead", status:"in_progress", progress:78, outcome:"Web storefront, PWA, APIs and Expo app foundations are implemented", next:"Complete production checkout and end-to-end order validation" },
  { id:"strategy", title:"Market and operating strategy", owner:"chief-executive", status:"complete", progress:100, outcome:"21-offer launch, supply, shipping and channel sequence approved", next:"Enforce gates before expanding the catalog" },
  { id:"agents", title:"Lean company agent team", owner:"chief-executive", status:"complete", progress:100, outcome:"Eight on-demand roles with clear decision rights", next:"Run assignments through the tracker; close with evidence" },
  { id:"catalog", title:"21-SKU catalog migration", owner:"product-research", status:"in_progress", progress:80, outcome:"Launch assortment and pricing are approved; web and mobile migration is underway", next:"Verify all 21 SKUs, assets, copy, prices and production times across clients" },
  { id:"payments", title:"Server checkout and payment verification", owner:"technology-lead", status:"in_progress", progress:68, outcome:"Server-created Stripe checkout, order records and webhook handling are implemented", next:"Add production Stripe secrets, register the webhook and complete a live payment-to-order test" },
  { id:"mobile-orders", title:"Mobile checkout and order flow", owner:"technology-lead", status:"in_progress", progress:65, outcome:"Mobile cart, checkout handoff and order surfaces are being connected to server APIs", next:"Validate purchase return, order refresh and failure recovery on iOS and Android" },
  { id:"supply", title:"Pilot material and packaging buy", owner:"operations-supply", status:"queued", progress:20, outcome:"Lean $350–$450 pilot inventory using verified value and premium baselines", next:"Confirm ELEGOO landed order, keep Bambu as premium or backup, and sample SUNLU only after a written quote" },
  { id:"release", title:"Web and app-store release readiness", owner:"quality-verification", status:"gated", progress:35, outcome:"Release paths are defined but no public production release is approved", next:"Clear payment keys, public site access, Expo credentials, Apple signing and Google Play credentials" },
  { id:"acquisition", title:"First 50 paid orders", owner:"marketing-growth", status:"gated", progress:5, outcome:"Direct, Etsy and local proof will precede channel expansion", next:"Publish only after payment, QA, sample and margin sign-off" },
  { id:"verification", title:"Product and economics verification", owner:"quality-verification", status:"in_progress", progress:48, outcome:"Code checks support development readiness; product and transaction evidence remain open", next:"Test scan links, personalization, sample quality, packaging, checkout and contribution margin" },
];

export const KPI_TARGETS: KpiTarget[] = [
  { id:"aov", label:"Average order value", target:">= $45", owner:"marketing-growth", gate:"Bundle or reprice before paid acquisition" },
  { id:"direct-margin", label:"Direct contribution margin", target:">= 50%", owner:"finance-unit-economics", gate:"No direct offer launches below target" },
  { id:"market-margin", label:"Marketplace contribution margin", target:">= 40%", owner:"finance-unit-economics", gate:"Include fees, labor, packaging and shipping" },
  { id:"failure", label:"Print failure rate", target:"<= 8% pilot, then <= 5%", owner:"quality-verification", gate:"Pause SKU and correct profile if missed" },
  { id:"returns", label:"Returns or shipping damage", target:"<= 3%", owner:"operations-supply", gate:"Repair packaging or product before scaling" },
  { id:"ontime", label:"On-time shipment", target:">= 95%", owner:"operations-supply", gate:"Reduce intake or extend lead time if missed" },
  { id:"shipping", label:"Direct shipping policy", target:"$6.99 below $65 · free at $65", owner:"finance-unit-economics", gate:"Revalidate rates before release and after carrier surcharges change" },
  { id:"utilization", label:"Printer utilization scale gate", target:"> 65% for 4 weeks", owner:"chief-executive", gate:"No added printer capacity before threshold" },
];

export const LAUNCH_PRODUCTS: LaunchProduct[] = [
  { name:"QR / NFC Business Sign", price:"$34.99 · bundle $59.99", owner:"marketing-growth", segment:"Small business", status:"launch" },
  { name:"Photo Lithophane Night Light", price:"$39.99", owner:"brand-design", segment:"Personalized gift", status:"launch" },
  { name:"Pet Memorial Stand", price:"$39.99", owner:"brand-design", segment:"Personalized gift", status:"launch" },
  { name:"Teacher / Office Nameplate", price:"$29.99", owner:"marketing-growth", segment:"Gift and office", status:"launch" },
  { name:"Wedding Place Names", price:"$3.49 each · minimum 20", owner:"operations-supply", segment:"Events", status:"launch" },
  { name:"Replacement-Part Design Service", price:"From $39 setup", owner:"product-research", segment:"Custom service", status:"launch" },
  { name:"Modular Hobby Paint Rack", price:"$39.99 + expansions", owner:"product-research", segment:"Hobby system", status:"launch" },
  { name:"Self-Watering Planter", price:"$31.99 local · $39.99 shipped pair", owner:"operations-supply", segment:"Home and plant", status:"launch" },
  { name:"Custom Name Desk Sign", price:"$24.99", owner:"brand-design", segment:"Personalized gift", status:"launch" },
  { name:"Personalized Name Bag Tag", price:"$7.99", owner:"brand-design", segment:"Personalized gift", status:"launch" },
  { name:"Propagation Station", price:"$29.99", owner:"operations-supply", segment:"Home and plant", status:"launch" },
  { name:"Geometric Planter Trio", price:"$32.99", owner:"operations-supply", segment:"Home and plant", status:"launch" },
  { name:"Hanging Air-Plant Holder", price:"$16.99", owner:"operations-supply", segment:"Home and plant", status:"launch" },
  { name:"Modular Tabletop Token Trays", price:"$18.99", owner:"product-research", segment:"Hobby system", status:"launch" },
  { name:"Trading-Card Display Stands", price:"$14.99", owner:"product-research", segment:"Hobby system", status:"launch" },
  { name:"Universal Board-Game Organizer", price:"$29.99", owner:"product-research", segment:"Hobby system", status:"launch" },
  { name:"Personalized Holiday Ornament", price:"$14.99", owner:"marketing-growth", segment:"Seasonal gift", status:"launch" },
  { name:"Valentine Coordinates Keepsake", price:"$19.99", owner:"marketing-growth", segment:"Seasonal gift", status:"launch" },
  { name:"Family Photo Lithophane", price:"$34.99", owner:"marketing-growth", segment:"Seasonal gift", status:"launch" },
  { name:"Table Number Set", price:"$49.99", owner:"operations-supply", segment:"Events", status:"launch" },
  { name:"Branded Bag Tags", price:"$99", owner:"marketing-growth", segment:"Small business", status:"launch" },
];

export const CHANNEL_ROADMAP: ChannelStep[] = [
  { order:1, channel:"Owned site", status:"gated", rule:"Open after live payment validation; $6.99 flat US shipping below $65 and free at $65", owner:"technology-lead" },
  { order:2, channel:"Etsy", status:"queued", rule:"List personalized and event offers first", owner:"marketing-growth" },
  { order:3, channel:"Local sales", status:"queued", rule:"Use pickup for bulky planters and B2B samples", owner:"operations-supply" },
  { order:4, channel:"eBay", status:"gated", rule:"Use for functional replacement and hobby products", owner:"marketing-growth" },
  { order:5, channel:"TikTok", status:"gated", rule:"Enter only after repeatable production content", owner:"brand-design" },
  { order:6, channel:"Amazon Handmade", status:"gated", rule:"Consider after 50–100 fulfilled orders", owner:"chief-executive" },
];

export const DECISIONS: Decision[] = [
  { id:"position", decision:"Sell made-to-order personalization and small-business solutions, not generic prints", owner:"chief-executive", status:"approved" },
  { id:"inventory", decision:"Use ELEGOO's verified US pricing as the value baseline and Bambu as premium or backup; treat SUNLU as quote-only until landed price and a sample pass", owner:"operations-supply", status:"verify" },
  { id:"shipping", decision:"Phase 1 uses $6.99 flat US shipping below $65 and free shipping at $65; validate Pirate Ship USPS and UPS rates before release because temporary carrier surcharges remain active", owner:"operations-supply", status:"verify" },
  { id:"packaging", decision:"Standardize 8×6×4, 10×8×6 and 14×11×10 inch boxes", owner:"operations-supply", status:"verify" },
  { id:"imagery", decision:"Reuse approved product imagery; generate new assets only when a test requires them", owner:"brand-design", status:"approved" },
  { id:"scope", decision:"Keep non-launch catalog as research inventory, not primary navigation", owner:"product-research", status:"approved" },
  { id:"payment-release", decision:"Do not release commerce until Stripe keys, webhook delivery and a live payment-to-order path are verified", owner:"quality-verification", status:"verify" },
  { id:"store-release", decision:"Gate web and mobile releases on public access plus Expo, Apple and Google store credentials", owner:"technology-lead", status:"verify" },
];
