import { createPublicClient, http, isAddress, formatUnits, parseUnits, type Address, type PublicClient } from "viem";
import { mainnet, sepolia } from "viem/chains";

export type SupportedCrypto = "ETH" | "USDT" | "USDC";

// ERC20 token addresses on mainnet
const ERC20_CONTRACTS: Record<SupportedCrypto, Address> = {
  ETH: "0x0000000000000000000000000000000000000000" as Address, // Native ETH
  USDT: "0xdAC17F958D2ee523a2206206994597C13D831ec7" as Address,
  USDC: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as Address,
};

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
] as const;

/**
 * Get the appropriate viem client based on environment
 */
export function getViemClient(): PublicClient {
  const rpcUrl = process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || process.env.ETHEREUM_RPC_URL;
  const chain = process.env.NODE_ENV === "production" ? mainnet : sepolia;

  if (rpcUrl) {
    return createPublicClient({
      chain,
      transport: http(rpcUrl),
    });
  }

  // Fallback to public RPC
  return createPublicClient({
    chain,
    transport: http(),
  });
}

/**
 * Validate an Ethereum address
 */
export function validateAddress(address: string): boolean {
  try {
    return isAddress(address);
  } catch {
    return false;
  }
}

/**
 * Normalize an address to checksum format
 */
export function normalizeAddress(address: string): Address | null {
  try {
    if (!isAddress(address)) {
      return null;
    }
    return address as Address;
  } catch {
    return null;
  }
}

/**
 * Get ETH balance for an address
 */
export async function getEthBalance(address: string): Promise<number> {
  try {
    const normalizedAddress = normalizeAddress(address);
    if (!normalizedAddress) {
      throw new Error("Invalid address");
    }

    const client = getViemClient();
    const balance = await client.getBalance({ address: normalizedAddress });
    const balanceInEth = parseFloat(formatUnits(balance, 18));

    return balanceInEth;
  } catch (error) {
    console.error("[getEthBalance] Error:", error);
    throw new Error(`Failed to fetch ETH balance: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Get ERC20 token balance (USDT/USDC)
 */
export async function getTokenBalance(
  address: string,
  token: "USDT" | "USDC",
): Promise<number> {
  try {
    const normalizedAddress = normalizeAddress(address);
    if (!normalizedAddress) {
      throw new Error("Invalid address");
    }

    const tokenAddress = ERC20_CONTRACTS[token];
    if (!tokenAddress || tokenAddress === "0x0000000000000000000000000000000000000000") {
      throw new Error(`Invalid token: ${token}`);
    }

    const client = getViemClient();
    const balance = await client.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [normalizedAddress],
    });

    // USDT and USDC use 6 decimals
    const decimals = token === "USDT" || token === "USDC" ? 6 : 18;
    const balanceInTokens = parseFloat(formatUnits(balance as bigint, decimals));

    return balanceInTokens;
  } catch (error) {
    console.error(`[getTokenBalance] Error for ${token}:`, error);
    throw new Error(
      `Failed to fetch ${token} balance: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Get balance for any supported cryptocurrency
 */
export async function getCryptoBalance(
  address: string,
  crypto: SupportedCrypto,
): Promise<number> {
  if (crypto === "ETH") {
    return getEthBalance(address);
  }
  return getTokenBalance(address, crypto);
}

/**
 * Verify a transaction hash exists and matches expected parameters
 */
export async function verifyTransaction(
  txHash: string,
  expectedTo: string,
  expectedAmount?: number,
  expectedCrypto?: SupportedCrypto,
): Promise<{
  isValid: boolean;
  confirmed: boolean;
  actualAmount?: number;
  actualTo?: string;
  blockNumber?: bigint;
  error?: string;
}> {
  try {
    const client = getViemClient();
    const tx = await client.getTransaction({ hash: txHash as `0x${string}` });

    if (!tx) {
      return {
        isValid: false,
        confirmed: false,
        error: "Transaction not found",
      };
    }

    const receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
    const confirmed = receipt.status === "success";

    // Verify recipient address
    const normalizedExpectedTo = normalizeAddress(expectedTo);
    const normalizedActualTo = normalizeAddress(tx.to || "");
    const toMatches = normalizedExpectedTo && normalizedActualTo && normalizedExpectedTo.toLowerCase() === normalizedActualTo.toLowerCase();

    if (!toMatches) {
      return {
        isValid: false,
        confirmed,
        actualTo: tx.to || undefined,
        error: "Recipient address does not match",
      };
    }

    // For ETH transfers, verify amount
    if (expectedCrypto === "ETH" && expectedAmount !== undefined) {
      const actualAmount = parseFloat(formatUnits(tx.value, 18));
      const amountMatches = Math.abs(actualAmount - expectedAmount) < 0.0001; // Allow small tolerance

      if (!amountMatches) {
        return {
          isValid: false,
          confirmed,
          actualAmount,
          actualTo: tx.to || undefined,
          error: `Amount mismatch. Expected: ${expectedAmount}, Actual: ${actualAmount}`,
        };
      }

      return {
        isValid: true,
        confirmed,
        actualAmount,
        actualTo: tx.to || undefined,
        blockNumber: receipt.blockNumber,
      };
    }

    // For ERC20 tokens, we'd need to parse the transaction data
    // This is a simplified version - in production, you'd decode the transfer event
    return {
      isValid: true,
      confirmed,
      actualTo: tx.to || undefined,
      blockNumber: receipt.blockNumber,
    };
  } catch (error) {
    console.error("[verifyTransaction] Error:", error);
    return {
      isValid: false,
      confirmed: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if an address has sufficient balance for a withdrawal
 */
export async function hasSufficientBalance(
  address: string,
  crypto: SupportedCrypto,
  requiredAmount: number,
): Promise<{ hasBalance: boolean; currentBalance: number }> {
  try {
    const balance = await getCryptoBalance(address, crypto);
    return {
      hasBalance: balance >= requiredAmount,
      currentBalance: balance,
    };
  } catch (error) {
    console.error("[hasSufficientBalance] Error:", error);
    return {
      hasBalance: false,
      currentBalance: 0,
    };
  }
}

