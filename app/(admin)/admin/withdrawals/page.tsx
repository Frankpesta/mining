import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { WithdrawReviewCard } from "@/components/admin/withdraw-review-card";
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

export default async function AdminWithdrawalsPage() {
  const convex = getConvexClient();
  const [pendingWithdrawals, approvedWithdrawals, recentWithdrawals, hotWallets] =
    await Promise.all([
      convex.query(api.withdrawals.listAdminWithdrawals, { status: "pending", limit: 50 }),
      convex.query(api.withdrawals.listAdminWithdrawals, { status: "approved", limit: 50 }),
      convex.query(api.withdrawals.listAdminWithdrawals, { limit: 40 }),
      convex.query(api.hotWallets.listHotWallets, {}),
    ]);

  // Create a map of crypto to hot wallet address
  const hotWalletMap = new Map<string, string>(
    hotWallets.map((wallet: Doc<"hotWallets">) => [wallet.crypto, wallet.address]),
  );

  const actionable = [...pendingWithdrawals, ...approvedWithdrawals].sort(
    (a, b) => b.createdAt - a.createdAt,
  );

  const history = recentWithdrawals.filter(
    (withdrawal: Doc<"withdrawals"> & { userEmail: string | null }) =>
      withdrawal.status === "completed" ||
      withdrawal.status === "failed" ||
      withdrawal.status === "rejected",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Withdrawal queue</h1>
        <p className="text-sm text-muted-foreground">
          Approve, schedule, and record payout execution for user withdrawals.
        </p>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle>Pending actions</CardTitle>
          <CardDescription>Approve, complete, or fail withdrawals awaiting review.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {actionable.length === 0 ? (
            <p className="text-sm text-muted-foreground">No withdrawals waiting for approval.</p>
          ) : (
            actionable.map((withdrawal: Doc<"withdrawals"> & { userEmail: string | null }) => (
              <WithdrawReviewCard
                key={withdrawal._id}
                withdrawal={{
                  _id: withdrawal._id,
                  userEmail: withdrawal.userEmail ?? null,
                  amount: withdrawal.amount,
                  finalAmount: withdrawal.finalAmount,
                  networkFee: withdrawal.networkFee,
                  crypto: withdrawal.crypto,
                  status: withdrawal.status,
                  createdAt: withdrawal.createdAt,
                  destinationAddress: withdrawal.destinationAddress,
                  txHash: withdrawal.txHash,
                  adminNote: withdrawal.adminNote,
                  userNote: withdrawal.userNote,
                }}
                hotWalletAddress={hotWalletMap.get(withdrawal.crypto)}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle>Completed and failed withdrawals</CardTitle>
          <CardDescription>Reference processed payouts for audits and reconciliations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {history.length === 0 ? (
            <p className="text-muted-foreground">No completed withdrawals yet.</p>
          ) : (
            history.map((withdrawal: Doc<"withdrawals"> & { userEmail: string | null }) => (
              <article key={withdrawal._id} className="rounded-lg border border-border/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {withdrawal.userEmail ?? "Unknown user"} •{" "}
                      {withdrawal.finalAmount.toFixed(6)} {withdrawal.crypto}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(withdrawal.createdAt)} • Destination {withdrawal.destinationAddress}
                    </p>
                  </div>
                  <StatusBadge status={withdrawal.status} />
                </div>
                <div className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                  <span>
                    Requested: {withdrawal.amount} {withdrawal.crypto}
                  </span>
                  <span>
                    Network fee: {withdrawal.networkFee} {withdrawal.crypto}
                  </span>
                  {withdrawal.txHash ? (
                    <span className="truncate">
                      Tx hash: <span className="font-mono">{withdrawal.txHash}</span>
                    </span>
                  ) : null}
                  {withdrawal.adminNote ? <span>Admin note: {withdrawal.adminNote}</span> : null}
                </div>
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

