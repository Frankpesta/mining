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
import { getConvexClient } from "@/lib/convex/client";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function AdminOverviewPage() {
  const convex = getConvexClient();
  const summary = await convex.query(api.dashboard.getAdminDashboardSummary, {});

  const metricCards = [
    {
      label: "Total users",
      value: summary.metrics.totalUsers.toLocaleString(),
      hint: "Across verified accounts",
    },
    {
      label: "Pending deposits",
      value: summary.metrics.pendingDeposits.toLocaleString(),
      hint: "Awaiting manual approval",
    },
    {
      label: "Pending withdrawals",
      value: summary.metrics.pendingWithdrawals.toLocaleString(),
      hint: "Queued for execution",
    },
    {
      label: "Active operations",
      value: summary.metrics.activeOperations.toLocaleString(),
      hint: "Live mining contracts",
    },
    {
      label: "Platform balance (USD est.)",
      value: formatCurrency(summary.metrics.totalPlatformBalance),
      hint: "Aggregate across ETH/USDT/USDC",
    },
    {
      label: "Mining earnings (est.)",
      value: summary.metrics.totalMiningBalance.toLocaleString(),
      hint: "Outstanding mining rewards",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl lg:text-3xl">Admin overview</h1>
        <p className="text-sm text-muted-foreground">
          Monitor platform health, review pending approvals, and keep operations running smoothly.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {metricCards.map((metric) => (
          <Card key={metric.label} className="border-border/60 bg-card/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{metric.value}</p>
              <CardDescription>{metric.hint}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle>Latest deposits</CardTitle>
            <CardDescription>Recent top-ups requiring or following review.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {summary.recentDeposits.length === 0 ? (
              <p className="text-muted-foreground">No deposit activity yet.</p>
            ) : (
              summary.recentDeposits.map((deposit: Doc<"deposits"> & { userEmail: string | null }) => (
                <article key={deposit._id} className="space-y-1 rounded-lg border border-border/60 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">
                      {deposit.amount.toLocaleString()} {deposit.crypto}
                    </p>
                    <StatusBadge status={deposit.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {deposit.userEmail ?? "Unknown user"} • Submitted {formatDate(deposit.createdAt)}
                  </p>
                  {deposit.txHash ? (
                    <p className="text-xs text-muted-foreground">
                      Tx hash: <span className="font-mono">{truncateHash(deposit.txHash)}</span>
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-3">
            <CardTitle>Latest withdrawals</CardTitle>
            <CardDescription>Track payout pipeline and reconciliation status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {summary.recentWithdrawals.length === 0 ? (
              <p className="text-muted-foreground">No withdrawal activity yet.</p>
            ) : (
              summary.recentWithdrawals.map((withdrawal: Doc<"withdrawals"> & { userEmail: string | null }) => (
                <article
                  key={withdrawal._id}
                  className="space-y-1 rounded-lg border border-border/60 p-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">
                      {withdrawal.amount.toLocaleString()} {withdrawal.crypto}
                    </p>
                    <StatusBadge status={withdrawal.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {withdrawal.userEmail ?? "Unknown user"} • Requested {formatDate(withdrawal.createdAt)}
                  </p>
                  {withdrawal.txHash ? (
                    <p className="text-xs text-muted-foreground">
                      Tx hash: <span className="font-mono">{truncateHash(withdrawal.txHash)}</span>
                    </p>
                  ) : null}
                </article>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function truncateHash(hash: string) {
  if (hash.length <= 16) {
    return hash;
  }
  return `${hash.slice(0, 10)}…${hash.slice(-6)}`;
}

