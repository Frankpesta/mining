import { api } from "@/convex/_generated/api";
import { PlansMarketplace } from "@/components/dashboard/plans-marketplace";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { getConvexClient } from "@/lib/convex/client";
import {
  approximateMiningBalanceUsd,
  totalUsdLikePlatformBalance,
} from "@/lib/crypto-static-usd";

export default async function MiningPackagesPage() {
  const current = await getCurrentUser();
  if (!current) {
    return null;
  }

  const convex = getConvexClient();
  const plans = await convex.query(api.plans.listPlans, { activeOnly: true });

  const platformUsd = totalUsdLikePlatformBalance(current.user.platformBalance);
  const miningUsd = approximateMiningBalanceUsd(current.user.miningBalance);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Mining Packages</h1>
        <p className="text-sm text-muted-foreground">
          Each plan commits funds you choose — from your platform wallet (deposits) or from mined
          earnings — between the plan&apos;s min and max, and pays a fixed daily percentage of that
          principal.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Platform wallet</CardTitle>
            <CardDescription>Deposits &amp; rewards (USD-like)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline">
              <span className="text-2xl font-bold sm:text-3xl">
                $
                {platformUsd.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs text-muted-foreground sm:text-sm">
                BTC: {(current.user.platformBalance.BTC ?? 0).toFixed(6)}, ETH:{" "}
                {current.user.platformBalance.ETH.toFixed(4)}, USDT:{" "}
                {current.user.platformBalance.USDT.toFixed(2)}, USDC:{" "}
                {current.user.platformBalance.USDC.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Mined balance</CardTitle>
            <CardDescription>
              Approx. USD value for reinvestment (static reference rates)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <span className="text-2xl font-bold sm:text-3xl">
                $
                {miningUsd.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span className="text-xs text-muted-foreground">
                Reinvest manually when purchasing a package — nothing moves until you confirm.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <PlansMarketplace
        plans={plans}
        userId={current.user._id}
        platformUsd={platformUsd}
        miningUsd={miningUsd}
      />
    </div>
  );
}
