import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const values = [
  {
    title: "Miner-first",
    description:
      "Everything we ship is tested with real community miners to ensure the experience is fast, understandable, and profitable.",
  },
  {
    title: "Secure by design",
    description:
      "From segregated wallets to signed approvals, every release is peer-reviewed and audited so your rewards stay protected.",
  },
  {
    title: "Transparent always",
    description:
      "We publish live uptime, incident reports, and roadmap updates so you know exactly how your mining power is performing.",
  },
];

const timeline = [
  {
    year: "2022",
    title: "blockhashpro founded",
    description: "Launched with a mission to make professional mining accessible to individual crypto holders.",
  },
  {
    year: "2023",
    title: "Realtime marketplace",
    description: "Released our mining power marketplace with live profitability data and automated payouts.",
  },
  {
    year: "2024",
    title: "Global expansion",
    description: "Partnered with renewable-powered facilities across three continents to support growing demand.",
  },
];

export default function CompanyPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-20 sm:px-6 lg:px-8">
      <header className="space-y-6 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-primary">Company</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Building the easiest way for anyone to mine crypto
        </h1>
        <p className="mx-auto max-w-3xl text-sm text-muted-foreground sm:text-base">
          blockhashpro is a distributed team of miners, engineers, and product builders. We believe
          every individual should be able to own powerful mining hardware without dealing with
          noise, heat, or downtime.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {values.map((value) => (
          <Card key={value.title} className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                {value.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{value.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="space-y-6 rounded-3xl border border-border/60 bg-muted/30 p-8">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">Our journey</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {timeline.map((item) => (
            <div key={item.year} className="space-y-2 rounded-2xl border border-border/60 bg-card/80 p-5">
              <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                {item.year}
              </p>
              <p className="text-lg font-semibold text-foreground">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 rounded-3xl border border-border/60 bg-card/80 p-8 md:grid-cols-[0.5fr_1fr]">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            Join the team
          </h2>
          <p className="text-sm text-muted-foreground">
            We&apos;re hiring across infrastructure, product, research, and customer success. Help
            us unlock professional-grade mining for millions of crypto holders.
          </p>
        </div>
        <div className="grid gap-4 text-sm text-muted-foreground">
          <RoleCard role="Senior Backend Engineer" location="Remote (North America)" />
          <RoleCard role="Product Manager, Mining Operations" location="Remote (EU)" />
          <RoleCard role="Customer Solutions Architect" location="Austin, TX or Remote" />
        </div>
      </section>
    </div>
  );
}

function RoleCard({ role, location }: { role: string; location: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-muted/30 px-4 py-3">
      <div>
        <p className="font-semibold text-foreground">{role}</p>
        <p className="text-xs text-muted-foreground">{location}</p>
      </div>
      <span className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">
        Open
      </span>
    </div>
  );
}

