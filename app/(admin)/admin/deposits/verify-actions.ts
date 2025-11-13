"use server";

import { verifyDepositTransaction } from "@/lib/blockchain/admin-helpers";

export async function verifyDepositTx(
  txHash: string,
  walletAddress: string,
  amount: number,
  crypto: "ETH" | "USDT" | "USDC",
) {
  try {
    const result = await verifyDepositTransaction(txHash, walletAddress, amount, crypto);
    return result;
  } catch (error) {
    return {
      isValid: false,
      confirmed: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

