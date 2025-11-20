import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const resources = [
  {
    title: "blockhashpro Quickstart",
    description:
      "Step-by-step guide to funding your account, choosing a mining plan, and scheduling your first payout.",
    href: "#quickstart",
  },
  {
    title: "Mining Earnings Calculator",
    description:
      "Interactive spreadsheet and walkthrough for projecting rewards across different hash power bundles and coins.",
    href: "#calculator",
  },
  {
    title: "Security & Wallet Handbook",
    description:
      "Best practices for securing your account, managing payout addresses, and keeping your mined coins safe.",
    href: "#security",
  },
];

export default function ResourcesPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-20 sm:px-6 lg:px-8">
      <header className="space-y-6 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-primary">Resources</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Everything you need to start mining with blockhashpro
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
          Tutorials, calculators, and safety resources to help you maximise rewards and stay secure
          from day one.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {resources.map((resource) => (
          <Card key={resource.title} className="border-border/60 bg-card/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-foreground">
                {resource.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{resource.description}</p>
              <a
                href={resource.href}
                className="mt-4 inline-flex items-center text-sm font-semibold text-primary hover:underline"
              >
                View resource →
              </a>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

