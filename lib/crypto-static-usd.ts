import type { Doc } from "@/convex/_generated/dataModel";

/**
 * Static USD/unit estimates for UI + reinvestment (server mutations cannot fetch live prices).
 * Keep in sync with deduction order in `convex/miningBalanceUsd.ts`.
 */
export const STATIC_USD_PER_CRYPTO: Record<string, number> = {
  BTC: 60_000,
  ETH: 3_000,
  USDT: 1,
  USDC: 1,
  LTC: 100,
  SOL: 150,
  BNB: 600,
  ADA: 0.5,
  XRP: 0.55,
  DOGE: 0.15,
  DOT: 7,
  MATIC: 0.85,
  AVAX: 35,
  ATOM: 9,
  LINK: 18,
  UNI: 9,
};

export const MINING_CORE_DRAIN_ORDER: Array<"ETH" | "BTC" | "LTC"> = [
  "ETH",
  "BTC",
  "LTC",
];

export const MINING_OPTIONAL_DRAIN_ORDER = [
  "SOL",
  "BNB",
  "ADA",
  "XRP",
  "DOGE",
  "DOT",
  "MATIC",
  "AVAX",
  "ATOM",
  "LINK",
  "UNI",
] as const;

/**
 * USD value of the platform wallet: USDC/USDT at 1:1, ETH and BTC priced via
 * STATIC_USD_PER_CRYPTO by default (or the optional `prices` override, e.g.
 * live prices fetched by an action). Shared by convex/platformBalanceUsd.ts
 * (server) and any UI that needs to display/gate on this figure, so every
 * caller always agrees.
 */
export function totalUsdLikePlatformBalance(
  platformBalance: Doc<"users">["platformBalance"],
  prices?: { ETH?: number; BTC?: number },
): number {
  const ethPrice = prices?.ETH ?? STATIC_USD_PER_CRYPTO.ETH;
  const btcPrice = prices?.BTC ?? STATIC_USD_PER_CRYPTO.BTC;
  return (
    (platformBalance.USDC ?? 0) +
    (platformBalance.USDT ?? 0) +
    (platformBalance.ETH ?? 0) * ethPrice +
    (platformBalance.BTC ?? 0) * btcPrice
  );
}

/**
 * Approximate USD value of mining wallet (for plan purchase / reinvestment
 * UI). `prices` optionally overrides any coin's rate (e.g. live ETH/BTC
 * prices fetched by an action) — coins not present in the override fall
 * back to STATIC_USD_PER_CRYPTO.
 */
export function approximateMiningBalanceUsd(
  miningBalance: Doc<"users">["miningBalance"],
  prices?: Partial<Record<string, number>>,
): number {
  let total = 0;
  for (const c of MINING_CORE_DRAIN_ORDER) {
    const bal = miningBalance[c] ?? 0;
    const p = prices?.[c] ?? STATIC_USD_PER_CRYPTO[c];
    if (bal > 0 && p) total += bal * p;
  }
  for (const c of MINING_OPTIONAL_DRAIN_ORDER) {
    const bal = (miningBalance[c] ?? 0) as number;
    const p = prices?.[c] ?? STATIC_USD_PER_CRYPTO[c];
    if (bal > 0 && p) total += bal * p;
  }
  const others = miningBalance.others ?? {};
  for (const [sym, amt] of Object.entries(others)) {
    const p = prices?.[sym] ?? STATIC_USD_PER_CRYPTO[sym];
    if (p !== undefined && amt > 0) total += amt * p;
  }
  return total;
}
