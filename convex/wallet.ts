import { query, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

/**
 * Calculate total USD value of platform balance
 * Uses action since we need to fetch prices
 */
export const calculatePlatformBalanceUSD = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.getUserById, { userId: args.userId });
    if (!user) {
      return 0;
    }

    // Get all coins in platform balance
    const platformBalance = user.platformBalance as any;
    const coins: string[] = [];
    
    // Collect all coin symbols from platform balance
    for (const key in platformBalance) {
      if (key !== "others" && typeof platformBalance[key] === "number" && platformBalance[key] > 0) {
        coins.push(key);
      }
    }
    
    if (coins.length === 0) {
      return 0;
    }

    // Get prices for all coins (using action since queries can't fetch)
    const prices = await ctx.runAction(api.prices.getCryptoPricesAction, { coins });
    
    // Calculate total USD value
    let totalUSD = 0;
    for (const coin of coins) {
      const amount = platformBalance[coin] ?? 0;
      const price = prices[coin.toUpperCase()] ?? 0;
      
      // For stablecoins, use 1:1 conversion
      if (coin === "USDT" || coin === "USDC") {
        totalUSD += amount;
      } else {
        totalUSD += amount * price;
      }
    }
    
    return totalUSD;
  },
});

/**
 * Calculate total USD value of mining balance
 * Uses action since we need to fetch prices
 */
export const calculateMiningBalanceUSD = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.users.getUserById, { userId: args.userId });
    if (!user) {
      return 0;
    }

    // Get all coins in mining balance
    const miningBalance = user.miningBalance as any;
    const coins: string[] = [];
    
    // Collect all coin symbols from mining balance
    for (const key in miningBalance) {
      if (key !== "others" && typeof miningBalance[key] === "number" && miningBalance[key] > 0) {
        coins.push(key);
      }
    }
    
    // Also check others object
    if (miningBalance.others) {
      for (const coin in miningBalance.others) {
        if (!coins.includes(coin)) {
          coins.push(coin);
        }
      }
    }
    
    if (coins.length === 0) {
      return 0;
    }

    // Get prices for all coins (using action since queries can't fetch)
    const prices = await ctx.runAction(api.prices.getCryptoPricesAction, { coins });
    
    // Calculate total USD value
    let totalUSD = 0;
    for (const coin of coins) {
      let amount = 0;
      if (coin === "BTC" || coin === "ETH" || coin === "LTC") {
        amount = miningBalance[coin] ?? 0;
      } else {
        amount = miningBalance[coin] ?? miningBalance.others?.[coin] ?? 0;
      }
      
      const price = prices[coin.toUpperCase()] ?? 0;
      totalUSD += amount * price;
    }
    
    return totalUSD;
  },
});

