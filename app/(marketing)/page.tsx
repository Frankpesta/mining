import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MiningRatesTable } from "@/components/marketing/mining-rates-table";
import { fetchMiningRates } from "@/lib/data/mining-rates";

const featureHighlights = [
  {
    title: "Instant mining power",
    description:
      "Choose the hash rate you want, fund your balance, and start mining top coins in a few clicks—no hardware or setup required.",
  },
  {
    title: "Transparent daily rewards",
    description:
      "Follow real-time profitability, projected payouts, and live network stats so you always know how your mining power performs.",
  },
  {
    title: "Secure custody & payouts",
    description:
      "Keep funds protected with segregated wallets and withdraw to your personal address whenever you’re ready.",
  },
];

const metrics = [
  { label: "Active miners", value: "58,000+", hint: "Individuals earning with blockhashpro" },
  { label: "Global locations", value: "24", hint: "Professionally managed mining sites" },
  { label: "Average uptime", value: "99.8%", hint: "Rolling 90-day equipment availability" },
];

const workflow = [
  {
    title: "Create & fund your account",
    description:
      "Sign up, secure your profile, and deposit crypto or stablecoins to unlock purchasing power.",
  },
  {
    title: "Pick a mining power pack",
    description:
      "Select hash rate bundles across BTC, Kaspa, Litecoin, and more with durations that match your budget.",
  },
  {
    title: "Track rewards & withdraw",
    description:
      "Watch live production, view daily summaries, and send mined coins to your wallet on your schedule.",
  },
];

const testimonials = [
  {
    name: "Liam Chen",
    role: "Retail miner, Singapore",
    quote:
      "I went from curious to mining Bitcoin in an afternoon. The live profitability table helps me rebalance power every week.",
  },
  {
    name: "Sophia Grant",
    role: "Community miner, Colorado",
    quote:
      "blockhashpro removed all the hardware headaches. Daily updates and quick withdrawals make passive mining straightforward.",
  },
];

const trustBadges = ["F2Pool", "CoinGecko", "Chainalysis", "Fireblocks", "Ledger Enterprise"];

export default async function HomePage() {
  const miningRates = await fetchMiningRates();

  return (
    <div className="relative overflow-hidden">
      <HeroSection />
      <div className="bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.12),_transparent_60%)]">
        <section className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          <MetricsStrip />
          <section className="grid gap-6 lg:grid-cols-[1fr,1fr]">
            <div className="space-y-5 rounded-3xl border border-border/60 bg-card/80 p-8 shadow-sm backdrop-blur">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                Real-time mining economics
              </h2>
              <p className="text-sm text-muted-foreground">
                Compare live revenue rates, luck, and pool dominance sourced directly from F2Pool
                statistics. Use the signal to route hash rate where the economics outperform.
              </p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Auto-refreshing data with fallback smoothing for resiliency</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Revenue deltas highlight trending profitability across leading coins</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>Export-ready datasets for treasury desks and analysts</span>
                </li>
              </ul>
              <LatencyBadge />
            </div>
            <MiningRatesTable initialData={miningRates} />
          </section>
        </section>
      </div>
      <FeatureSection />
      <WorkflowSection />
      <TrustSection />
      <TestimonialsSection />
      <CTASection />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-900 text-slate-50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.35),_transparent_65%)]" />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 pb-24 pt-32 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative z-10 space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-blue-300/40 bg-blue-500/10 px-4 py-1 text-xs font-medium uppercase tracking-[0.35em] text-blue-200">
              Mining Marketplace
            </div>
            <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              Rent mining power in minutes and start earning crypto today.
            </h1>
            <p className="max-w-xl text-pretty text-lg text-blue-100/80">
              blockhashpro lets anyone tap into professional mining infrastructure. Pick a plan, go
              live instantly, and follow your rewards with real-time data and automated payouts.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/auth/signup">Start mining in minutes</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/pricing">Compare plans</Link>
              </Button>
            </div>
            <p className="text-xs uppercase tracking-[0.3em] text-blue-200/70">
              Powered by renewable energy partners and audited facilities
            </p>
          </div>
          <div className="relative z-10 space-y-6 rounded-3xl border border-blue-400/30 bg-slate-900/60 p-8 shadow-2xl backdrop-blur">
            <h3 className="text-lg font-semibold text-blue-100">
              Earnings snapshot (demo portfolio)
            </h3>
            <div className="space-y-4 text-sm text-blue-100/80">
              <PortfolioRow label="Active hash power" value="12.4 TH/s" badge="+6% this week" />
              <PortfolioRow label="Mining plans" value="4" badge="BTC • KAS • LTC" />
              <PortfolioRow label="24h rewards" value="$312.40" badge="+3.9% vs. average" />
              <PortfolioRow label="Next payout" value="Today, 20:00 UTC" badge="Auto-withdraw" />
            </div>
            <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-4 text-xs text-blue-100/80">
              <p className="font-semibold text-blue-100">Performance summary</p>
              <p>
                Automated payouts delivered two BTC and one Kaspa withdrawal today. Hash power was
                rebalanced overnight to capture higher Kaspa profitability.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PortfolioRow({ label, value, badge }: { label: string; value: string; badge: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3">
      <div>
        <p className="text-xs uppercase tracking-widest text-blue-200/70">{label}</p>
        <p className="text-lg font-semibold text-blue-100">{value}</p>
      </div>
      <span className="rounded-full bg-blue-300/15 px-3 py-1 text-xs font-semibold text-blue-100">
        {badge}
      </span>
    </div>
  );
}

function MetricsStrip() {
  return (
    <div className="grid gap-4 rounded-3xl border border-border/60 bg-card/80 p-6 shadow-sm sm:grid-cols-3">
      {metrics.map((metric) => (
        <div key={metric.label} className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
            {metric.label}
          </p>
          <p className="text-2xl font-semibold text-foreground">{metric.value}</p>
          <p className="text-xs text-muted-foreground">{metric.hint}</p>
        </div>
      ))}
    </div>
  );
}

function FeatureSection() {
  return (
    <section className="bg-muted/30">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-20 sm:px-6 lg:px-8">
        <div className="space-y-4 text-center">
          <p className="text-xs uppercase tracking-[0.4em] text-primary">Why blockhashpro</p>
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Designed for everyday miners who want pro-grade results
          </h2>
          <p className="text-pretty text-sm text-muted-foreground sm:text-base">
            It shouldn’t take a warehouse of gear to mine crypto. blockhashpro gives you a clean
            dashboard, real-time data, and responsive support so your focus stays on growing
            rewards.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {featureHighlights.map((feature) => (
            <Card
              key={feature.title}
              className="border-border/60 bg-card/80 shadow-sm transition hover:shadow-lg"
            >
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-foreground">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-20 sm:px-6 lg:px-8">
      <div className="space-y-4 text-center md:text-left">
        <p className="text-xs uppercase tracking-[0.4em] text-primary">Go-live in three steps</p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          No hardware. No contractors. Just streaming mining power.
        </h2>
        <p className="text-sm text-muted-foreground sm:text-base">
          Whether you’re mining for the first time or scaling your hash rate, the process is fast,
          secure, and built for individuals.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {workflow.map((item, index) => (
          <div
            key={item.title}
            className="group relative space-y-4 rounded-2xl border border-border/60 bg-card/80 p-6 transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
              {String(index + 1).padStart(2, "0")}
            </div>
            <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
            <p className="text-sm text-muted-foreground">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="bg-muted/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-center text-xs uppercase tracking-[0.4em] text-muted-foreground">
          Trusted by
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm font-semibold text-muted-foreground sm:gap-10">
          {trustBadges.map((badge) => (
            <span
              key={badge}
              className="rounded-full border border-border/50 px-4 py-2 uppercase tracking-[0.35em]"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-20 sm:px-6 lg:px-8">
      <div className="space-y-4 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-primary">Customer stories</p>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Everyday miners, long-term crypto believers
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {testimonials.map((testimonial) => (
          <Card key={testimonial.name} className="border-border/60 bg-card/80 shadow-sm">
            <CardContent className="space-y-4 p-6">
              <p className="text-sm text-muted-foreground">“{testimonial.quote}”</p>
              <div>
                <p className="text-sm font-semibold text-foreground">{testimonial.name}</p>
                <p className="text-xs text-muted-foreground">{testimonial.role}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="mx-auto w-full max-w-6xl rounded-3xl border border-primary/30 bg-primary/10 px-4 py-14 text-center sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <h2 className="text-3xl font-semibold tracking-tight text-primary sm:text-4xl">
          Own your slice of global mining power today.
        </h2>
        <p className="text-sm text-primary/80 sm:text-base">
          blockhashpro removes the complexity of rigs and maintenance. Buy the mining power you need,
          grow your rewards, and cash out on your terms.
        </p>
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" asChild>
            <Link href="/auth/signup">Create Account</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

function LatencyBadge() {
  return (
    <div className="pt-4 text-xs text-muted-foreground">
      F2Pool API latency:{" "}
      <span className="font-semibold text-foreground">~320 ms</span> median
    </div>
  );
}

