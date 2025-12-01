import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";
import { getConvexClient } from "@/lib/convex/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ReferralCard } from "@/components/dashboard/referral-card";

const currencyLabels: Record<"ETH" | "USDT" | "USDC", string> = {
  ETH: "Ethereum",
  USDT: "Tether",
  USDC: "USD Coin",
};

export default async function DashboardOverviewPage() {
  const current = await getCurrentUser();
  const user = current?.user;

  if (!user) {
    return null;
  }

  const convex = getConvexClient();
  const summary = await convex.query(api.dashboard.getUserDashboardSummary, {
    userId: user._id,
  });

  const statCards = [
    {
      label: "Platform balance",
      value: formatCurrency(summary.metrics.platformBalance),
      hint: "Spendable funds across ETH/USDT/USDC",
    },
    {
      label: "Mining earnings",
      value: summary.metrics.miningBalance.toLocaleString(),
      hint: "Accumulated rewards ready for payout",
    },
    {
      label: "Active operations",
      value: summary.metrics.activeOperations.toLocaleString(),
      hint: `${summary.metrics.totalActiveHashrate.toLocaleString()} total hash rate`,
    },
    {
      label: "Pending withdrawals",
      value: summary.metrics.pendingWithdrawals.toLocaleString(),
      hint: "Awaiting admin review",
    },
    {
      label: "Referral bonus earned",
      value: formatCurrency(summary.referral.referralBonusEarned),
      hint: `${summary.referral.awardedReferrals} successful referrals`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
          Welcome back, {user.email} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Monitor your mining performance, manage balances, and explore new mining packages.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-border/60 bg-card/80 backdrop-blur">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{stat.value}</p>
              <CardDescription>{stat.hint}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Platform wallet</CardTitle>
            <CardDescription>Spendable balance for purchases and withdrawals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {(Object.entries(summary.balances.platform) as Array<["ETH" | "USDT" | "USDC", number]>)
              .filter(([, value]) => typeof value === "number")
              .map(([currency, value]) => (
                <div key={currency} className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold uppercase tracking-wide">{currency}</p>
                    <p className="text-xs text-muted-foreground">{currencyLabels[currency]}</p>
                  </div>
                  <span className="font-medium tabular-nums">{value.toLocaleString()}</span>
                </div>
              ))}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs uppercase tracking-wide text-muted-foreground">
              <span>Total (USD est.)</span>
              <span className="text-sm font-semibold">
                {formatCurrency(summary.metrics.platformBalance)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Mining earnings</CardTitle>
            <CardDescription>Realized rewards awaiting withdrawal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-medium">BTC</span>
              <span className="tabular-nums">
                {summary.balances.mining.BTC.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">ETH</span>
              <span className="tabular-nums">
                {summary.balances.mining.ETH.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">LTC</span>
              <span className="tabular-nums">
                {summary.balances.mining.LTC.toLocaleString()}
              </span>
            </div>
            {summary.balances.mining.others
              ? (Object.entries(summary.balances.mining.others) as [string, number][]).map(([coin, amount]) => (
                  <div key={coin} className="flex items-center justify-between">
                    <span className="font-medium uppercase">{coin}</span>
                    <span className="tabular-nums">{amount.toLocaleString()}</span>
                  </div>
                ))
              : null}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs uppercase tracking-wide text-muted-foreground">
              <span>Total</span>
              <span className="text-sm font-semibold">
                {summary.metrics.miningBalance.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle>Recent deposits</CardTitle>
            <CardDescription>Latest top-ups awaiting or after admin review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {summary.recentDeposits.length === 0 ? (
              <p className="text-muted-foreground">No deposits on record yet.</p>
            ) : (
              summary.recentDeposits.map((deposit: Doc<"deposits">) => (
                <article key={deposit._id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {deposit.amount.toLocaleString()} {deposit.crypto}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted {formatDate(deposit.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={deposit.status} />
                </article>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle>Recent withdrawals</CardTitle>
            <CardDescription>Track payout requests and their fulfillment status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {summary.recentWithdrawals.length === 0 ? (
              <p className="text-muted-foreground">No withdrawals requested yet.</p>
            ) : (
              summary.recentWithdrawals.map((withdrawal: Doc<"withdrawals">) => (
                <article key={withdrawal._id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {withdrawal.amount.toLocaleString()} {withdrawal.crypto}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested {formatDate(withdrawal.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={withdrawal.status} />
                </article>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <ReferralCard referral={summary.referral} />
      </section>
    </div>
  );
}

