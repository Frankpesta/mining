import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/utils";
import { getConvexClient } from "@/lib/convex/client";
import { api } from "@/convex/_generated/api";

export default async function WalletPage() {
  const current = await getCurrentUser();
  const user = current?.user;

  const convex = getConvexClient();
  const platformBalanceUSD = user
    ? await convex.query(api.wallet.calculatePlatformBalanceUSD, {
        userId: user._id,
      })
    : 0;
  const miningBalanceUSD = user
    ? await convex.query(api.wallet.calculateMiningBalanceUSD, {
        userId: user._id,
      })
    : 0;

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
            {/* Display all coins in platform balance */}
            {user?.platformBalance && (
              <>
                {Object.entries(user.platformBalance as Record<string, number>)
                  .filter(([key, value]) => key !== "others" && value > 0)
                  .map(([coin, value]) => (
                    <BalanceRow key={coin} label={coin} value={value} />
                  ))}
              </>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs uppercase tracking-wide text-muted-foreground">
              <span>Total (USD)</span>
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
            {/* Display all coins in mining balance */}
            {user?.miningBalance && (
              <>
                {Object.entries(user.miningBalance as Record<string, number | Record<string, number> | undefined>)
                  .filter(([key, value]) => {
                    if (key === "others") return false;
                    return typeof value === "number" && value > 0;
                  })
                  .map(([coin, value]) => (
                    <BalanceRow key={coin} label={coin} value={value as number} />
                  ))}
                {user.miningBalance.others
                  ? Object.entries(user.miningBalance.others).map(([coin, value]) => (
                      <BalanceRow key={coin} label={coin} value={value} />
                    ))
                  : null}
              </>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs uppercase tracking-wide text-muted-foreground">
              <span>Total (USD)</span>
              <span className="text-sm font-semibold">{formatCurrency(miningBalanceUSD)}</span>
            </div>
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

