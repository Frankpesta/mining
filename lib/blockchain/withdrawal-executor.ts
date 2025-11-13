"use server";

import { createWalletClient, http, parseUnits, formatUnits, type Address } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import {
  normalizeAddress,
  validateAddress,
  type SupportedCrypto,
} from "./viem";

// ERC20 token addresses
const ERC20_CONTRACTS: Record<"USDT" | "USDC", Address> = {
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7" as Address,
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address,
};

// ERC20 ABI for transfer
const ERC20_TRANSFER_ABI = [
  {
    constant: false,
    inputs: [
      { name: "_to", type: "address" },
      { name: "_value", type: "uint256" },
    ],
    name: "transfer",
    outputs: [{ name: "", type: "bool" }],
    type: "function",
  },
] as const;

/**
 * Get wallet client for executing transactions
 * Note: This requires a private key from environment variables
 */
function getWalletClient() {
  const privateKey = process.env.HOT_WALLET_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("HOT_WALLET_PRIVATE_KEY environment variable is not set");
  }

  if (!privateKey.startsWith("0x")) {
    throw new Error("Private key must start with 0x");
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const chain = process.env.NODE_ENV === "production" ? mainnet : sepolia;
  const rpcUrl = process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || process.env.ETHEREUM_RPC_URL;

  return createWalletClient({
    account,
    chain,
    transport: rpcUrl ? http(rpcUrl) : http(),
  });
}

/**
 * Execute an ETH withdrawal
 */
export async function executeEthWithdrawal(
  fromAddress: string,
  toAddress: string,
  amount: number,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // Validate addresses
    const normalizedFrom = normalizeAddress(fromAddress);
    const normalizedTo = normalizeAddress(toAddress);

    if (!normalizedFrom || !normalizedTo) {
      return {
        success: false,
        error: "Invalid address format",
      };
    }

    // Verify the from address matches the wallet client account
    const walletClient = getWalletClient();
    if (walletClient.account.address.toLowerCase() !== normalizedFrom.toLowerCase()) {
      return {
        success: false,
        error: "From address does not match configured hot wallet",
      };
    }

    // Convert amount to wei
    const amountInWei = parseUnits(amount.toString(), 18);

    // Send transaction
    const hash = await walletClient.sendTransaction({
      to: normalizedTo,
      value: amountInWei,
    });

    return {
      success: true,
      txHash: hash,
    };
  } catch (error) {
    console.error("[executeEthWithdrawal] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Execute an ERC20 token withdrawal (USDT/USDC)
 */
export async function executeTokenWithdrawal(
  fromAddress: string,
  toAddress: string,
  amount: number,
  token: "USDT" | "USDC",
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    // Validate addresses
    const normalizedFrom = normalizeAddress(fromAddress);
    const normalizedTo = normalizeAddress(toAddress);

    if (!normalizedFrom || !normalizedTo) {
      return {
        success: false,
        error: "Invalid address format",
      };
    }

    // Verify the from address matches the wallet client account
    const walletClient = getWalletClient();
    if (walletClient.account.address.toLowerCase() !== normalizedFrom.toLowerCase()) {
      return {
        success: false,
        error: "From address does not match configured hot wallet",
      };
    }

    const tokenAddress = ERC20_CONTRACTS[token];
    const decimals = 6; // USDT and USDC use 6 decimals
    const amountInSmallestUnit = parseUnits(amount.toString(), decimals);

    // Execute transfer
    const hash = await walletClient.writeContract({
      address: tokenAddress,
      abi: ERC20_TRANSFER_ABI,
      functionName: "transfer",
      args: [normalizedTo, amountInSmallestUnit],
    });

    return {
      success: true,
      txHash: hash,
    };
  } catch (error) {
    console.error(`[executeTokenWithdrawal] Error for ${token}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Execute a withdrawal for any supported cryptocurrency
 */
export async function executeWithdrawal(
  fromAddress: string,
  toAddress: string,
  amount: number,
  crypto: SupportedCrypto,
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  if (crypto === "ETH") {
    return executeEthWithdrawal(fromAddress, toAddress, amount);
  }
  return executeTokenWithdrawal(fromAddress, toAddress, amount, crypto);
}

