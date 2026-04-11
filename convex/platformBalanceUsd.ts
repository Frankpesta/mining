import { ConvexError } from "convex/values";

import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

/** Matches plan purchase: USDC + USDT + ETH treated as USD face value. */
export function totalUsdLikePlatformBalance(user: Doc<"users">): number {
  return (
    user.platformBalance.USDC + user.platformBalance.USDT + user.platformBalance.ETH
  );
}

/**
 * Deducts `amount` USD from USDC, then USDT, then ETH (1:1 USD face).
 * Throws if insufficient.
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
  let usdc = user.platformBalance.USDC;
  let usdt = user.platformBalance.USDT;
  let eth = user.platformBalance.ETH;

  if (usdc >= remaining) {
    usdc -= remaining;
    remaining = 0;
  } else {
    remaining -= usdc;
    usdc = 0;
  }

  if (remaining > 0 && usdt >= remaining) {
    usdt -= remaining;
    remaining = 0;
  } else if (remaining > 0) {
    remaining -= usdt;
    usdt = 0;
  }

  if (remaining > 0 && eth >= remaining) {
    eth -= remaining;
    remaining = 0;
  } else if (remaining > 0) {
    throw new ConvexError("Insufficient platform balance");
  }

  await ctx.db.patch(user._id, {
    platformBalance: {
      ...user.platformBalance,
      USDC: usdc,
      USDT: usdt,
      ETH: eth,
    },
  });
}
