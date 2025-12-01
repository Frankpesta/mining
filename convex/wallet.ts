import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get platform balance for a user
 * USD calculation is now done on the frontend using /api/crypto-prices
 */
export const getPlatformBalance = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    return user.platformBalance;
  },
});

/**
 * Get mining balance for a user
 * USD calculation is now done on the frontend using /api/crypto-prices
 */
export const getMiningBalance = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }
    return user.miningBalance;
  },
});

