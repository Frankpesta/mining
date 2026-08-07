import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { WithdrawMethodTabs } from "@/components/dashboard/withdraw-method-tabs";
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
import {
  collectMiningBalancesForWithdraw,
  platformBalancesForWithdraw,
} from "@/lib/wallet-balances";

const CRYPTO_LABELS: Record<"ETH" | "USDT" | "USDC" | "BTC", string> = {
  ETH: "Ethereum",
  USDT: "Tether (ERC-20)",
  USDC: "USD Coin (ERC-20)",
  BTC: "Bitcoin",
};

export default async function WithdrawPage() {
  const current = await getCurrentUser();
  if (!current) {
    return null;
  }

  const convex = getConvexClient();
  const [withdrawals, bankWithdrawals] = await Promise.all([
    convex.query(api.withdrawals.listUserWithdrawals, {
      userId: current.user._id,
      limit: 25,
    }),
    convex.query(api.bankWithdrawals.listUserBankWithdrawals, {
      userId: current.user._id,
      limit: 25,
    }),
  ]);

  const history = [
    ...withdrawals.map((withdrawal: Doc<"withdrawals">) => ({
      method: "crypto" as const,
      withdrawal,
    })),
    ...bankWithdrawals.map((bankWithdrawal: Doc<"bankWithdrawals">) => ({
      method: "bank" as const,
      bankWithdrawal,
    })),
  ].sort((a, b) => {
    const aTime = a.method === "crypto" ? a.withdrawal.createdAt : a.bankWithdrawal.createdAt;
    const bTime = b.method === "crypto" ? b.withdrawal.createdAt : b.bankWithdrawal.createdAt;
    return bTime - aTime;
  });

  const platformBalances = platformBalancesForWithdraw(current.user.platformBalance);
  const miningBalances = collectMiningBalancesForWithdraw(current.user.miningBalance);

  const platformRows = (
    Object.entries(platformBalances) as Array<[keyof typeof platformBalances, number]>
  ).map(([currency, value]) => [currency, value] as const);

  const miningRows = Object.entries(miningBalances).sort(([a], [b]) => a.localeCompare(b));

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
            <CardDescription>
              Choose platform (deposit) or mining earnings when you submit a withdrawal.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Platform (deposit) wallet
              </p>
              <div className="space-y-2">
                {platformRows.map(([currency, value]) => (
                  <div
                    key={currency}
                    className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2"
                  >
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {currency}
                      </p>
                      <p className="font-semibold">{CRYPTO_LABELS[currency as keyof typeof CRYPTO_LABELS]}</p>
                    </div>
                    <span className="font-medium tabular-nums">{value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Mining earnings
              </p>
              {miningRows.length === 0 ? (
                <p className="rounded-md border border-dashed border-border/60 px-3 py-2 text-muted-foreground">
                  No mined balances yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {miningRows.map(([currency, value]) => (
                    <div
                      key={currency}
                      className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2"
                    >
                      <span className="font-medium">{currency}</span>
                      <span className="tabular-nums">{value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            <WithdrawMethodTabs
              platformBalances={platformBalances}
              miningBalances={miningBalances}
            />
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/60 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle>Withdrawal history</CardTitle>
          <CardDescription>Track the status of recent withdrawal requests.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {history.length === 0 ? (
            <p className="text-muted-foreground">No withdrawal requests yet.</p>
          ) : (
            history.map((entry) => {
              if (entry.method === "crypto") {
                const withdrawal = entry.withdrawal;
                return (
                  <article key={withdrawal._id} className="rounded-lg border border-border/60 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          <span className="mr-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Crypto
                          </span>
                          {withdrawal.amount.toLocaleString()} {withdrawal.crypto}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Destination: {withdrawal.destinationAddress}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Requested {formatDate(withdrawal.createdAt)}
                          {withdrawal.balanceSource === "mining"
                            ? " • From mining earnings"
                            : withdrawal.balanceSource === "platform" || withdrawal.balanceSource === undefined
                              ? " • From platform wallet"
                              : ""}
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
                );
              }

              const bankWithdrawal = entry.bankWithdrawal;
              return (
                <article key={bankWithdrawal._id} className="rounded-lg border border-border/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        <span className="mr-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Bank
                        </span>
                        {bankWithdrawal.amount.toLocaleString()} {bankWithdrawal.crypto} →{" "}
                        {bankWithdrawal.currency}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {bankWithdrawal.bankName} •{" "}
                        {bankWithdrawal.accountNumber.replace(/.(?=.{4})/g, "•")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Requested {formatDate(bankWithdrawal.createdAt)}
                        {bankWithdrawal.balanceSource === "mining"
                          ? " • From mining earnings"
                          : " • From platform wallet"}
                      </p>
                    </div>
                    <StatusBadge status={bankWithdrawal.status} />
                  </div>
                  <div className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                    <span>Account holder: {bankWithdrawal.accountHolderName}</span>
                    <span>Bank country: {bankWithdrawal.bankCountry}</span>
                    {bankWithdrawal.userNote ? <span>User note: {bankWithdrawal.userNote}</span> : null}
                    {bankWithdrawal.adminNote ? (
                      <span>Admin note: {bankWithdrawal.adminNote}</span>
                    ) : null}
                  </div>
                </article>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

