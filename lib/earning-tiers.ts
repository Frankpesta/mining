export type EarningTier = "low" | "mid" | "high";

export const EARNING_USD_RANGE: Record<EarningTier, { min: number; max: number }> = {
  low: { min: 10, max: 30 },
  mid: { min: 10, max: 50 },
  high: { min: 10, max: 70 },
};

const TIER_LABEL: Record<EarningTier, string> = {
  low: "Entry",
  mid: "Growth",
  high: "Max",
};

export function formatEarningTierRange(tier: EarningTier): string {
  const r = EARNING_USD_RANGE[tier];
  return `$${r.min}–$${r.max}/day variable`;
}

export function formatEarningTierWithLabel(tier: EarningTier): string {
  return `${TIER_LABEL[tier]} • ${formatEarningTierRange(tier)}`;
}

type PlanForInfer = {
  _id: string;
  minPriceUSD?: number;
  priceUSD: number;
  earningTier?: EarningTier;
};

/** Matches Convex `resolveEarningTierForPlan` when earningTier is unset. */
export function inferEarningTierForPlan(
  planId: string,
  plans: PlanForInfer[],
): EarningTier {
  const plan = plans.find((p) => p._id === planId);
  if (
    plan?.earningTier === "low" ||
    plan?.earningTier === "mid" ||
    plan?.earningTier === "high"
  ) {
    return plan.earningTier;
  }

  const sorted = [...plans].sort(
    (a, b) => (a.minPriceUSD ?? a.priceUSD) - (b.minPriceUSD ?? b.priceUSD),
  );
  const n = sorted.length;
  const idx = sorted.findIndex((p) => p._id === planId);
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
