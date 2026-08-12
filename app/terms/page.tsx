import { PolicyPage } from "@/app/components/PolicyPage";

export default function TermsPage() {
  return (
    <PolicyPage title="Preview terms" updated="August 11, 2026">
      <h2>Preview status</h2>
      <p>This is a non-transactional product preview. Cart totals and instant estimates are planning information, not accepted orders or binding offers. Checkout remains unavailable.</p>
      <h2>Estimate limitations</h2>
      <p>Automated estimates assume millimeter units and simplified print settings. Final orientation, support material, strength, surface quality, shipping, tax, lead time, and feasibility require human review.</p>
      <h2>Acceptable use</h2>
      <p>You may not use the service for unlawful, dangerous, infringing, deceptive, weapons-related, or rights-violating designs. We may reject any request.</p>
      <h2>No warranty</h2>
      <p>The preview is provided as available and may change. Production terms, returns, warranties, and fulfillment commitments will be published before paid ordering opens.</p>
    </PolicyPage>
  );
}
