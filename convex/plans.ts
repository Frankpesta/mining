import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const listPlans = query({
  args: {
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const plans = args.activeOnly
      ? await ctx.db
          .query("plans")
          .withIndex("by_active", (q) => q.eq("isActive", true))
          .collect()
      : await ctx.db.query("plans").collect();

    return plans.sort((a, b) => a.order - b.order);
  },
});

export const getPlanById = query({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.planId);
  },
});

export const createPlan = mutation({
  args: {
    name: v.string(),
    hashRate: v.number(),
    hashRateUnit: v.union(v.literal("TH/s"), v.literal("GH/s"), v.literal("MH/s")),
    duration: v.number(),
    priceUSD: v.number(),
    supportedCoins: v.array(v.string()),
    estimatedDailyEarning: v.number(),
    isActive: v.boolean(),
    features: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const existingPlans = await ctx.db.query("plans").collect();
    const maxOrder = existingPlans.reduce(
      (max, plan) => Math.max(max, plan.order),
      -1,
    );
    const now = Date.now();

    return ctx.db.insert("plans", {
      ...args,
      createdAt: now,
      updatedAt: now,
      order: maxOrder + 1,
    });
  },
});

export const updatePlan = mutation({
  args: {
    planId: v.id("plans"),
    name: v.optional(v.string()),
    hashRate: v.optional(v.number()),
    hashRateUnit: v.optional(v.union(v.literal("TH/s"), v.literal("GH/s"), v.literal("MH/s"))),
    duration: v.optional(v.number()),
    priceUSD: v.optional(v.number()),
    supportedCoins: v.optional(v.array(v.string())),
    estimatedDailyEarning: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
    features: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { planId, ...updates } = args;
    const plan = await ctx.db.get(planId);
    if (!plan) {
      throw new ConvexError("Plan not found");
    }

    await ctx.db.patch(planId, {
      ...updates,
      updatedAt: Date.now(),
    });
  },
});

export const deletePlan = mutation({
  args: { planId: v.id("plans") },
  handler: async (ctx, args) => {
    const plan = await ctx.db.get(args.planId);
    if (!plan) {
      throw new ConvexError("Plan not found");
    }

    const activeOperations = await ctx.db
      .query("miningOperations")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    const hasActiveOperations = activeOperations.some(
      (op) => op.planId === args.planId,
    );

    if (hasActiveOperations) {
      throw new ConvexError("Cannot delete plan with active mining operations");
    }

    await ctx.db.delete(args.planId);
  },
});

export const reorderPlans = mutation({
  args: {
    planOrders: v.array(
      v.object({
        planId: v.id("plans"),
        order: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.planOrders.map(({ planId, order }) =>
        ctx.db.patch(planId, {
          order,
          updatedAt: Date.now(),
        }),
      ),
    );
  },
});

export const purchasePlan = mutation({
  args: {
    userId: v.id("users"),
    planId: v.id("plans"),
    coin: v.string(),
  },
  handler: async (ctx, args) => {
    const [user, plan] = await Promise.all([
      ctx.db.get(args.userId),
      ctx.db.get(args.planId),
    ]);

    if (!user) {
      throw new ConvexError("User not found");
    }

    if (!plan) {
      throw new ConvexError("Plan not found");
    }

    if (!plan.isActive) {
      throw new ConvexError("Plan is not active");
    }

    if (!plan.supportedCoins.includes(args.coin)) {
      throw new ConvexError(`Coin ${args.coin} is not supported by this plan`);
    }

    const totalBalance =
      user.platformBalance.ETH + user.platformBalance.USDT + user.platformBalance.USDC;

    if (totalBalance < plan.priceUSD) {
      throw new ConvexError("Insufficient platform balance");
    }

    const now = Date.now();
    const endTime = now + plan.duration * 24 * 60 * 60 * 1000;

    const operationId = await ctx.db.insert("miningOperations", {
      userId: args.userId,
      planId: args.planId,
      coin: args.coin,
      hashRate: plan.hashRate,
      hashRateUnit: plan.hashRateUnit,
      startTime: now,
      endTime,
      totalMined: 0,
      currentRate: plan.estimatedDailyEarning,
      status: "active",
      pausedBy: undefined,
      createdAt: now,
    });

    let remainingCost = plan.priceUSD;
    const balanceUpdates: Partial<typeof user.platformBalance> = {};

    if (user.platformBalance.USDC >= remainingCost) {
      balanceUpdates.USDC = user.platformBalance.USDC - remainingCost;
      remainingCost = 0;
    } else {
      balanceUpdates.USDC = 0;
      remainingCost -= user.platformBalance.USDC;
    }

    if (remainingCost > 0 && user.platformBalance.USDT >= remainingCost) {
      balanceUpdates.USDT = user.platformBalance.USDT - remainingCost;
      remainingCost = 0;
    } else if (remainingCost > 0) {
      balanceUpdates.USDT = 0;
      remainingCost -= user.platformBalance.USDT;
    }

    if (remainingCost > 0 && user.platformBalance.ETH >= remainingCost) {
      balanceUpdates.ETH = user.platformBalance.ETH - remainingCost;
    } else if (remainingCost > 0) {
      throw new ConvexError("Insufficient platform balance");
    }

    await ctx.db.patch(args.userId, {
      platformBalance: {
        ETH: balanceUpdates.ETH ?? user.platformBalance.ETH,
        USDT: balanceUpdates.USDT ?? user.platformBalance.USDT,
        USDC: balanceUpdates.USDC ?? user.platformBalance.USDC,
      },
    });

    await ctx.db.insert("auditLogs", {
      actorId: args.userId,
      action: "plan:purchase",
      entity: "miningOperation",
      entityId: operationId,
      metadata: {
        planId: args.planId,
        planName: plan.name,
        coin: args.coin,
        priceUSD: plan.priceUSD,
      },
      createdAt: now,
    });

    return operationId;
  },
});

