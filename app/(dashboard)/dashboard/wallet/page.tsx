import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/utils";

export default async function WalletPage() {
  const current = await getCurrentUser();
  const user = current?.user;

  const platformBalanceUSD =
    (user?.platformBalance.ETH ?? 0) +
    (user?.platformBalance.USDT ?? 0) +
    (user?.platformBalance.USDC ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Portfolio balances</h1>
        <p className="text-sm text-muted-foreground">
          Overview of platform wallet funds and accumulated mining earnings by asset.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Platform wallet</CardTitle>
            <CardDescription>Spendable balance for purchases and withdrawals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <BalanceRow label="ETH" value={user?.platformBalance.ETH ?? 0} />
            <BalanceRow label="USDT" value={user?.platformBalance.USDT ?? 0} />
            <BalanceRow label="USDC" value={user?.platformBalance.USDC ?? 0} />
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs uppercase tracking-wide text-muted-foreground">
              <span>Total (USD est.)</span>
              <span className="text-sm font-semibold">{formatCurrency(platformBalanceUSD)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Mining earnings</CardTitle>
            <CardDescription>Realized rewards awaiting withdrawal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <BalanceRow label="BTC" value={user?.miningBalance.BTC ?? 0} />
            <BalanceRow label="ETH" value={user?.miningBalance.ETH ?? 0} />
            <BalanceRow label="LTC" value={user?.miningBalance.LTC ?? 0} />
            {user?.miningBalance.others
              ? Object.entries(user.miningBalance.others).map(([coin, value]) => (
                  <BalanceRow key={coin} label={coin} value={value} />
                ))
              : null}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function BalanceRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium">{label}</span>
      <span className="tabular-nums">{value.toLocaleString()}</span>
    </div>
  );
}

