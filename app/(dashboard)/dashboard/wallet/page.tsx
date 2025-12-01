import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/utils";
import { getCryptoPrices, calculateBalanceUSD } from "@/lib/crypto-prices";

export default async function WalletPage() {
  const current = await getCurrentUser();
  const user = current?.user;

  // Collect all coins from balances
  const platformCoins: string[] = [];
  const miningCoins: string[] = [];

  if (user?.platformBalance) {
    for (const [key, value] of Object.entries(user.platformBalance)) {
      if (key !== "others" && typeof value === "number" && value > 0) {
        platformCoins.push(key);
      }
      if (key === "others" && value && typeof value === "object") {
        platformCoins.push(...Object.keys(value));
      }
    }
  }

  if (user?.miningBalance) {
    for (const [key, value] of Object.entries(user.miningBalance)) {
      if (key !== "others" && typeof value === "number" && value > 0) {
        miningCoins.push(key);
      }
      if (key === "others" && value && typeof value === "object") {
        miningCoins.push(...Object.keys(value));
      }
    }
  }

  // Fetch prices for all coins
  const allCoins = [...new Set([...platformCoins, ...miningCoins])];
  const prices = allCoins.length > 0 ? await getCryptoPrices(allCoins) : {};

  // Calculate USD values
  const platformBalanceUSD = user?.platformBalance
    ? calculateBalanceUSD(user.platformBalance, prices)
    : 0;
  const miningBalanceUSD = user?.miningBalance
    ? calculateBalanceUSD(user.miningBalance, prices)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Portfolio balances</h1>
        <p className="text-sm text-muted-foreground">
          Overview of platform wallet funds and accumulated mining earnings by asset.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Platform wallet</CardTitle>
            <CardDescription>Spendable balance for purchases and withdrawals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {/* Display all coins in platform balance */}
            {user?.platformBalance && (
              <>
                {Object.entries(user.platformBalance)
                  .filter(([key, value]: [string, unknown]) => {
                    if (key === "others") return false;
                    return typeof value === "number" && value > 0;
                  })
                  .map(([coin, value]: [string, unknown]) => (
                    <BalanceRow key={coin} label={coin} value={value as number} />
                  ))}
                {user.platformBalance.others &&
                  (Object.entries(user.platformBalance.others) as [string, number][]).map(([coin, value]) => (
                    <BalanceRow key={coin} label={coin} value={value} />
                  ))}
              </>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs uppercase tracking-wide text-muted-foreground">
              <span>Total (USD)</span>
              <span className="text-sm font-semibold">{formatCurrency(platformBalanceUSD)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader>
            <CardTitle>Mining earnings</CardTitle>
            <CardDescription>Realized rewards awaiting withdrawal.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {/* Display all coins in mining balance */}
            {user?.miningBalance && (
              <>
                {Object.entries(user.miningBalance as Record<string, number | Record<string, number> | undefined>)
                  .filter(([key, value]: [string, unknown]) => {
                    if (key === "others") return false;
                    return typeof value === "number" && value > 0;
                  })
                  .map(([coin, value]: [string, unknown]) => (
                    <BalanceRow key={coin} label={coin} value={value as number} />
                  ))}
                {user.miningBalance.others
                  ? (Object.entries(user.miningBalance.others) as [string, number][]).map(([coin, value]) => (
                      <BalanceRow key={coin} label={coin} value={value} />
                    ))
                  : null}
              </>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs uppercase tracking-wide text-muted-foreground">
              <span>Total (USD)</span>
              <span className="text-sm font-semibold">{formatCurrency(miningBalanceUSD)}</span>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function BalanceRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium">{label}</span>
      <span className="tabular-nums">{value.toLocaleString()}</span>
    </div>
  );
}

