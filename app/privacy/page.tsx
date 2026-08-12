import { PolicyPage } from "@/app/components/PolicyPage";

export default function PrivacyPage() {
  return (
    <PolicyPage title="Privacy notice" updated="August 11, 2026">
      <h2>What this preview collects</h2>
      <p>The early-access form collects your email and consent choice. A custom-print request may collect a model file, filename, technical print preferences, and an optional email. The private preview does not collect payment-card data.</p>
      <h2>How information is used</h2>
      <p>We use it to provide estimates, review printability, respond to requests, protect the service, and send product updates only when you explicitly consent.</p>
      <h2>Storage and retention</h2>
      <p>Model uploads are marked for deletion after 30 days. Before public launch, automated deletion and abuse controls must be operational. Do not upload confidential, regulated, or export-controlled material during this preview.</p>
      <h2>Your choices</h2>
      <p>You may ask us to delete a model, remove your email, or stop marketing messages. We do not sell personal information.</p>
    </PolicyPage>
  );
}
