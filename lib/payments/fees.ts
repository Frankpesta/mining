/** Shared with Convex `withdrawals.ts` fee logic where applicable. */
export const WITHDRAWAL_FEES: Record<string, number> = {
  BTC: 0.0001,
  ETH: 0.001,
  SOL: 0.01,
  LTC: 0.001,
  BNB: 0.001,
  ADA: 1,
  XRP: 0.1,
  DOGE: 1,
  DOT: 0.1,
  MATIC: 0.1,
  AVAX: 0.01,
  ATOM: 0.01,
  LINK: 0.1,
  UNI: 0.1,
  USDT: 10,
  USDC: 10,
};

export function getWithdrawalFee(crypto: string, amount: number) {
  const baseFee = WITHDRAWAL_FEES[crypto] ?? 0.001;
  if (crypto === "ETH") {
    return Math.max(baseFee, amount * 0.0025);
  }
  if (crypto === "BTC") {
    return Math.max(baseFee, amount * 0.0001);
  }
  return baseFee;
}
