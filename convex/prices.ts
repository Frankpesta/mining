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

    try {
      const response = await fetch(
        `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        console.error(`CoinGecko API failed: ${response.status}`);
        return 0;
      }

      const data = await response.json();
      return data[coinId]?.usd ?? 0;
    } catch (error) {
      console.error("Error fetching crypto price:", error);
      return 0;
    }
  },
});

/**
 * Get prices for multiple coins (action - for use in mutations)
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

    try {
      const response = await fetch(
        `${COINGECKO_API}/simple/price?ids=${coinIds}&vs_currencies=usd`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) {
        console.error(`CoinGecko API failed: ${response.status}`);
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
      console.error("Error fetching crypto prices:", error);
      return {};
    }
  },
});


