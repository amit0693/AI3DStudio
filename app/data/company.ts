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
  execution: "on_demand";
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
  name: "Pilot launch system",
  summary: "Storefront and mobile foundation are built; the company is narrowing to eight validated offers and a measured launch.",
  lastUpdated: "2026-08-11",
  operatingNote: "Agents are project roles invoked for assigned work; they are not background services.",
} as const;

export const TEAM: TeamMember[] = [
  { id:"chief-executive", name:"Chief Executive", remit:"Priorities, capital gates, delegation, final decisions", status:"working", execution:"on_demand" },
  { id:"technology-lead", name:"Technology Lead", remit:"Web, mobile, data, deployment and reliability", status:"working", execution:"on_demand" },
  { id:"marketing-growth", name:"Marketing & Growth", remit:"Positioning, listings, content tests and acquisition", status:"configured", execution:"on_demand" },
  { id:"brand-design", name:"Brand Design", remit:"Conversion UX, reusable assets and brand consistency", status:"configured", execution:"on_demand" },
  { id:"product-research", name:"Product Research", remit:"Demand signals, offer scorecards and experiment briefs", status:"configured", execution:"on_demand" },
  { id:"operations-supply", name:"Operations & Supply", remit:"Materials, vendors, production, packing and shipping", status:"configured", execution:"on_demand" },
  { id:"finance-unit-economics", name:"Finance & Unit Economics", remit:"Contribution margin, pricing, cash and scale gates", status:"configured", execution:"on_demand" },
  { id:"quality-verification", name:"Quality & Verification", remit:"Claims, checkout, product safety and release evidence", status:"working", execution:"on_demand" },
];

export const INITIATIVES: Initiative[] = [
  { id:"platform", title:"Commerce foundation", owner:"technology-lead", status:"complete", progress:100, outcome:"Web storefront, PWA and iOS/Android Expo apps built and validated", next:"Keep mobile aligned with validated web offers" },
  { id:"strategy", title:"Market and operating strategy", owner:"chief-executive", status:"complete", progress:100, outcome:"Eight-offer launch, supply, shipping and channel sequence approved", next:"Enforce gates before expanding the catalog" },
  { id:"agents", title:"Lean company agent team", owner:"chief-executive", status:"complete", progress:100, outcome:"Eight on-demand roles with clear decision rights", next:"Run assignments through the tracker; close with evidence" },
  { id:"catalog", title:"Launch catalog focus", owner:"product-research", status:"in_progress", progress:85, outcome:"Primary catalog narrowed from broad research inventory", next:"Verify samples, copy, prices and production times" },
  { id:"supply", title:"Pilot material and packaging buy", owner:"operations-supply", status:"queued", progress:20, outcome:"Lean $350–$450 pilot inventory", next:"Quote SUNLU, Elegoo and Bambu; buy only approved colors" },
  { id:"acquisition", title:"First 50 paid orders", owner:"marketing-growth", status:"gated", progress:10, outcome:"Direct, Etsy and local proof before channel expansion", next:"Publish listings after QA and margin sign-off" },
  { id:"verification", title:"Release and economics verification", owner:"quality-verification", status:"in_progress", progress:65, outcome:"Build, lint and app export checks passed", next:"Test scan links, personalization, packaging and checkout" },
];

export const KPI_TARGETS: KpiTarget[] = [
  { id:"aov", label:"Average order value", target:">= $45", owner:"marketing-growth", gate:"Bundle or reprice before paid acquisition" },
  { id:"direct-margin", label:"Direct contribution margin", target:">= 50%", owner:"finance-unit-economics", gate:"No direct offer launches below target" },
  { id:"market-margin", label:"Marketplace contribution margin", target:">= 40%", owner:"finance-unit-economics", gate:"Include fees, labor, packaging and shipping" },
  { id:"failure", label:"Print failure rate", target:"<= 8% pilot, then <= 5%", owner:"quality-verification", gate:"Pause SKU and correct profile if missed" },
  { id:"returns", label:"Returns or shipping damage", target:"<= 3%", owner:"operations-supply", gate:"Repair packaging or product before scaling" },
  { id:"ontime", label:"On-time shipment", target:">= 95%", owner:"operations-supply", gate:"Reduce intake or extend lead time if missed" },
  { id:"shipping", label:"Direct free-shipping threshold", target:"$65", owner:"finance-unit-economics", gate:"Calculated shipping below threshold" },
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
];

export const CHANNEL_ROADMAP: ChannelStep[] = [
  { order:1, channel:"Owned site", status:"in_progress", rule:"Free shipping at $65; calculated below", owner:"technology-lead" },
  { order:2, channel:"Etsy", status:"queued", rule:"List personalized and event offers first", owner:"marketing-growth" },
  { order:3, channel:"Local sales", status:"queued", rule:"Use pickup for bulky planters and B2B samples", owner:"operations-supply" },
  { order:4, channel:"eBay", status:"gated", rule:"Use for functional replacement and hobby products", owner:"marketing-growth" },
  { order:5, channel:"TikTok", status:"gated", rule:"Enter only after repeatable production content", owner:"brand-design" },
  { order:6, channel:"Amazon Handmade", status:"gated", rule:"Consider after 50–100 fulfilled orders", owner:"chief-executive" },
];

export const DECISIONS: Decision[] = [
  { id:"position", decision:"Sell made-to-order personalization and small-business solutions, not generic prints", owner:"chief-executive", status:"approved" },
  { id:"inventory", decision:"Use SUNLU as primary value filament, Elegoo as backup, Bambu for premium jobs", owner:"operations-supply", status:"verify" },
  { id:"shipping", decision:"Use Pirate Ship; default to USPS Ground under 2 lb and compare UPS for larger parcels", owner:"operations-supply", status:"verify" },
  { id:"packaging", decision:"Standardize 8×6×4, 10×8×6 and 14×11×10 inch boxes", owner:"operations-supply", status:"verify" },
  { id:"imagery", decision:"Reuse approved product imagery; generate new assets only when a test requires them", owner:"brand-design", status:"approved" },
  { id:"scope", decision:"Keep non-launch catalog as research inventory, not primary navigation", owner:"product-research", status:"approved" },
];
