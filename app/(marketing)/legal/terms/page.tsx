import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions | HashHorizon",
  description: "Terms and conditions for using HashHorizon mining platform",
};

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold tracking-tight">Terms & Conditions</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="mt-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
            <p className="mt-2 text-muted-foreground">
              By accessing and using HashHorizon ("the Platform", "we", "us", "our"), you accept
              and agree to be bound by these Terms and Conditions. If you do not agree to these
              terms, you must not use our services.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">2. Description of Service</h2>
            <p className="mt-2 text-muted-foreground">
              HashHorizon provides cloud-based cryptocurrency mining services, allowing users to
              purchase hash rate plans and participate in mining operations. We facilitate the
              purchase of mining contracts and manage mining operations on behalf of users.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">3. User Accounts</h2>
            <div className="mt-2 space-y-2 text-muted-foreground">
              <p>
                3.1. You must be at least 18 years old and have the legal capacity to enter into
                binding agreements.
              </p>
              <p>
                3.2. You are responsible for maintaining the confidentiality of your account
                credentials and for all activities that occur under your account.
              </p>
              <p>
                3.3. You agree to provide accurate, current, and complete information during
                registration and to update such information as necessary.
              </p>
              <p>
                3.4. We reserve the right to suspend or terminate accounts that violate these terms
                or engage in fraudulent activity.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">4. Mining Services</h2>
            <div className="mt-2 space-y-2 text-muted-foreground">
              <p>
                4.1. Mining rewards are estimates based on current network conditions and are not
                guaranteed. Actual earnings may vary.
              </p>
              <p>
                4.2. Mining operations are subject to network difficulty changes, market volatility,
                and other factors beyond our control.
              </p>
              <p>
                4.3. We reserve the right to pause or modify mining operations due to technical
                issues, maintenance, or regulatory requirements.
              </p>
              <p>
                4.4. Mining contracts are non-refundable once activated, except as required by law.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">5. Deposits and Withdrawals</h2>
            <div className="mt-2 space-y-2 text-muted-foreground">
              <p>
                5.1. Deposits must be made to the addresses we provide. We are not responsible for
                funds sent to incorrect addresses.
              </p>
              <p>
                5.2. All deposits are subject to verification and may require manual approval by our
                team.
              </p>
              <p>
                5.3. Withdrawals are subject to minimum amounts and network fees, which are
                deducted from the withdrawal amount.
              </p>
              <p>
                5.4. We reserve the right to require additional verification for withdrawals to
                prevent fraud and comply with regulations.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">6. Fees and Payments</h2>
            <div className="mt-2 space-y-2 text-muted-foreground">
              <p>
                6.1. Service fees are clearly displayed before purchase. All fees are final and
                non-refundable unless otherwise stated.
              </p>
              <p>
                6.2. Network fees for withdrawals are calculated based on current blockchain
                conditions and are subject to change.
              </p>
              <p>
                6.3. We reserve the right to modify our fee structure with 30 days notice to users.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">7. Prohibited Activities</h2>
            <p className="mt-2 text-muted-foreground">You agree not to:</p>
            <ul className="mt-2 list-disc space-y-1 pl-6 text-muted-foreground">
              <li>Use the Platform for any illegal or unauthorized purpose</li>
              <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
              <li>Interfere with or disrupt the Platform's operation</li>
              <li>Use automated systems to access the Platform without permission</li>
              <li>Engage in money laundering, fraud, or other financial crimes</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">8. Intellectual Property</h2>
            <p className="mt-2 text-muted-foreground">
              All content, features, and functionality of the Platform are owned by HashHorizon and
              are protected by international copyright, trademark, and other intellectual property
              laws. You may not reproduce, distribute, or create derivative works without our
              express written permission.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">9. Limitation of Liability</h2>
            <div className="mt-2 space-y-2 text-muted-foreground">
              <p>
                9.1. The Platform is provided "as is" without warranties of any kind, either
                express or implied.
              </p>
              <p>
                9.2. We are not liable for any losses resulting from market volatility, network
                issues, or other factors beyond our control.
              </p>
              <p>
                9.3. Our total liability shall not exceed the amount you have paid to us in the 12
                months preceding the claim.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">10. Indemnification</h2>
            <p className="mt-2 text-muted-foreground">
              You agree to indemnify and hold HashHorizon harmless from any claims, damages,
              losses, liabilities, and expenses arising from your use of the Platform or violation
              of these Terms.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">11. Termination</h2>
            <div className="mt-2 space-y-2 text-muted-foreground">
              <p>
                11.1. We may terminate or suspend your account immediately, without prior notice, if
                you breach these Terms.
              </p>
              <p>
                11.2. You may terminate your account at any time by contacting support.
              </p>
              <p>
                11.3. Upon termination, your right to use the Platform ceases immediately, but
                provisions that by their nature should survive will remain in effect.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">12. Governing Law</h2>
            <p className="mt-2 text-muted-foreground">
              These Terms shall be governed by and construed in accordance with the laws of the
              jurisdiction in which HashHorizon operates, without regard to conflict of law
              provisions.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">13. Changes to Terms</h2>
            <p className="mt-2 text-muted-foreground">
              We reserve the right to modify these Terms at any time. Material changes will be
              notified via email or platform notification. Continued use of the Platform after
              changes constitutes acceptance of the new Terms.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">14. Contact Information</h2>
            <p className="mt-2 text-muted-foreground">
              For questions about these Terms, please contact us at{" "}
              <a href="/contact" className="text-primary hover:underline">
                support@hashhorizon.com
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

