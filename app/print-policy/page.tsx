import { PolicyPage } from "@/app/components/PolicyPage";

export default function PrintPolicyPage() {
  return (
    <PolicyPage title="Print and upload policy" updated="August 11, 2026">
      <h2>You must own the rights</h2>
      <p>By submitting a file, you confirm that you created it or have permission to reproduce it. Do not submit trademarks, copyrighted characters, patented designs, private scans, or another person’s likeness without authorization.</p>
      <h2>Prohibited requests</h2>
      <p>We will not produce weapons or weapon components, illegal items, controlled-product replicas intended to deceive, unsafe medical or load-bearing parts, or hateful and exploitative material.</p>
      <h2>Printability review</h2>
      <p>Every custom request is subject to manual review. We may recommend changes, decline a file, or require written confirmation about intended use. A browser estimate does not guarantee manufacturability.</p>
      <h2>File handling</h2>
      <p>Files are used only to evaluate and fulfill the requested service. Preview files are marked for 30-day retention and may be deleted earlier on request.</p>
    </PolicyPage>
  );
}
