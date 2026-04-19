import { ConvexError } from "convex/values";

import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

import {
  approximateMiningBalanceUsd as miningWalletUsdTotal,
  MINING_CORE_DRAIN_ORDER,
  MINING_OPTIONAL_DRAIN_ORDER,
  STATIC_USD_PER_CRYPTO,
} from "../lib/crypto-static-usd";

export function approximateMiningBalanceUsd(user: Doc<"users">): number {
  return miningWalletUsdTotal(user.miningBalance);
}

function drainCoin(
  balance: number,
  usdPerUnit: number,
  remainingUsd: number,
): { newBalance: number; remainingUsd: number } {
  if (remainingUsd <= 1e-9 || balance <= 0) {
    return { newBalance: balance, remainingUsd };
  }
  const usdAvailable = balance * usdPerUnit;
  const takeUsd = Math.min(usdAvailable, remainingUsd);
  const takeCoin = takeUsd / usdPerUnit;
  const newBalance = Math.max(0, balance - takeCoin);
  return {
    newBalance: newBalance < 1e-12 ? 0 : newBalance,
    remainingUsd: remainingUsd - takeUsd,
  };
}

/**
 * Spends USD notional from the mining wallet (ETH → BTC → LTC → optional alts → `others`).
 * Uses the same static prices as {@link approximateMiningBalanceUsd}.
 */
export async function deductUsdFromMiningBalance(
  ctx: MutationCtx,
  user: Doc<"users">,
  amountUsd: number,
): Promise<void> {
  if (amountUsd <= 0) {
    return;
  }

  let remaining = amountUsd;
  const mb = { ...user.miningBalance };
  const others = { ...(mb.others ?? {}) };

  for (const c of MINING_CORE_DRAIN_ORDER) {
    if (remaining <= 1e-9) break;
    const p = STATIC_USD_PER_CRYPTO[c];
    const bal = mb[c] ?? 0;
    const { newBalance, remainingUsd } = drainCoin(bal, p, remaining);
    mb[c] = newBalance;
    remaining = remainingUsd;
  }

  for (const c of MINING_OPTIONAL_DRAIN_ORDER) {
    if (remaining <= 1e-9) break;
    const p = STATIC_USD_PER_CRYPTO[c];
    const bal = (mb[c] ?? 0) as number;
    const { newBalance, remainingUsd } = drainCoin(bal, p, remaining);
    mb[c] = newBalance;
    remaining = remainingUsd;
  }

  if (remaining > 1e-6) {
    const symbols = Object.keys(others).sort();
    for (const sym of symbols) {
      if (remaining <= 1e-9) break;
      const p = STATIC_USD_PER_CRYPTO[sym];
      if (p === undefined) continue;
      const bal = others[sym] ?? 0;
      const { newBalance, remainingUsd } = drainCoin(bal, p, remaining);
      if (newBalance < 1e-12) {
        delete others[sym];
      } else {
        others[sym] = newBalance;
      }
      remaining = remainingUsd;
    }
  }

  if (remaining > 1e-2) {
    throw new ConvexError("Insufficient mined balance for this purchase");
  }

  const cleanedOthers = Object.keys(others).length > 0 ? others : undefined;

  await ctx.db.patch(user._id, {
    miningBalance: {
      ...mb,
      others: cleanedOthers,
    },
  });
}
