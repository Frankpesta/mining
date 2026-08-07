import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { BankWithdrawReviewCard } from "@/components/admin/bank-withdraw-review-card";
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

export default async function AdminBankWithdrawalsPage() {
  const convex = getConvexClient();
  const [pendingBankWithdrawals, approvedBankWithdrawals, recentBankWithdrawals] =
    await Promise.all([
      convex.query(api.bankWithdrawals.listAdminBankWithdrawals, { status: "pending", limit: 50 }),
      convex.query(api.bankWithdrawals.listAdminBankWithdrawals, { status: "approved", limit: 50 }),
      convex.query(api.bankWithdrawals.listAdminBankWithdrawals, { limit: 40 }),
    ]);

  const actionable = [...pendingBankWithdrawals, ...approvedBankWithdrawals].sort(
    (a, b) => b.createdAt - a.createdAt,
  );

  const history = recentBankWithdrawals.filter(
    (bankWithdrawal: Doc<"bankWithdrawals"> & { userEmail: string | null }) =>
      bankWithdrawal.status === "completed" ||
      bankWithdrawal.status === "failed" ||
      bankWithdrawal.status === "rejected",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Submitted bank details</h1>
        <p className="text-sm text-muted-foreground">
          Review bank withdrawal requests, verify account details, and record wire execution.
        </p>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle>Pending actions</CardTitle>
          <CardDescription>
            Approve, complete, or fail bank withdrawals awaiting review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {actionable.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bank withdrawals waiting for approval.</p>
          ) : (
            actionable.map((bankWithdrawal: Doc<"bankWithdrawals"> & { userEmail: string | null }) => (
              <BankWithdrawReviewCard
                key={bankWithdrawal._id}
                bankWithdrawal={{
                  _id: bankWithdrawal._id,
                  userEmail: bankWithdrawal.userEmail ?? null,
                  amount: bankWithdrawal.amount,
                  crypto: bankWithdrawal.crypto,
                  currency: bankWithdrawal.currency,
                  balanceSource: bankWithdrawal.balanceSource,
                  status: bankWithdrawal.status,
                  createdAt: bankWithdrawal.createdAt,
                  accountHolderName: bankWithdrawal.accountHolderName,
                  bankName: bankWithdrawal.bankName,
                  accountNumber: bankWithdrawal.accountNumber,
                  accountType: bankWithdrawal.accountType,
                  routingNumber: bankWithdrawal.routingNumber,
                  swiftCode: bankWithdrawal.swiftCode,
                  iban: bankWithdrawal.iban,
                  bankAddress: bankWithdrawal.bankAddress,
                  bankCountry: bankWithdrawal.bankCountry,
                  adminNote: bankWithdrawal.adminNote,
                  userNote: bankWithdrawal.userNote,
                }}
              />
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle>Completed and failed bank withdrawals</CardTitle>
          <CardDescription>Reference processed payouts for audits and reconciliations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {history.length === 0 ? (
            <p className="text-muted-foreground">No completed bank withdrawals yet.</p>
          ) : (
            history.map((bankWithdrawal: Doc<"bankWithdrawals"> & { userEmail: string | null }) => (
              <article key={bankWithdrawal._id} className="rounded-lg border border-border/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {bankWithdrawal.userEmail ?? "Unknown user"} •{" "}
                      {bankWithdrawal.amount.toLocaleString()} {bankWithdrawal.crypto} →{" "}
                      {bankWithdrawal.currency}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(bankWithdrawal.createdAt)} •{" "}
                      {bankWithdrawal.balanceSource === "mining" ? "Mining earnings" : "Platform"} •{" "}
                      {bankWithdrawal.bankName}
                    </p>
                  </div>
                  <StatusBadge status={bankWithdrawal.status} />
                </div>
                <div className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                  <span>Account holder: {bankWithdrawal.accountHolderName}</span>
                  <span>Bank country: {bankWithdrawal.bankCountry}</span>
                  {bankWithdrawal.adminNote ? <span>Admin note: {bankWithdrawal.adminNote}</span> : null}
                </div>
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
