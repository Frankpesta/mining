import type { Doc } from "./_generated/dataModel";

export type EarningTier = "low" | "mid" | "high";

export const EARNING_USD_RANGE: Record<EarningTier, { min: number; max: number }> = {
  low: { min: 10, max: 30 },
  mid: { min: 10, max: 50 },
  high: { min: 10, max: 70 },
};

/** Uniform random whole USD in [min, max] inclusive. */
export function randomDailyUsdForTier(tier: EarningTier): number {
  const { min, max } = EARNING_USD_RANGE[tier];
  return min + Math.floor(Math.random() * (max - min + 1));
}

/**
 * Uses explicit plan.earningTier when set; otherwise infers from price rank among active plans:
 * cheapest → low, most expensive → high, others → mid. Single active plan → mid.
 */
export function resolveEarningTierForPlan(
  plan: Doc<"plans">,
  activePlans: Doc<"plans">[],
): EarningTier {
  const explicit = plan.earningTier;
  if (explicit === "low" || explicit === "mid" || explicit === "high") {
    return explicit;
  }

  const sorted = [...activePlans]
    .filter((p) => p.isActive)
    .sort(
      (a, b) =>
        (a.minPriceUSD ?? a.priceUSD) - (b.minPriceUSD ?? b.priceUSD),
    );

  const n = sorted.length;
  const idx = sorted.findIndex((p) => p._id === plan._id);
  if (idx < 0 || n === 0) {
    return "mid";
  }
  if (n === 1) {
    return "mid";
  }
  if (idx === 0) {
    return "low";
  }
  if (idx === n - 1) {
    return "high";
  }
  return "mid";
}
