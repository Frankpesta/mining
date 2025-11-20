import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex/client";
import { formatCurrency } from "@/lib/utils";

function formatHashRate(hashRate: number, unit: string): string {
  return `${hashRate.toLocaleString()} ${unit}`;
}

function formatDuration(duration: number): string {
  if (duration === 30) return "per month";
  if (duration === 90) return "per 3 months";
  if (duration === 365) return "per year";
  return `for ${duration} days`;
}

const faqs = [
  {
    question: "What happens after I choose a plan?",
    answer:
      "Once you select a plan and fund your balance, your mining power is activated instantly. You can monitor production in the dashboard and adjust or upgrade anytime.",
  },
  {
    question: "Can I change or pause my mining power?",
    answer:
      "Yes. You can top up, downgrade, or pause upcoming renewals directly from your account. Remaining rewards continue to accrue until the current term ends.",
  },
  {
    question: "How are payouts handled?",
    answer:
      "You decide the payout coin and schedule. Choose auto-withdrawals to your wallet or manually trigger transfers when you hit your target amount.",
  },
];

export default async function PricingPage() {
  const convex = getConvexClient();
  const backendPlans = await convex.query(api.plans.listPlans, { activeOnly: true });

  // Transform backend plans to match the pricing page format
  const plans = backendPlans.map((plan, index) => {
    const hashRateDisplay = formatHashRate(plan.hashRate, plan.hashRateUnit);
    const supportedCoinsDisplay = plan.supportedCoins.join(", ");
    
    // Create description from plan data
    const description = `${hashRateDisplay} of mining power for ${plan.duration} days. Supports ${supportedCoinsDisplay}.`;

    return {
      id: plan._id,
      name: plan.name,
      price: formatCurrency(plan.priceUSD),
      cadence: formatDuration(plan.duration),
      description,
      features: plan.features.length > 0 
        ? plan.features 
        : [
            `${hashRateDisplay} hash rate`,
            `Duration: ${plan.duration} days`,
            `Supported coins: ${supportedCoinsDisplay}`,
            `Estimated daily earning: ${formatCurrency(plan.estimatedDailyEarning)}`,
          ],
      cta: "Get started",
      highlight: index === Math.floor(backendPlans.length / 2), // Highlight middle plan
    };
  });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-20 sm:px-6 lg:px-8">
      <header className="space-y-6 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-primary">Pricing</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Simple plans that scale with your mining operation
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
          Simple subscriptions give you access to professional mining facilities without the
          hardware bills. Scale up or down as your goals evolve.
        </p>
      </header>

      {plans.length === 0 ? (
        <section className="text-center py-12">
          <p className="text-muted-foreground">No plans available at the moment. Please check back later.</p>
        </section>
      ) : (
        <section className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`border-border/60 bg-card/80 shadow-sm ${
                plan.highlight ? "border-primary/50 shadow-lg" : ""
              }`}
            >
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg font-semibold text-foreground">
                  {plan.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <span className="text-3xl font-semibold text-foreground">{plan.price}</span>
                  <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                    {plan.cadence}
                  </p>
                </div>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full" variant={plan.highlight ? "default" : "outline"} asChild>
                  <Link href="/auth/signup">{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </section>
      )}

      <section className="grid gap-8 rounded-3xl border border-border/60 bg-muted/30 p-8 md:grid-cols-[0.7fr_1fr]">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Frequently asked
          </h2>
          <p className="text-sm text-muted-foreground">
            Everything you need to know about funding, mining rewards, and withdrawals on
            blockhashpro.
          </p>
        </div>
        <div className="space-y-6 text-sm text-muted-foreground">
          {faqs.map((faq) => (
            <div key={faq.question} className="space-y-2">
              <h3 className="text-base font-semibold text-foreground">{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

