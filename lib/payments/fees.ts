type Crypto = "ETH" | "USDT" | "USDC";

export const WITHDRAWAL_FEES: Record<Crypto, number> = {
  ETH: 0.001,
  USDT: 10,
  USDC: 10,
};

export function getWithdrawalFee(crypto: Crypto, amount: number) {
  const baseFee = WITHDRAWAL_FEES[crypto] ?? 0;
  if (crypto === "ETH") {
    return Math.max(baseFee, amount * 0.0025); // 0.25% minimum 0.001 ETH
  }
  return baseFee;
}

