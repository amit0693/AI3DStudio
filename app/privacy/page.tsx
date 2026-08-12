import { PolicyPage } from "@/app/components/PolicyPage";

export default function PrivacyPage() {
  return (
    <PolicyPage title="Privacy notice" updated="August 12, 2026">
      <h2>What we collect</h2>
      <p>When you order or request a quote, we may collect your name, email, phone number, shipping address, order selections, notes, uploaded photos or model files, filenames, and technical print preferences. The early-access form collects your email and consent choice. Basic service logs may include device, browser, request, and security information.</p>
      <h2>How information is used</h2>
      <p>We use this information to price and fulfill orders, review files and printability, provide support, prevent abuse, maintain order records, and send product updates only when you explicitly consent.</p>
      <h2>Payments and service providers</h2>
      <p>Card details are entered directly in Stripe’s hosted checkout and are not stored by BayLayer Labs. Stripe receives transaction, contact, device, and payment information to process payments, calculate tax, and prevent fraud under its <a href="https://stripe.com/privacy">privacy policy</a>. Our hosting and storage providers process storefront, order, and private-upload data to operate the service.</p>
      <h2>Storage and retention</h2>
      <p>Uploaded files receive a 30-day expiry marker and may be retained longer only when needed for an active order, dispute, safety review, or legal obligation. Order and payment records may be retained for accounting, tax, fraud-prevention, and support needs. Do not upload confidential, regulated, medical, or export-controlled material.</p>
      <h2>Your choices</h2>
      <p>You may ask us to access, correct, or delete eligible information, remove your email, or stop marketing messages by contacting <a href="mailto:baylayerlabs@gmail.com">baylayerlabs@gmail.com</a>. We do not sell personal information.</p>
    </PolicyPage>
  );
}
