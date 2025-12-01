import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { WithdrawForm } from "@/components/dashboard/withdraw-form";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { getConvexClient } from "@/lib/convex/client";
import { formatDate } from "@/lib/utils";

const CRYPTO_LABELS: Record<"ETH" | "USDT" | "USDC", string> = {
  ETH: "Ethereum",
  USDT: "Tether (ERC-20)",
  USDC: "USD Coin (ERC-20)",
};

export default async function WithdrawPage() {
  const current = await getCurrentUser();
  if (!current) {
    return null;
  }

  const convex = getConvexClient();
  const withdrawals = await convex.query(api.withdrawals.listUserWithdrawals, {
    userId: current.user._id,
    limit: 25,
  });

  const platformBalances = current.user.platformBalance;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Withdraw earnings</h1>
        <p className="text-sm text-muted-foreground">
          Request payouts to your external wallet once admins approve your transfer.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Available balances</CardTitle>
            <CardDescription>Balances eligible for withdrawal from your platform wallet.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {(Object.entries(platformBalances) as Array<["ETH" | "USDT" | "USDC", number]>).map(
              ([currency, value]) => (
                <div key={currency} className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {currency}
                    </p>
                    <p className="font-semibold">{CRYPTO_LABELS[currency]}</p>
                  </div>
                  <span className="font-medium tabular-nums">{value.toLocaleString()}</span>
                </div>
              ),
            )}
            <p className="text-xs text-muted-foreground">
              Payouts are processed manually by administrators. Status updates will appear below.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Request a withdrawal</CardTitle>
            <CardDescription>
              Enter the amount and destination wallet for the asset you&apos;d like to withdraw.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WithdrawForm balances={platformBalances} />
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/60 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle>Withdrawal history</CardTitle>
          <CardDescription>Track the status of recent withdrawal requests.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {withdrawals.length === 0 ? (
            <p className="text-muted-foreground">No withdrawal requests yet.</p>
          ) : (
            withdrawals.map((withdrawal: Doc<"withdrawals">) => (
              <article key={withdrawal._id} className="rounded-lg border border-border/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {withdrawal.amount.toLocaleString()} {withdrawal.crypto}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Destination: {withdrawal.destinationAddress}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Requested {formatDate(withdrawal.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={withdrawal.status} />
                </div>
                <div className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                  <span>
                    Network fee: {withdrawal.networkFee} {withdrawal.crypto}
                  </span>
                  <span>
                    Estimated payout: {withdrawal.finalAmount.toFixed(6)} {withdrawal.crypto}
                  </span>
                  {withdrawal.txHash ? (
                    <span className="truncate">
                      Tx hash: <span className="font-mono">{withdrawal.txHash}</span>
                    </span>
                  ) : null}
                  {withdrawal.userNote ? <span>User note: {withdrawal.userNote}</span> : null}
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

