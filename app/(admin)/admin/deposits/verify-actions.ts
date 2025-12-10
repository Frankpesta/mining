"use server";

import { verifyDepositTransaction } from "@/lib/blockchain/admin-helpers";

export async function verifyDepositTx(
  txHash: string,
  walletAddress: string,
  amount: number,
  crypto: "ETH" | "BTC",
) {
  try {
    // BTC verification is not yet supported (uses different blockchain)
    if (crypto === "BTC") {
      return {
        isValid: false,
        confirmed: false,
        error: "BTC transaction verification is not yet supported. Please verify manually.",
      };
    }
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

