import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

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
    const balanceDelta = args.totalMined - operation.totalMined;

    if (coin === "BTC" || coin === "ETH" || coin === "LTC") {
      await ctx.db.patch(operation.userId, {
        miningBalance: {
          ...user.miningBalance,
          [coin]: (user.miningBalance[coin as keyof typeof user.miningBalance] ?? 0) + balanceDelta,
        },
      });
    } else {
      await ctx.db.patch(operation.userId, {
        miningBalance: {
          ...user.miningBalance,
          others: {
            ...user.miningBalance.others,
            [coin]: (user.miningBalance.others?.[coin] ?? 0) + balanceDelta,
          },
        },
      });
    }
  },
});

