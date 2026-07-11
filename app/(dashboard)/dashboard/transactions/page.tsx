import { api } from "@/convex/_generated/api";
import type { TransactionEntry } from "@/convex/transactions";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser } from "@/lib/auth/session";
import { getConvexClient } from "@/lib/convex/client";
import { formatCurrency, formatDate } from "@/lib/utils";

const typeLabels: Record<TransactionEntry["type"], string> = {
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  payout: "Mining ROI",
  purchase: "Plan Purchase",
  renewal: "Plan Renewal",
  referral: "Referral Bonus",
};

function formatAmount(entry: TransactionEntry) {
  const sign =
    entry.type === "withdrawal" || entry.type === "purchase" || entry.type === "renewal"
      ? "-"
      : "+";
  return `${sign}${entry.amount.toLocaleString("en-US", {
    maximumFractionDigits: entry.crypto === "BTC" ? 8 : 6,
    minimumFractionDigits: 0,
  })} ${entry.crypto}`;
}

export default async function TransactionsPage() {
  const current = await getCurrentUser();
  if (!current) {
    return null;
  }

  const convex = getConvexClient();
  const transactions = await convex.query(api.transactions.listUserTransactions, {
    userId: current.user._id,
    limit: 150,
  });

  const totalDeposited = transactions
    .filter((t) => t.type === "deposit" && t.status === "approved")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalRoiPaid = transactions
    .filter((t) => t.type === "payout")
    .reduce((sum, t) => sum + t.amount, 0);
  const pendingCount = transactions.filter((t) => t.status === "pending").length;
  const latest = transactions[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Every deposit, withdrawal, plan purchase, auto-renewal, mining ROI payout, and referral
          bonus on your account in one ledger.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Deposited</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(totalDeposited)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total ROI Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(totalRoiPaid)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{pendingCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>Ledger</CardTitle>
          <CardDescription>
            {latest
              ? `Latest activity recorded ${formatDate(latest.timestamp)}`
              : "Deposits, withdrawals, purchases, ROI payouts, and referral bonuses will appear here"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No transactions recorded yet.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((entry) => (
                      <TableRow key={`${entry.type}-${entry.id}`}>
                        <TableCell className="font-medium text-foreground">
                          {formatDate(entry.timestamp)}
                        </TableCell>
                        <TableCell>
                          <span>{typeLabels[entry.type]}</span>
                          {entry.detail ? (
                            <span className="block text-xs text-muted-foreground">
                              {entry.detail}
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell>{entry.crypto}</TableCell>
                        <TableCell className="font-medium text-foreground">
                          {formatAmount(entry)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={entry.status} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-4 md:hidden">
                {transactions.map((entry) => (
                  <div
                    key={`${entry.type}-${entry.id}`}
                    className="space-y-3 rounded-lg border border-border/60 bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{typeLabels[entry.type]}</h3>
                        {entry.detail ? (
                          <p className="text-xs text-muted-foreground">{entry.detail}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(entry.timestamp)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{formatAmount(entry)}</p>
                        <div className="mt-1">
                          <StatusBadge status={entry.status} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
