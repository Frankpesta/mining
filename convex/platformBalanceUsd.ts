import { ConvexError } from "convex/values";

import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import {
  STATIC_USD_PER_CRYPTO,
  totalUsdLikePlatformBalance as totalUsdLikePlatformBalanceShared,
} from "../lib/crypto-static-usd";

/**
 * USD value of the platform wallet: USDC/USDT at 1:1, ETH and BTC priced via
 * STATIC_USD_PER_CRYPTO (mutations can't fetch live prices — same approach as
 * approximateMiningBalanceUsd in miningBalanceUsd.ts). BTC must be included:
 * most deposits on this platform are BTC, so omitting it left BTC-funded
 * users unable to pass the balance check when purchasing a mining plan.
 *
 * Re-exported from lib/crypto-static-usd.ts so client-side pages (e.g. the
 * mining-packages balance display) compute this the exact same way the
 * server does — they must never diverge.
 *
 * `prices` optionally overrides ETH/BTC valuation (e.g. with live prices an
 * action fetched) — callers that only have mutation context omit it and get
 * the static reference rates.
 */
export function totalUsdLikePlatformBalance(
  user: Doc<"users">,
  prices?: { ETH?: number; BTC?: number },
): number {
  return totalUsdLikePlatformBalanceShared(user.platformBalance, prices);
}

/**
 * Deducts `amount` USD from USDC, then USDT, then ETH, then BTC (ETH/BTC
 * priced via STATIC_USD_PER_CRYPTO, or the optional `prices` override).
 * Throws if insufficient.
 */
export async function deductUsdLikeFromPlatformBalance(
  ctx: MutationCtx,
  user: Doc<"users">,
  amount: number,
  prices?: { ETH?: number; BTC?: number },
): Promise<void> {
  if (amount <= 0) {
    return;
  }
  const ethPrice = prices?.ETH ?? STATIC_USD_PER_CRYPTO.ETH;
  const btcPrice = prices?.BTC ?? STATIC_USD_PER_CRYPTO.BTC;
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
  eth = takePriced(eth, ethPrice);
  btc = takePriced(btc, btcPrice);

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
