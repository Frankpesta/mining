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
 * DEPRECATED: CoinGecko API calls have been moved to frontend (/api/crypto-prices)
 * These functions are kept for backward compatibility but will return empty/zero values.
 * Use the frontend API route instead: GET /api/crypto-prices?coins=BTC,ETH,USDT
 * 
 * @deprecated Use /api/crypto-prices instead
 */
export const getCoinPriceAction = action({
  args: {
    coin: v.string(),
  },
  handler: async (ctx, args) => {
    console.warn(
      `[DEPRECATED] getCoinPriceAction is deprecated. Use /api/crypto-prices instead.`
    );
    return 0;
  },
});

/**
 * DEPRECATED: CoinGecko API calls have been moved to frontend (/api/crypto-prices)
 * This function is kept for backward compatibility but will return empty values.
 * Use the frontend API route instead: GET /api/crypto-prices?coins=BTC,ETH,USDT
 * 
 * @deprecated Use /api/crypto-prices instead
 */
export const getCryptoPricesAction = action({
  args: {
    coins: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    console.warn(
      `[DEPRECATED] getCryptoPricesAction is deprecated. Use /api/crypto-prices instead.`
    );
    return {};
  },
});


