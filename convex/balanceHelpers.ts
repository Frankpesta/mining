import type { Doc } from "./_generated/dataModel";

const PLATFORM_OPTIONAL = [
  "BTC",
  "SOL",
  "LTC",
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

export function readPlatformCoinBalance(user: Doc<"users">, crypto: string): number {
  const pb = user.platformBalance;
  if (crypto === "ETH" || crypto === "USDT" || crypto === "USDC") {
    return pb[crypto];
  }
  if (crypto === "BTC") return pb.BTC ?? 0;
  if (PLATFORM_OPTIONAL.includes(crypto as (typeof PLATFORM_OPTIONAL)[number])) {
    const k = crypto as (typeof PLATFORM_OPTIONAL)[number];
    return (pb[k] ?? 0) as number;
  }
  return pb.others?.[crypto] ?? 0;
}

export function patchPlatformCoinBalance(
  user: Doc<"users">,
  crypto: string,
  normalized: number,
): Doc<"users">["platformBalance"] {
  const pb = user.platformBalance;
  if (crypto === "ETH" || crypto === "USDT" || crypto === "USDC") {
    return { ...pb, [crypto]: normalized };
  }
  if (crypto === "BTC") return { ...pb, BTC: normalized };
  if (PLATFORM_OPTIONAL.includes(crypto as (typeof PLATFORM_OPTIONAL)[number])) {
    const k = crypto as (typeof PLATFORM_OPTIONAL)[number];
    return { ...pb, [k]: normalized };
  }
  const others = { ...(pb.others ?? {}) };
  if (normalized < 1e-12) {
    delete others[crypto];
  } else {
    others[crypto] = normalized;
  }
  return { ...pb, others };
}

const MINING_OPTIONAL = [
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

export function readMiningCoinBalance(user: Doc<"users">, crypto: string): number {
  if (crypto === "BTC") return user.miningBalance.BTC;
  if (crypto === "ETH") return user.miningBalance.ETH;
  if (crypto === "LTC") return user.miningBalance.LTC;
  if (MINING_OPTIONAL.includes(crypto as (typeof MINING_OPTIONAL)[number])) {
    const k = crypto as (typeof MINING_OPTIONAL)[number];
    return (user.miningBalance[k] ?? 0) as number;
  }
  return user.miningBalance.others?.[crypto] ?? 0;
}

export function patchMiningCoinBalance(
  user: Doc<"users">,
  crypto: string,
  normalized: number,
): Doc<"users">["miningBalance"] {
  const mb = user.miningBalance;
  if (crypto === "BTC") return { ...mb, BTC: normalized };
  if (crypto === "ETH") return { ...mb, ETH: normalized };
  if (crypto === "LTC") return { ...mb, LTC: normalized };
  if (MINING_OPTIONAL.includes(crypto as (typeof MINING_OPTIONAL)[number])) {
    const k = crypto as (typeof MINING_OPTIONAL)[number];
    return { ...mb, [k]: normalized };
  }
  const others = { ...(mb.others ?? {}) };
  if (normalized < 1e-12) {
    delete others[crypto];
  } else {
    others[crypto] = normalized;
  }
  return { ...mb, others };
}
