import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
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

type MiningPayout = Doc<"miningPayouts"> & { planName: string };

function formatCoinAmount(value: number, coin: string) {
  return `${value.toLocaleString("en-US", {
    maximumFractionDigits: coin === "BTC" ? 8 : 6,
    minimumFractionDigits: 0,
  })} ${coin}`;
}

function formatPercent(value: number) {
  return `${value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  })}%`;
}

export default async function TransactionsPage() {
  const current = await getCurrentUser();
  if (!current) {
    return null;
  }

  const convex = getConvexClient();
  const payouts = await convex.query(api.transactions.listUserMiningPayouts, {
    userId: current.user._id,
    limit: 120,
  });

  const totalRoi = payouts.reduce((sum, payout) => sum + payout.profitUSD, 0);
  const latestPayout = payouts[0];
  const averageRoi =
    payouts.length > 0
      ? payouts.reduce((sum, payout) => sum + payout.roiPercent, 0) / payouts.length
      : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Review each daily mining ROI payout credited to your platform and mining balances.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total ROI Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(totalRoi)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Payout Days</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{payouts.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average Daily ROI</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatPercent(averageRoi)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>Daily ROI ledger</CardTitle>
          <CardDescription>
            {latestPayout
              ? `Latest payout recorded ${formatDate(latestPayout.createdAt)}`
              : "Daily ROI payouts will appear here after the next mining cycle"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payouts.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No ROI transactions recorded yet.
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Coin</TableHead>
                      <TableHead>Principal</TableHead>
                      <TableHead>ROI</TableHead>
                      <TableHead>USD Paid</TableHead>
                      <TableHead>Coin Paid</TableHead>
                      <TableHead>Coin Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((payout: MiningPayout) => (
                      <TableRow key={payout._id}>
                        <TableCell className="font-medium text-foreground">
                          {formatDate(payout.payoutDate)}
                        </TableCell>
                        <TableCell>{payout.planName}</TableCell>
                        <TableCell>{payout.coin}</TableCell>
                        <TableCell>{formatCurrency(payout.purchaseAmount)}</TableCell>
                        <TableCell>{formatPercent(payout.roiPercent)}</TableCell>
                        <TableCell className="font-medium text-foreground">
                          {formatCurrency(payout.profitUSD)}
                        </TableCell>
                        <TableCell>{formatCoinAmount(payout.profitCoin, payout.coin)}</TableCell>
                        <TableCell>{formatCurrency(payout.coinPriceUSD)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-col gap-4 md:hidden">
                {payouts.map((payout: MiningPayout) => (
                  <div
                    key={payout._id}
                    className="space-y-3 rounded-lg border border-border/60 bg-card p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground">{payout.planName}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(payout.payoutDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          {formatCurrency(payout.profitUSD)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPercent(payout.roiPercent)} ROI
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Coin paid</span>
                        <span className="text-right font-medium">
                          {formatCoinAmount(payout.profitCoin, payout.coin)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Principal</span>
                        <span className="font-medium">{formatCurrency(payout.purchaseAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-muted-foreground">Coin price</span>
                        <span className="font-medium">{formatCurrency(payout.coinPriceUSD)}</span>
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
