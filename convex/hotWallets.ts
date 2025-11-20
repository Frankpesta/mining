import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";

export const listHotWallets = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("hotWallets").collect();
  },
});

export const getHotWalletByCrypto = query({
  args: {
    crypto: v.union(
      v.literal("BTC"),
      v.literal("ETH"),
      v.literal("SOL"),
      v.literal("LTC"),
      v.literal("BNB"),
      v.literal("ADA"),
      v.literal("XRP"),
      v.literal("DOGE"),
      v.literal("DOT"),
      v.literal("MATIC"),
      v.literal("AVAX"),
      v.literal("ATOM"),
      v.literal("LINK"),
      v.literal("UNI"),
      v.literal("USDT"),
      v.literal("USDC"),
    ),
  },
  handler: async (ctx, args) => {
    const wallet = await ctx.db
      .query("hotWallets")
      .withIndex("by_crypto", (q) => q.eq("crypto", args.crypto))
      .first();
    if (!wallet) {
      throw new ConvexError(`No hot wallet configured for ${args.crypto}`);
    }
    return wallet;
  },
});

export const upsertHotWallet = mutation({
  args: {
    crypto: v.union(
      v.literal("BTC"),
      v.literal("ETH"),
      v.literal("SOL"),
      v.literal("LTC"),
      v.literal("BNB"),
      v.literal("ADA"),
      v.literal("XRP"),
      v.literal("DOGE"),
      v.literal("DOT"),
      v.literal("MATIC"),
      v.literal("AVAX"),
      v.literal("ATOM"),
      v.literal("LINK"),
      v.literal("UNI"),
      v.literal("USDT"),
      v.literal("USDC"),
    ),
    address: v.string(),
    label: v.optional(v.string()),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new ConvexError("Only administrators can update hot wallets");
    }

    const existing = await ctx.db
      .query("hotWallets")
      .withIndex("by_crypto", (q) => q.eq("crypto", args.crypto))
      .first();

    const payload = {
      crypto: args.crypto,
      address: args.address,
      label: args.label,
      updatedAt: Date.now(),
      updatedBy: args.adminId,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return ctx.db.insert("hotWallets", payload);
  },
});

export const deleteHotWallet = mutation({
  args: {
    walletId: v.id("hotWallets"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new ConvexError("Only administrators can delete hot wallets");
    }

    await ctx.db.delete(args.walletId);
  },
});

