import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | HashHorizon",
  description: "Privacy policy for HashHorizon mining platform",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="mt-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">1. Introduction</h2>
            <p className="mt-2 text-muted-foreground">
              HashHorizon ("we", "us", "our") is committed to protecting your privacy. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your information when you
              use our mining platform and services.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">2. Information We Collect</h2>
            <div className="mt-2 space-y-2 text-muted-foreground">
              <p>
                <strong>2.1. Personal Information:</strong> We collect information you provide
                directly, including:
              </p>
              <ul className="ml-6 list-disc space-y-1">
                <li>Email address and password</li>
                <li>Name and contact information</li>
                <li>Payment and transaction information</li>
                <li>Wallet addresses and cryptocurrency transaction details</li>
                <li>Identity verification documents (when required)</li>
              </ul>
              <p>
                <strong>2.2. Automatically Collected Information:</strong>
              </p>
              <ul className="ml-6 list-disc space-y-1">
                <li>IP address and device information</li>
                <li>Browser type and version</li>
                <li>Usage data and interaction patterns</li>
                <li>Cookies and similar tracking technologies</li>
                <li>Log files and error reports</li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">3. How We Use Your Information</h2>
            <p className="mt-2 text-muted-foreground">We use collected information to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and manage your account</li>
              <li>Verify your identity and prevent fraud</li>
              <li>Communicate with you about your account and our services</li>
              <li>Comply with legal obligations and regulatory requirements</li>
              <li>Analyze usage patterns to enhance user experience</li>
              <li>Send marketing communications (with your consent)</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">4. Information Sharing and Disclosure</h2>
            <div className="mt-2 space-y-2 text-muted-foreground">
              <p>
                4.1. We do not sell your personal information. We may share information in the
                following circumstances:
              </p>
              <ul className="ml-6 list-disc space-y-1">
                <li>
                  <strong>Service Providers:</strong> With trusted third-party service providers who
                  assist in operating our platform
                </li>
                <li>
                  <strong>Legal Requirements:</strong> When required by law, court order, or
                  regulatory authority
                </li>
                <li>
                  <strong>Business Transfers:</strong> In connection with mergers, acquisitions, or
                  asset sales
                </li>
                <li>
                  <strong>Protection of Rights:</strong> To protect our rights, property, or safety,
                  or that of our users
                </li>
                <li>
                  <strong>With Your Consent:</strong> When you explicitly authorize us to share
                  your information
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">5. Data Security</h2>
            <div className="mt-2 space-y-2 text-muted-foreground">
              <p>
                5.1. We implement industry-standard security measures to protect your information,
                including:
              </p>
              <ul className="ml-6 list-disc space-y-1">
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Employee training on data protection</li>
              </ul>
              <p>
                5.2. However, no method of transmission over the Internet is 100% secure. While we
                strive to protect your data, we cannot guarantee absolute security.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">6. Cookies and Tracking Technologies</h2>
            <div className="mt-2 space-y-2 text-muted-foreground">
              <p>
                6.1. We use cookies and similar technologies to enhance your experience, analyze
                usage, and personalize content.
              </p>
              <p>
                6.2. You can control cookie preferences through your browser settings, but this may
                affect platform functionality.
              </p>
              <p>
                6.3. We use both session cookies (temporary) and persistent cookies (stored on your
                device).
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">7. Your Rights and Choices</h2>
            <p className="mt-2 text-muted-foreground">You have the right to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
              <li>
                <strong>Access:</strong> Request access to your personal information
              </li>
              <li>
                <strong>Correction:</strong> Request correction of inaccurate or incomplete data
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your personal information (subject to
                legal retention requirements)
              </li>
              <li>
                <strong>Portability:</strong> Request transfer of your data to another service
                provider
              </li>
              <li>
                <strong>Opt-Out:</strong> Unsubscribe from marketing communications
              </li>
              <li>
                <strong>Objection:</strong> Object to certain processing activities
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">8. Data Retention</h2>
            <p className="mt-2 text-muted-foreground">
              We retain your personal information for as long as necessary to fulfill the purposes
              outlined in this policy, comply with legal obligations, resolve disputes, and enforce
              our agreements. Transaction records may be retained for up to 7 years as required by
              financial regulations.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">9. International Data Transfers</h2>
            <p className="mt-2 text-muted-foreground">
              Your information may be transferred to and processed in countries other than your
              country of residence. We ensure appropriate safeguards are in place to protect your
              data in accordance with this Privacy Policy and applicable data protection laws.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">10. Children's Privacy</h2>
            <p className="mt-2 text-muted-foreground">
              Our services are not intended for individuals under 18 years of age. We do not
              knowingly collect personal information from children. If we become aware that we have
              collected information from a child, we will take steps to delete such information.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">11. Third-Party Links</h2>
            <p className="mt-2 text-muted-foreground">
              Our platform may contain links to third-party websites. We are not responsible for
              the privacy practices of these external sites. We encourage you to review their
              privacy policies.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">12. Changes to This Privacy Policy</h2>
            <p className="mt-2 text-muted-foreground">
              We may update this Privacy Policy from time to time. Material changes will be
              notified via email or platform notification. Your continued use of our services after
              changes constitutes acceptance of the updated policy.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">13. Contact Us</h2>
            <p className="mt-2 text-muted-foreground">
              For questions, concerns, or requests regarding this Privacy Policy or your personal
              information, please contact us at{" "}
              <a href="/contact" className="text-primary hover:underline">
                privacy@hashhorizon.com
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

