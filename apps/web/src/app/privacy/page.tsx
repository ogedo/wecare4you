export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold text-neutral-900 mb-2">Privacy Policy</h1>
      <p className="text-neutral-500 mb-8">Last updated: March 2026</p>

      <div className="prose prose-neutral max-w-none">
        <h2>1. Data Controller</h2>
        <p>
          WeCare4You (the "Platform") is operated by WeCare4You Technologies Ltd, a company registered
          in Nigeria. We are the data controller for personal information collected through this
          platform and are committed to compliance with the Nigeria Data Protection Regulation (NDPR)
          and the Nigeria Data Protection Act (NDPA) 2023.
        </p>

        <h2>2. Data We Collect</h2>
        <ul>
          <li>Phone number (primary identifier)</li>
          <li>Email address (optional)</li>
          <li>Date of birth and Nigerian state (for patients)</li>
          <li>Professional license details and specializations (for therapists)</li>
          <li>Bank account details for payouts (BVN-free; verified via Paystack)</li>
          <li>Session data (appointment times, duration, type)</li>
          <li>Message content (encrypted at rest)</li>
          <li>Payment records (processed by Paystack)</li>
        </ul>

        <h2>3. Lawful Basis for Processing</h2>
        <p>
          We process your data on the basis of (a) contractual necessity — to provide the platform
          services you requested; (b) explicit consent — for SMS communication and marketing; and
          (c) legitimate interests — for fraud prevention and security.
        </p>

        <h2>4. Data Retention</h2>
        <p>
          We retain personal data for 5 years after your last activity, or until you request
          deletion. Anonymised statistical data may be retained indefinitely.
        </p>

        <h2>5. Your Rights</h2>
        <ul>
          <li>Right of access — request a copy of your data</li>
          <li>Right to rectification — correct inaccurate data</li>
          <li>Right to erasure — request deletion of your data</li>
          <li>Right to data portability</li>
          <li>Right to withdraw consent at any time</li>
        </ul>
        <p>
          To exercise your rights, contact: <strong>privacy@wecare4you.ng</strong>. We will respond
          within 14 days.
        </p>

        <h2>6. Third-Party Processors</h2>
        <ul>
          <li>Paystack — payment processing (NDPR compliant)</li>
          <li>Daily.co — video infrastructure</li>
          <li>Termii — SMS delivery</li>
          <li>Cloudinary — media storage</li>
        </ul>

        <h2>7. Security</h2>
        <p>
          All data is transmitted over TLS. Sensitive data (messages) is encrypted at rest.
          Access is restricted by role-based authentication. We conduct periodic security audits.
        </p>

        <h2>8. Contact</h2>
        <p>
          Data Protection Officer: <strong>dpo@wecare4you.ng</strong><br />
          Address: Lagos, Nigeria
        </p>
      </div>
    </main>
  );
}
