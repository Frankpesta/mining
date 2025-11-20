import { query, action } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/**
 * Supported mainstream coins for mining and platform balance
 */
export const MAINSTREAM_COINS = [
  "BTC",
  "ETH",
  "SOL", // Solana
  "LTC",
  "BNB", // Binance Coin
  "ADA", // Cardano
  "XRP", // Ripple
  "DOGE", // Dogecoin
  "DOT", // Polkadot
  "MATIC", // Polygon
  "AVAX", // Avalanche
  "ATOM", // Cosmos
  "LINK", // Chainlink
  "UNI", // Uniswap
  "USDT",
  "USDC",
] as const;

export type MainstreamCoin = (typeof MAINSTREAM_COINS)[number];

/**
 * CoinGecko API endpoint for price data
 */
const COINGECKO_API = "https://api.coingecko.com/api/v3";

/**
 * Rate limiting: CoinGecko free tier allows ~10-50 calls/minute
 * We'll implement retry logic with exponential backoff for 429 errors
 */
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Helper function to sleep/delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Map coin symbols to CoinGecko IDs
 */
const COIN_ID_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  LTC: "litecoin",
  BNB: "binancecoin",
  ADA: "cardano",
  XRP: "ripple",
  DOGE: "dogecoin",
  DOT: "polkadot",
  MATIC: "matic-network",
  AVAX: "avalanche-2",
  ATOM: "cosmos",
  LINK: "chainlink",
  UNI: "uniswap",
  USDT: "tether",
  USDC: "usd-coin",
};

/**
 * Get price for a single coin (query - deprecated, use action instead)
 * Note: Queries can't use fetch, so this returns 0
 * Client-side code should use getCoinPriceAction instead
 */
export const getCoinPrice = query({
  args: {
    coin: v.string(),
  },
  handler: async (ctx, args) => {
    // Queries can't fetch, so return 0
    // Client-side code should use the action version instead
    return 0;
  },
});

/**
 * Get price for a single coin (action - for use in mutations)
 * This uses fetch which is only allowed in actions
 * Includes retry logic with exponential backoff for rate limiting
 */
export const getCoinPriceAction = action({
  args: {
    coin: v.string(),
  },
  handler: async (ctx, args) => {
    const coinId = COIN_ID_MAP[args.coin.toUpperCase()];
    if (!coinId) {
      return 0;
    }

    let lastError: Error | null = null;

    // Retry logic with exponential backoff for rate limiting
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(
          `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd`,
          {
            headers: {
              Accept: "application/json",
            },
          },
        );

        // Handle rate limiting (429) with retry
        if (response.status === 429) {
          if (attempt < MAX_RETRIES) {
            const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
            console.warn(
              `CoinGecko API rate limited (429) for ${args.coin}. Retrying in ${retryDelay}ms (attempt ${attempt + 1}/${MAX_RETRIES + 1})`,
            );
            await sleep(retryDelay);
            continue; // Retry
          } else {
            console.error(
              `CoinGecko API rate limited (429) for ${args.coin}. Max retries exceeded.`,
            );
            return 0;
          }
        }

        if (!response.ok) {
          console.error(`CoinGecko API failed: ${response.status} ${response.statusText}`);
          return 0;
        }

        const data = await response.json();
        return data[coinId]?.usd ?? 0;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < MAX_RETRIES) {
          const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          console.warn(
            `Error fetching price for ${args.coin} (attempt ${attempt + 1}/${MAX_RETRIES + 1}). Retrying in ${retryDelay}ms:`,
            lastError.message,
          );
          await sleep(retryDelay);
          continue;
        }
      }
    }

    // If we get here, all retries failed
    console.error(`Error fetching price for ${args.coin} after all retries:`, lastError);
    return 0;
  },
});

/**
 * Get prices for multiple coins (action - for use in mutations)
 * Includes retry logic with exponential backoff for rate limiting (429 errors)
 */
export const getCryptoPricesAction = action({
  args: {
    coins: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const coinIds = args.coins
      .map((coin) => COIN_ID_MAP[coin.toUpperCase()])
      .filter(Boolean)
      .join(",");

    if (!coinIds) {
      return {};
    }

    let lastError: Error | null = null;
    
    // Retry logic with exponential backoff for rate limiting
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(
          `${COINGECKO_API}/simple/price?ids=${coinIds}&vs_currencies=usd`,
          {
            headers: {
              Accept: "application/json",
            },
          },
        );

        // Handle rate limiting (429) with retry
        if (response.status === 429) {
          if (attempt < MAX_RETRIES) {
            const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
            console.warn(
              `CoinGecko API rate limited (429). Retrying in ${retryDelay}ms (attempt ${attempt + 1}/${MAX_RETRIES + 1})`,
            );
            await sleep(retryDelay);
            continue; // Retry
          } else {
            console.error(
              `CoinGecko API rate limited (429). Max retries exceeded. Consider upgrading to CoinGecko Pro API or reducing request frequency.`,
            );
            return {}; // Return empty after max retries
          }
        }

        if (!response.ok) {
          console.error(`CoinGecko API failed: ${response.status} ${response.statusText}`);
          return {};
        }

        const data = await response.json();
        const prices: Record<string, number> = {};

        // Map CoinGecko IDs back to coin symbols (only for requested coins)
        for (const coin of args.coins) {
          const coinUpper = coin.toUpperCase();
          const coinId = COIN_ID_MAP[coinUpper];
          if (coinId && data[coinId]?.usd) {
            prices[coinUpper] = data[coinId].usd;
          }
        }

        return prices;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < MAX_RETRIES) {
          const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          console.warn(
            `Error fetching crypto prices (attempt ${attempt + 1}/${MAX_RETRIES + 1}). Retrying in ${retryDelay}ms:`,
            lastError.message,
          );
          await sleep(retryDelay);
          continue;
        }
      }
    }

    // If we get here, all retries failed
    console.error("Error fetching crypto prices after all retries:", lastError);
    return {};
  },
});


