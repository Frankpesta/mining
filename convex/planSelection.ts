import type { Doc } from "./_generated/dataModel";

function planMinUsd(plan: Doc<"plans">): number {
  return plan.minPriceUSD ?? plan.priceUSD;
}

function planMaxUsd(plan: Doc<"plans">): number {
  return plan.maxPriceUSD ?? Infinity;
}

/**
 * Picks the lowest-tier plan that matches the deposit:
 * first prefers plans whose [min, max] band contains the deposit, breaking ties by lowest min then order.
 * If none, picks the cheapest plan whose minimum is still covered by the deposit.
 * Otherwise falls back to the entry plan by display order.
 */
export function selectLeastQualifyingPlanForDeposit(
  activePlans: Doc<"plans">[],
  depositUsd: number,
): Doc<"plans"> | null {
  if (activePlans.length === 0) {
    return null;
  }

  const inBand = activePlans.filter(
    (p) => depositUsd >= planMinUsd(p) && depositUsd <= planMaxUsd(p),
  );
  if (inBand.length > 0) {
    inBand.sort((a, b) => {
      const d = planMinUsd(a) - planMinUsd(b);
      if (d !== 0) return d;
      return a.order - b.order;
    });
    return inBand[0]!;
  }

  const meetsMin = activePlans.filter((p) => depositUsd >= planMinUsd(p));
  if (meetsMin.length > 0) {
    meetsMin.sort((a, b) => {
      const d = planMinUsd(a) - planMinUsd(b);
      if (d !== 0) return d;
      return a.order - b.order;
    });
    return meetsMin[0]!;
  }

  const byOrder = [...activePlans].sort((a, b) => a.order - b.order);
  return byOrder[0]!;
}
