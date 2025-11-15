import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const offices = [
  {
    city: "London, United Kingdom",
    address: "126, 126a Oxford St, London W1D 2HT, United Kingdom",
  },
];

export default function ContactPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-20 sm:px-6 lg:px-8">
      <header className="space-y-6 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-primary">Contact</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Let&apos;s operationalize your mining marketplace
        </h1>
        <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
          Reach out for product demos, migration support, partnerships, or enterprise pricing. The
          HashHorizon team spans infrastructure, treasury, and compliance experts.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-[0.65fr_0.35fr]">
        <Card className="border-border/60 bg-card/80 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Send us a message
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" placeholder="Jane Doe" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Work email</Label>
                <Input id="email" type="email" placeholder="you@company.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="company">Company</Label>
                <Input id="company" placeholder="HashFund Capital" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">How can we help?</Label>
                <Textarea
                  id="message"
                  placeholder="Tell us about your mining operation and goals…"
                  rows={5}
                />
              </div>
              <Button type="submit" className="justify-self-start">
                Submit inquiry
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-muted/40">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">
              Offices & Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm text-muted-foreground">
            <div>
              <p className="font-semibold text-foreground">Enterprise support</p>
              <p>support@hashhorizon.io</p>
              <p>24/7 for Growth & Enterprise plans</p>
            </div>
            <div>
              <p className="font-semibold text-foreground">Sales</p>
              <p>sales@hashhorizon.io</p>
              <p>Response within 1 business day</p>
            </div>
            <div className="space-y-4">
              {offices.map((office) => (
                <div key={office.city}>
                  <p className="text-sm font-semibold text-foreground">{office.city}</p>
                  <p>{office.address}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

