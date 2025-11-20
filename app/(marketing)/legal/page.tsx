import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal Information | blockhashpro",
  description: "Legal information and compliance for blockhashpro",
};

export default function LegalPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold tracking-tight">Legal Information</h1>
        <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

        <section className="mt-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold">Company Information</h2>
            <div className="mt-2 space-y-2 text-muted-foreground">
              <p>
                <strong>Legal Name:</strong> blockhashpro Labs
              </p>
              <p>
                <strong>Business Type:</strong> Cryptocurrency Mining Services Provider
              </p>
              <p>
                <strong>Registration:</strong> [Jurisdiction and registration details]
              </p>
              <p>
                <strong>Tax ID:</strong> [Tax identification number]
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Regulatory Compliance</h2>
            <div className="mt-2 space-y-2 text-muted-foreground">
              <p>
                blockhashpro operates in compliance with applicable financial regulations and
                anti-money laundering (AML) requirements. We are committed to:
              </p>
              <ul className="ml-6 list-disc space-y-1">
                <li>Conducting Know Your Customer (KYC) verification</li>
                <li>Monitoring transactions for suspicious activity</li>
                <li>Reporting to relevant authorities as required by law</li>
                <li>Maintaining proper records and documentation</li>
                <li>Complying with tax obligations</li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Risk Disclosures</h2>
            <div className="mt-2 space-y-2 text-muted-foreground">
              <p>
                <strong>Cryptocurrency Mining Risks:</strong>
              </p>
              <ul className="ml-6 list-disc space-y-1">
                <li>
                  <strong>Market Volatility:</strong> Cryptocurrency prices are highly volatile and
                  can result in significant losses
                </li>
                <li>
                  <strong>Network Difficulty:</strong> Mining difficulty increases over time, which
                  may reduce profitability
                </li>
                <li>
                  <strong>Regulatory Changes:</strong> Changes in regulations may affect mining
                  operations and profitability
                </li>
                <li>
                  <strong>Technical Risks:</strong> Network issues, software bugs, or hardware
                  failures may impact mining operations
                </li>
                <li>
                  <strong>No Guaranteed Returns:</strong> Mining rewards are not guaranteed and
                  depend on various factors beyond our control
                </li>
              </ul>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Intellectual Property</h2>
            <p className="mt-2 text-muted-foreground">
              All trademarks, logos, and service marks displayed on the Platform are the property of
              blockhashpro or their respective owners. You may not use these marks without our prior
              written consent or the consent of the respective owner.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Dispute Resolution</h2>
            <div className="mt-2 space-y-2 text-muted-foreground">
              <p>
                <strong>Governing Law:</strong> These terms are governed by the laws of [Jurisdiction].
              </p>
              <p>
                <strong>Dispute Resolution Process:</strong>
              </p>
              <ol className="ml-6 list-decimal space-y-1">
                <li>Contact our support team to attempt resolution</li>
                <li>If unresolved, disputes may be subject to mediation</li>
                <li>Final resolution through binding arbitration or court proceedings as applicable</li>
              </ol>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Limitation of Liability</h2>
            <p className="mt-2 text-muted-foreground">
              To the maximum extent permitted by law, blockhashpro shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages, or any loss of
              profits or revenues, whether incurred directly or indirectly, or any loss of data,
              use, goodwill, or other intangible losses resulting from your use of our services.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Force Majeure</h2>
            <p className="mt-2 text-muted-foreground">
              We shall not be liable for any failure or delay in performance under these terms
              which is due to circumstances beyond our reasonable control, including but not limited
              to acts of God, natural disasters, war, terrorism, labor disputes, government
              actions, or failures of third-party services.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Severability</h2>
            <p className="mt-2 text-muted-foreground">
              If any provision of these terms is found to be unenforceable or invalid, that
              provision shall be limited or eliminated to the minimum extent necessary, and the
              remaining provisions shall remain in full force and effect.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Entire Agreement</h2>
            <p className="mt-2 text-muted-foreground">
              These terms, together with our Privacy Policy and any other legal documents referenced
              herein, constitute the entire agreement between you and blockhashpro regarding the use
              of our services.
            </p>
          </div>

          <div className="mt-8 rounded-lg border border-border bg-muted/50 p-6">
            <h2 className="text-xl font-semibold">Related Documents</h2>
            <div className="mt-4 flex flex-col gap-2">
              <Link href="/legal/terms" className="text-primary hover:underline">
                Terms & Conditions
              </Link>
              <Link href="/legal/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              <Link href="/contact" className="text-primary hover:underline">
                Contact Us
              </Link>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Contact Legal Department</h2>
            <p className="mt-2 text-muted-foreground">
              For legal inquiries, please contact our legal department at{" "}
              <a href="/contact" className="text-primary hover:underline">
                legal@blockhashpro.xyz
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

