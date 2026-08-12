import { PolicyPage } from "@/app/components/PolicyPage";

export default function TermsPage() {
  return (
    <PolicyPage title="Shop terms" updated="August 12, 2026">
      <h2>Orders and payment</h2>
      <p>Prices are in US dollars. The server confirms product price, minimum quantity, shipping, and customization requirements before redirecting to Stripe. Shipping and tax are shown before payment. An order is accepted after payment is verified and any required file, rights, safety, and printability review is complete; we will refund a declined paid order.</p>
      <h2>Production and estimates</h2>
      <p>Production times are business-day estimates, not delivery guarantees. Automated STL estimates assume millimeter units and simplified print settings. Final orientation, support material, strength, surface quality, price, lead time, and feasibility require human review.</p>
      <h2>Acceptable use</h2>
      <p>You may not use the service for unlawful, dangerous, infringing, deceptive, weapons-related, or rights-violating designs. We may reject any request.</p>
      <h2>Changes, cancellations, and returns</h2>
      <p>Contact us immediately to request a change or cancellation. Because personalized and made-to-order goods are produced for you, change-of-mind returns are not accepted once production begins. Report an incorrect item, manufacturing defect, or shipping damage within 14 days of delivery with photos; after review, we will repair, replace, or refund the affected item. This policy does not limit rights that cannot be waived by law.</p>
      <h2>Product use</h2>
      <p>Follow the material, care, and safety guidance shown with each product. 3D-printed goods may show layer lines and normal small-batch variation. Products are not food-safe, medical, child-safety, electrical, pressure-bearing, automotive-safety, or load-bearing equipment unless explicitly tested and sold for that use.</p>
      <h2>Contact</h2>
      <p>Questions about an order, cancellation, or return can be sent to <a href="mailto:baylayerlabs@gmail.com">baylayerlabs@gmail.com</a>.</p>
    </PolicyPage>
  );
}
