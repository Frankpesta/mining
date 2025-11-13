"use server";

import {
  validateAddress,
  normalizeAddress,
  verifyTransaction,
  getCryptoBalance,
  hasSufficientBalance,
  type SupportedCrypto,
} from "./viem";

/**
 * Admin helper: Verify a deposit transaction
 */
export async function verifyDepositTransaction(
  txHash: string,
  expectedWalletAddress: string,
  expectedAmount: number,
  crypto: SupportedCrypto,
) {
  try {
    const normalizedAddress = normalizeAddress(expectedWalletAddress);
    if (!normalizedAddress) {
      return {
        isValid: false,
        confirmed: false,
        error: "Invalid wallet address format",
      };
    }

    const verification = await verifyTransaction(
      txHash,
      normalizedAddress,
      expectedAmount,
      crypto,
    );

    return verification;
  } catch (error) {
    return {
      isValid: false,
      confirmed: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Admin helper: Check hot wallet balance
 */
export async function checkHotWalletBalance(
  walletAddress: string,
  crypto: SupportedCrypto,
) {
  try {
    if (!validateAddress(walletAddress)) {
      return {
        success: false,
        error: "Invalid wallet address",
      };
    }

    const balance = await getCryptoBalance(walletAddress, crypto);
    return {
      success: true,
      balance,
      crypto,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to check balance",
    };
  }
}

/**
 * Admin helper: Validate withdrawal destination address
 */
export async function validateWithdrawalAddress(address: string) {
  const isValid = validateAddress(address);
  const normalized = isValid ? normalizeAddress(address) : null;

  return {
    isValid,
    normalizedAddress: normalized,
    error: isValid ? undefined : "Invalid Ethereum address format",
  };
}

/**
 * Admin helper: Check if hot wallet has sufficient balance for withdrawal
 */
export async function checkWithdrawalFeasibility(
  walletAddress: string,
  crypto: SupportedCrypto,
  amount: number,
) {
  try {
    if (!validateAddress(walletAddress)) {
      return {
        feasible: false,
        error: "Invalid wallet address",
      };
    }

    const check = await hasSufficientBalance(walletAddress, crypto, amount);
    return {
      feasible: check.hasBalance,
      currentBalance: check.currentBalance,
      requiredAmount: amount,
      shortfall: check.hasBalance ? 0 : amount - check.currentBalance,
    };
  } catch (error) {
    return {
      feasible: false,
      error: error instanceof Error ? error.message : "Failed to check balance",
    };
  }
}

