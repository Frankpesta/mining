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

export default async function MiningPackagesPage() {
  const current = await getCurrentUser();
  if (!current) {
    return null;
  }

  const convex = getConvexClient();
  const plans = await convex.query(api.plans.listPlans, { activeOnly: true });

  const totalBalance =
    current.user.platformBalance.ETH +
    current.user.platformBalance.USDT +
    current.user.platformBalance.USDC;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mining Packages</h1>
        <p className="text-sm text-muted-foreground">
          Browse curated mining contracts with transparent pricing, estimated returns, and
          supported coins.
        </p>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>Your platform balance</CardTitle>
          <CardDescription>Available funds for purchasing mining packages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-sm text-muted-foreground">
              (ETH: {current.user.platformBalance.ETH.toFixed(4)}, USDT:{" "}
              {current.user.platformBalance.USDT.toFixed(2)}, USDC:{" "}
              {current.user.platformBalance.USDC.toFixed(2)})
            </span>
          </div>
        </CardContent>
      </Card>

      <PlansMarketplace
        plans={plans}
        userId={current.user._id}
        userBalance={totalBalance}
      />
    </div>
  );
}
