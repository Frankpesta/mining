/**
 * Client-side utility to fetch crypto prices from CoinGecko via our API route
 */

import { getAppBaseUrl } from "@/lib/env";

export type CryptoPrices = Record<string, number>;

/**
 * Fetch prices for multiple coins
 * @param coins Array of coin symbols (e.g., ["BTC", "ETH", "USDT"])
 * @returns Object mapping coin symbols to USD prices
 */
export async function getCryptoPrices(coins: string[]): Promise<CryptoPrices> {
  if (coins.length === 0) {
    return {};
  }

  try {
    const coinsParam = coins.join(",");
    // For server-side: use absolute URL, for client-side: use relative URL
    const baseUrl = typeof window === 'undefined' ? getAppBaseUrl() : '';
    const url = baseUrl 
      ? `${baseUrl}/api/crypto-prices?coins=${coinsParam}`
      : `/api/crypto-prices?coins=${coinsParam}`;
    
    const response = await fetch(url, {
      // Cache for 60 seconds to reduce API calls (server-side only)
      ...(typeof window === 'undefined' && { next: { revalidate: 60 } }),
    });

    if (!response.ok) {
      console.error(`Failed to fetch crypto prices: ${response.status}`);
      return {};
    }

    const data = await response.json();
    return data.prices || {};
  } catch (error) {
    console.error("Error fetching crypto prices:", error);
    return {};
  }
}

/**
 * Fetch price for a single coin
 * @param coin Coin symbol (e.g., "BTC")
 * @returns USD price or 0 if not available
 */
export async function getCoinPrice(coin: string): Promise<number> {
  const prices = await getCryptoPrices([coin]);
  return prices[coin.toUpperCase()] ?? 0;
}

/**
 * Calculate total USD value of a balance object
 * @param balance Balance object with coin amounts
 * @param prices Crypto prices object
 * @returns Total USD value
 */
export function calculateBalanceUSD(
  balance: Record<string, number | Record<string, number> | undefined>,
  prices: CryptoPrices
): number {
  let totalUSD = 0;

  for (const [key, value] of Object.entries(balance)) {
    if (key === "others") {
      // Handle others object
      if (value && typeof value === "object") {
        for (const [coin, amount] of Object.entries(value)) {
          const price = prices[coin.toUpperCase()] ?? 0;
          totalUSD += (amount as number) * price;
        }
      }
    } else if (typeof value === "number" && value > 0) {
      const coin = key.toUpperCase();
      const amount = value;

      // For stablecoins, use 1:1 conversion
      if (coin === "USDT" || coin === "USDC") {
        totalUSD += amount;
      } else {
        const price = prices[coin] ?? 0;
        totalUSD += amount * price;
      }
    }
  }

  return totalUSD;
}

