import { parseUnits, formatUnits, encodeFunctionData, type Address } from "viem";
import { getViemClient, normalizeAddress } from "@/lib/blockchain/viem";

// ERC20 token addresses on mainnet
const ERC20_CONTRACTS: Record<"USDT" | "USDC", Address> = {
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7" as Address,
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address,
};

// ERC20 ABI for transfer
const ERC20_ABI = [
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

export type SupportedCrypto = "ETH" | "USDT" | "USDC";

/**
 * Prepare ETH transfer transaction
 */
export function prepareEthTransfer(
  to: string,
  amount: number,
): { to: Address; value: bigint } {
  const normalizedTo = normalizeAddress(to);
  if (!normalizedTo) {
    throw new Error("Invalid recipient address");
  }

  const amountInWei = parseUnits(amount.toString(), 18);
  return {
    to: normalizedTo,
    value: amountInWei,
  };
}

/**
 * Prepare ERC20 token transfer transaction
 */
export function prepareTokenTransfer(
  to: string,
  amount: number,
  token: "USDT" | "USDC",
): { to: Address; data: `0x${string}` } {
  const normalizedTo = normalizeAddress(to);
  if (!normalizedTo) {
    throw new Error("Invalid recipient address");
  }

  const tokenAddress = ERC20_CONTRACTS[token];
  const decimals = 6; // USDT and USDC use 6 decimals
  const amountInSmallestUnit = parseUnits(amount.toString(), decimals);

  // Encode the transfer function call
  const data = encodeFunctionData({
    abi: ERC20_ABI,
    functionName: "transfer",
    args: [normalizedTo, amountInSmallestUnit],
  });

  return {
    to: tokenAddress,
    data: data as `0x${string}`,
  };
}

/**
 * Prepare deposit transaction based on crypto type
 */
export function prepareDepositTransaction(
  to: string,
  amount: number,
  crypto: SupportedCrypto,
) {
  if (crypto === "ETH") {
    return prepareEthTransfer(to, amount);
  }
  return prepareTokenTransfer(to, amount, crypto);
}

