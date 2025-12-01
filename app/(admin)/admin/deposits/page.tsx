import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { DepositReviewCard } from "@/components/admin/deposit-review-card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getConvexClient } from "@/lib/convex/client";
import { formatDate } from "@/lib/utils";

export default async function AdminDepositsPage() {
  const convex = getConvexClient();
  const [pendingDeposits, recentDeposits] = await Promise.all([
    convex.query(api.deposits.listAdminDeposits, { status: "pending", limit: 50 }),
    convex.query(api.deposits.listAdminDeposits, { limit: 30 }),
  ]);

  const history = recentDeposits.filter((deposit: Doc<"deposits"> & { userEmail: string | null }) => deposit.status !== "pending").slice(0, 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Deposit approvals</h1>
        <p className="text-sm text-muted-foreground">
          Review on-chain deposits, validate transaction hashes, and approve crediting platform
          balances.
        </p>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle>Pending reconciliation</CardTitle>
          <CardDescription>Approve or reject deposits once transfers are confirmed on-chain.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingDeposits.length === 0 ? (
            <p className="text-sm text-muted-foreground">All caught up—no pending deposits.</p>
          ) : (
            pendingDeposits.map((deposit: Doc<"deposits"> & { userEmail: string | null }) => (
              <DepositReviewCard
                key={deposit._id}
                deposit={{
                  _id: deposit._id,
                  userEmail: deposit.userEmail ?? null,
                  amount: deposit.amount,
                  crypto: deposit.crypto,
                  status: deposit.status,
                  createdAt: deposit.createdAt,
                  walletAddress: deposit.walletAddress,
                  txHash: deposit.txHash,
                  adminNote: deposit.adminNote,
                }}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle>Recent decisions</CardTitle>
          <CardDescription>
            Historical approvals and rejections for audit purposes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {history.length === 0 ? (
            <p className="text-muted-foreground">No recent approvals yet.</p>
          ) : (
            history.map((deposit: Doc<"deposits"> & { userEmail: string | null }) => (
              <article key={deposit._id} className="rounded-lg border border-border/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {deposit.userEmail ?? "Unknown user"} •{" "}
                      {deposit.amount.toLocaleString()} {deposit.crypto}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(deposit.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={deposit.status} />
                </div>
                <div className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                  <span>Wallet: {deposit.walletAddress}</span>
                  {deposit.txHash ? (
                    <span className="truncate">
                      Tx hash: <span className="font-mono">{deposit.txHash}</span>
                    </span>
                  ) : null}
                  {deposit.adminNote ? <span>Note: {deposit.adminNote}</span> : null}
                </div>
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

