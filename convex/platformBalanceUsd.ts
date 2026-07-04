import { ConvexError } from "convex/values";

import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { STATIC_USD_PER_CRYPTO } from "../lib/crypto-static-usd";

/**
 * USD value of the platform wallet: USDC/USDT at 1:1, ETH and BTC priced via
 * STATIC_USD_PER_CRYPTO (mutations can't fetch live prices — same approach as
 * approximateMiningBalanceUsd in miningBalanceUsd.ts). BTC must be included:
 * most deposits on this platform are BTC, so omitting it left BTC-funded
 * users unable to pass the balance check when purchasing a mining plan.
 */
export function totalUsdLikePlatformBalance(user: Doc<"users">): number {
  const pb = user.platformBalance;
  return (
    (pb.USDC ?? 0) +
    (pb.USDT ?? 0) +
    (pb.ETH ?? 0) * STATIC_USD_PER_CRYPTO.ETH +
    (pb.BTC ?? 0) * STATIC_USD_PER_CRYPTO.BTC
  );
}

/**
 * Deducts `amount` USD from USDC, then USDT, then ETH, then BTC (ETH/BTC
 * priced via STATIC_USD_PER_CRYPTO). Throws if insufficient.
 */
export async function deductUsdLikeFromPlatformBalance(
  ctx: MutationCtx,
  user: Doc<"users">,
  amount: number,
): Promise<void> {
  if (amount <= 0) {
    return;
  }
  let remaining = amount;
  let usdc = user.platformBalance.USDC ?? 0;
  let usdt = user.platformBalance.USDT ?? 0;
  let eth = user.platformBalance.ETH ?? 0;
  let btc = user.platformBalance.BTC ?? 0;

  const takeStable = (bal: number): number => {
    if (remaining <= 0 || bal <= 0) return bal;
    const take = Math.min(bal, remaining);
    remaining -= take;
    return bal - take;
  };

  const takePriced = (bal: number, usdPerUnit: number): number => {
    if (remaining <= 0 || bal <= 0) return bal;
    const usdAvailable = bal * usdPerUnit;
    const takeUsd = Math.min(usdAvailable, remaining);
    remaining -= takeUsd;
    return bal - takeUsd / usdPerUnit;
  };

  usdc = takeStable(usdc);
  usdt = takeStable(usdt);
  eth = takePriced(eth, STATIC_USD_PER_CRYPTO.ETH);
  btc = takePriced(btc, STATIC_USD_PER_CRYPTO.BTC);

  if (remaining > 1e-6) {
    throw new ConvexError("Insufficient platform balance");
  }

  await ctx.db.patch(user._id, {
    platformBalance: {
      ...user.platformBalance,
      USDC: usdc,
      USDT: usdt,
      ETH: eth,
      BTC: btc,
    },
  });
}
