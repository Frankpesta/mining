import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

export const listUserMiningOperations = query({
  args: {
    userId: v.id("users"),
    status: v.optional(v.union(v.literal("active"), v.literal("completed"), v.literal("paused"))),
  },
  handler: async (ctx, args) => {
    const operations = await ctx.db
      .query("miningOperations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    if (args.status) {
      return operations.filter((op) => op.status === args.status);
    }

    return operations.sort((a, b) => b.createdAt - a.createdAt);
  },
});

export const listAllMiningOperations = query({
  args: {
    status: v.optional(v.union(v.literal("active"), v.literal("completed"), v.literal("paused"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    let operations = await ctx.db.query("miningOperations").collect();

    if (args.status) {
      operations = operations.filter((op) => op.status === args.status);
    }

    return operations
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

export const getMiningOperationById = query({
  args: { operationId: v.id("miningOperations") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.operationId);
  },
});

export const pauseMiningOperation = mutation({
  args: {
    operationId: v.id("miningOperations"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const [admin, operation] = await Promise.all([
      ctx.db.get(args.adminId),
      ctx.db.get(args.operationId),
    ]);

    if (!admin || admin.role !== "admin") {
      throw new ConvexError("Only administrators can pause operations");
    }

    if (!operation) {
      throw new ConvexError("Mining operation not found");
    }

    if (operation.status !== "active") {
      throw new ConvexError("Only active operations can be paused");
    }

    await ctx.db.patch(args.operationId, {
      status: "paused",
      pausedBy: args.adminId,
    });

    await ctx.db.insert("auditLogs", {
      actorId: args.adminId,
      action: "mining:pause",
      entity: "miningOperation",
      entityId: args.operationId,
      metadata: {
        userId: operation.userId,
      },
      createdAt: Date.now(),
    });
  },
});

export const resumeMiningOperation = mutation({
  args: {
    operationId: v.id("miningOperations"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const [admin, operation] = await Promise.all([
      ctx.db.get(args.adminId),
      ctx.db.get(args.operationId),
    ]);

    if (!admin || admin.role !== "admin") {
      throw new ConvexError("Only administrators can resume operations");
    }

    if (!operation) {
      throw new ConvexError("Mining operation not found");
    }

    if (operation.status !== "paused") {
      throw new ConvexError("Only paused operations can be resumed");
    }

    await ctx.db.patch(args.operationId, {
      status: "active",
      pausedBy: undefined,
    });

    await ctx.db.insert("auditLogs", {
      actorId: args.adminId,
      action: "mining:resume",
      entity: "miningOperation",
      entityId: args.operationId,
      metadata: {
        userId: operation.userId,
      },
      createdAt: Date.now(),
    });
  },
});

export const updateMiningOperationEarnings = mutation({
  args: {
    operationId: v.id("miningOperations"),
    totalMined: v.number(),
    currentRate: v.number(),
    coinPrice: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const operation = await ctx.db.get(args.operationId);
    if (!operation) {
      throw new ConvexError("Mining operation not found");
    }

    if (operation.status !== "active") {
      return;
    }

    await ctx.db.patch(args.operationId, {
      totalMined: args.totalMined,
      currentRate: args.currentRate,
    });

    const user = await ctx.db.get(operation.userId);
    if (!user) {
      return;
    }

    const coin = operation.coin;
    const balanceDeltaCoin = args.totalMined - operation.totalMined;

    if (balanceDeltaCoin > 0) {
      // Use provided coin price or default to 1 (for stablecoins or when price not available)
      const coinPrice = args.coinPrice ?? 1;

      // Mining earnings are paid out to platform balance for withdrawal
      // Update platform balance with the coin being mined
      // For stablecoins (USDT, USDC), use 1:1 conversion
      if (coin === "USDT" || coin === "USDC") {
        const balanceDeltaUSD = balanceDeltaCoin * coinPrice;
        await ctx.db.patch(operation.userId, {
          platformBalance: {
            ...user.platformBalance,
            [coin]: (user.platformBalance[coin as "USDT" | "USDC"] ?? 0) + balanceDeltaUSD,
          },
        });
      } else {
        // For other coins, add to platform balance
        const currentBalance = (user.platformBalance as any)[coin] ?? 0;
        await ctx.db.patch(operation.userId, {
          platformBalance: {
            ...user.platformBalance,
            [coin]: currentBalance + balanceDeltaCoin,
          } as any,
        });
      }

      // Also update mining balance for tracking purposes
      if (coin === "BTC" || coin === "ETH" || coin === "LTC") {
        const coreCoin = coin as "BTC" | "ETH" | "LTC";
        await ctx.db.patch(operation.userId, {
          miningBalance: {
            ...user.miningBalance,
            [coreCoin]: (user.miningBalance[coreCoin] ?? 0) + balanceDeltaCoin,
          },
        });
      } else {
        const currentMining = (user.miningBalance as any)[coin] ?? 0;
        await ctx.db.patch(operation.userId, {
          miningBalance: {
            ...user.miningBalance,
            [coin]: currentMining + balanceDeltaCoin,
          } as any,
        });
      }
    }
  },
});

