import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const solutionTracks = [
  {
    title: "Solo miners",
    description:
      "Start small, scale steadily. Pick flexible plans and control payouts without worrying about hardware or maintenance.",
    points: [
      "Hash power bundles starting at 1 TH/s",
      "Live profitability and reward estimates",
      "Auto-withdrawals to your personal wallet",
    ],
  },
  {
    title: "Crypto accumulators",
    description:
      "Lock in steady production of the coins you believe in with long-term packs and automated compounding.",
    points: [
      "30, 90, and 365-day plans across multiple coins",
      "Auto-reinvest or manual withdraw options",
      "Detailed tax-ready earning history",
    ],
  },
  {
    title: "Community groups",
    description:
      "Pool resources with friends or clubs, allocate shared power, and track every participant’s earnings transparently.",
    points: [
      "Shared dashboards with role-based access",
      "Contribution tracking and payout splits",
      "Notifications for milestones and maintenance",
    ],
  },
];

export default function SolutionsPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-20 sm:px-6 lg:px-8">
      <header className="space-y-6 text-center">
        <div className="inline-flex items-center gap-3 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-primary">
          Solutions
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Mining solutions for every crypto journey
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
          From first-time miners to seasoned accumulators, HashHorizon gives you the tools to buy
          mining power, monitor rewards, and grow your holdings with confidence.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {solutionTracks.map((track) => (
          <Card key={track.title} className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                {track.title}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{track.description}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {track.points.map((point) => (
                  <li key={point} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                    {point}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 rounded-3xl border border-border/60 bg-muted/40 p-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Guided getting-started kits
          </h2>
          <p className="text-sm text-muted-foreground">
            New to mining? Our onboarding team walks you through funding, selecting plans, and
            configuring withdrawals so you can focus on earning.
          </p>
        </div>
        <div className="flex flex-col gap-3 text-sm text-muted-foreground">
          <p>What’s included:</p>
          <ul className="space-y-2">
            <li>• Personalised profitability walkthrough</li>
            <li>• Reward projection spreadsheet template</li>
            <li>• Education call on wallets and security</li>
            <li>• Priority chat support during your first month</li>
          </ul>
        </div>
      </section>

      <div className="flex flex-col items-center gap-4 rounded-3xl border border-primary/40 bg-primary/10 p-8 text-center">
        <h3 className="text-2xl font-semibold text-primary">
          Explore the solution that fits your mining operation
        </h3>
        <p className="max-w-2xl text-sm text-primary/80">
          Request a tailored walkthrough and discover the best way to turn purchased mining power
          into daily crypto rewards.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/contact">Schedule discovery call</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/pricing">View pricing</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

