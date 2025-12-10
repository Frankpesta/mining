import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { DepositFormWallet } from "@/components/dashboard/deposit-form-wallet";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { getCurrentUser } from "@/lib/auth/session";
import { getConvexClient } from "@/lib/convex/client";
import { formatDate } from "@/lib/utils";

const CRYPTO_LABELS: Record<"ETH" | "BTC", string> = {
  ETH: "Ethereum",
  BTC: "Bitcoin",
};

export default async function PurchaseHashPowerPage() {
  const current = await getCurrentUser();
  if (!current) {
    return null;
  }

  const convex = getConvexClient();

  const [hotWallets, deposits] = await Promise.all([
    convex.query(api.hotWallets.listHotWallets, {}),
    convex.query(api.deposits.listUserDeposits, {
      userId: current.user._id,
      limit: 25,
    }),
  ]);

  const walletOptions = hotWallets
    .filter((wallet: Doc<"hotWallets">) => wallet.crypto === "ETH" || wallet.crypto === "BTC")
    .map((wallet: Doc<"hotWallets">) => ({
      crypto: wallet.crypto as "ETH" | "BTC",
      address: wallet.address,
      label: wallet.label,
    }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Purchase HashPower</h1>
        <p className="text-sm text-muted-foreground">
          Choose a supported crypto asset and follow the instructions to add funds to your platform
          balance.
        </p>
      </div>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Send your deposit</CardTitle>
            <CardDescription>
              Transfer funds to one of the addresses below, then submit the request for review.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            {walletOptions.length === 0 ? (
              <div className="rounded-md border border-dashed border-amber-500/60 bg-amber-500/10 p-4 text-xs">
                <p className="font-semibold text-amber-600 dark:text-amber-300">
                  No hot wallets configured
                </p>
                <p className="mt-1 text-amber-600/80 dark:text-amber-200/80">
                  Contact support or an administrator to configure deposit addresses.
                </p>
              </div>
            ) : (
              walletOptions.map((wallet: { crypto: "ETH" | "BTC"; address: string; label?: string | undefined }) => (
                <div key={wallet.crypto} className="rounded-md border border-border/60 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {wallet.crypto}
                  </p>
                  <p className="font-semibold">{CRYPTO_LABELS[wallet.crypto]}</p>
                  <p className="mt-2 font-mono text-xs break-all">{wallet.address}</p>
                  {wallet.label ? (
                    <p className="mt-2 text-xs text-muted-foreground">Label: {wallet.label}</p>
                  ) : null}
                </div>
              ))
            )}
            <p className="text-xs text-muted-foreground">
              Deposits require 1-3 confirmations depending on the asset. Admins will credit your
              balance once the transaction is verified.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Submit deposit request</CardTitle>
            <CardDescription>
              Provide the amount and optional transaction hash so we can reconcile your transfer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DepositFormWallet wallets={walletOptions} />
          </CardContent>
        </Card>
      </section>

      <Card className="border-border/60 bg-card/80">
        <CardHeader className="pb-3">
          <CardTitle>Recent deposit requests</CardTitle>
          <CardDescription>Track status updates and confirmation notes from admins.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {deposits.length === 0 ? (
            <p className="text-muted-foreground">No deposits submitted yet.</p>
          ) : (
            deposits.map((deposit: Doc<"deposits">) => (
              <article key={deposit._id} className="rounded-lg border border-border/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {deposit.amount.toLocaleString()} {deposit.crypto}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Submitted {formatDate(deposit.createdAt)}
                    </p>
                  </div>
                  <StatusBadge status={deposit.status} />
                </div>
                <div className="mt-3 grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                  <span>Wallet: {deposit.walletAddress}</span>
                  {deposit.txHash ? (
                    <span className="truncate">
                      Tx hash: <span className="font-mono">{deposit.txHash}</span>
                    </span>
                  ) : (
                    <span className="italic">Tx hash pending</span>
                  )}
                  {deposit.adminNote ? <span>Admin note: {deposit.adminNote}</span> : null}
                </div>
              </article>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

