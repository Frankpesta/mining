import type { Doc } from "@/convex/_generated/dataModel";

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

/** Positive mining balances only, for withdrawal picker. */
export function collectMiningBalancesForWithdraw(
  mb: Doc<"users">["miningBalance"],
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const k of ["BTC", "ETH", "LTC"] as const) {
    const v = mb[k];
    if (typeof v === "number" && v > 0) out[k] = v;
  }
  for (const k of MINING_OPTIONAL) {
    const v = mb[k];
    if (typeof v === "number" && v > 0) out[k] = v;
  }
  if (mb.others) {
    for (const [k, v] of Object.entries(mb.others)) {
      if (typeof v === "number" && v > 0) out[k] = v;
    }
  }
  return out;
}

export function platformBalancesForWithdraw(pb: Doc<"users">["platformBalance"]) {
  return {
    ETH: pb.ETH,
    USDT: pb.USDT,
    USDC: pb.USDC,
    BTC: pb.BTC ?? 0,
  };
}
