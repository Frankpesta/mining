import { ConvexError, v } from "convex/values";

import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { resolveEarningTierForPlan } from "./earningTiers";
import {
  approximateMiningBalanceUsd,
  deductUsdFromMiningBalance,
} from "./miningBalanceUsd";
import {
  deductUsdLikeFromPlatformBalance,
  totalUsdLikePlatformBalance,
} from "./platformBalanceUsd";
import { fetchLivePricesWithFallback } from "./priceFeed";

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

/**
 * Internal query to list all plans (for internal use)
 */
export const listAllPlansInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    const plans = await ctx.db.query("plans").collect();
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
    duration: v.number(), // Duration in days
    minPriceUSD: v.number(),
    maxPriceUSD: v.optional(v.number()),
    priceUSD: v.number(), // Default/display price
    supportedCoins: v.array(v.string()),
    dailyRoiPercent: v.number(),
    renewalType: v.union(v.literal("manual"), v.literal("auto")),
    minDailyROI: v.optional(v.number()),
    maxDailyROI: v.optional(v.number()),
    estimatedDailyEarning: v.optional(v.number()),
    earningTier: v.optional(
      v.union(v.literal("low"), v.literal("mid"), v.literal("high")),
    ),
    isActive: v.boolean(),
    features: v.array(v.string()),
    idealFor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingPlans = await ctx.db.query("plans").collect();
    const maxOrder = existingPlans.reduce(
      (max, plan) => Math.max(max, plan.order),
      -1,
    );
    const now = Date.now();

    const { earningTier, estimatedDailyEarning, ...rest } = args;

    return ctx.db.insert("plans", {
      ...rest,
      estimatedDailyEarning: estimatedDailyEarning ?? 0,
      ...(earningTier !== undefined ? { earningTier } : {}),
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
    minPriceUSD: v.optional(v.number()),
    maxPriceUSD: v.optional(v.number()),
    priceUSD: v.optional(v.number()),
    supportedCoins: v.optional(v.array(v.string())),
    dailyRoiPercent: v.optional(v.number()),
    renewalType: v.optional(v.union(v.literal("manual"), v.literal("auto"))),
    minDailyROI: v.optional(v.number()),
    maxDailyROI: v.optional(v.number()),
    estimatedDailyEarning: v.optional(v.number()),
    earningTier: v.optional(
      v.union(v.literal("low"), v.literal("mid"), v.literal("high")),
    ),
    clearEarningTier: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    features: v.optional(v.array(v.string())),
    idealFor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { planId, clearEarningTier, earningTier, ...updates } = args;
    const plan = await ctx.db.get(planId);
    if (!plan) {
      throw new ConvexError("Plan not found");
    }

    const patch: Record<string, unknown> = {
      ...updates,
      updatedAt: Date.now(),
    };
    if (clearEarningTier) {
      patch.earningTier = undefined;
    } else if (earningTier !== undefined) {
      patch.earningTier = earningTier;
    }

    await ctx.db.patch(planId, patch as Partial<typeof plan>);

    if (args.dailyRoiPercent !== undefined && args.dailyRoiPercent > 0) {
      const activeOperations = await ctx.db
        .query("miningOperations")
        .withIndex("by_status", (q) => q.eq("status", "active"))
        .collect();

      await Promise.all(
        activeOperations
          .filter((operation) => operation.planId === planId)
          .map((operation) =>
            ctx.db.patch(operation._id, {
              currentRate: args.dailyRoiPercent,
              dailyReturnUSD: undefined,
              dailyEarningTier: undefined,
            }),
          ),
      );
    }
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

/**
 * Public entry point for purchasing/reinvesting into a plan. This is an
 * action (not a mutation) so it can fetch live BTC/ETH prices before
 * delegating to purchasePlanInternal — mutations can't make network calls.
 * The actual balance check-and-deduct still happens atomically inside the
 * internal mutation, so a price briefly going stale between the fetch here
 * and the mutation running can't cause a double-spend, only (at most) a
 * slightly-stale valuation for that one purchase.
 */
export const purchasePlan = action({
  args: {
    userId: v.id("users"),
    planId: v.id("plans"),
    coin: v.string(),
    fundingSource: v.optional(v.union(v.literal("platform"), v.literal("mining"))),
    commitAmountUsd: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<Id<"miningOperations">> => {
    const { prices } = await fetchLivePricesWithFallback();
    return ctx.runMutation(internal.plans.purchasePlanInternal, {
      ...args,
      prices,
    });
  },
});

export const purchasePlanInternal = internalMutation({
  args: {
    userId: v.id("users"),
    planId: v.id("plans"),
    coin: v.string(),
    /** Platform (deposit) wallet vs mined earnings — user chooses; default platform. */
    fundingSource: v.optional(v.union(v.literal("platform"), v.literal("mining"))),
    /** USD principal to commit (must be within plan min/max and wallet). If omitted, uses full wallet up to max. */
    commitAmountUsd: v.optional(v.number()),
    /** Live BTC/ETH prices fetched by the purchasePlan action; falls back to STATIC_USD_PER_CRYPTO for any coin not present. */
    prices: v.optional(v.record(v.string(), v.number())),
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

    // Only BTC and ETH can be mined
    if (args.coin !== "BTC" && args.coin !== "ETH") {
      throw new ConvexError(`Only BTC and ETH can be mined. Received: ${args.coin}`);
    }

    if (!plan.supportedCoins.includes(args.coin)) {
      throw new ConvexError(`Coin ${args.coin} is not supported by this plan`);
    }

    const fundingSource = args.fundingSource ?? "platform";
    const totalPlatformUsd = totalUsdLikePlatformBalance(user, args.prices);
    const totalMiningUsd = approximateMiningBalanceUsd(user, args.prices);
    const totalBalance =
      fundingSource === "mining" ? totalMiningUsd : totalPlatformUsd;

    // Use minPriceUSD as minimum, or priceUSD if minPriceUSD doesn't exist (backward compatibility)
    const minPrice = plan.minPriceUSD ?? plan.priceUSD;
    if (totalBalance < minPrice) {
      const label =
        fundingSource === "mining" ? "mined balance" : "platform balance";
      throw new ConvexError(
        `Insufficient ${label}. Minimum required: $${minPrice.toFixed(2)}`,
      );
    }

    const maxCap =
      plan.maxPriceUSD !== undefined
        ? Math.min(totalBalance, plan.maxPriceUSD)
        : totalBalance;

    let purchaseAmount: number;
    if (args.commitAmountUsd !== undefined) {
      purchaseAmount = args.commitAmountUsd;
      if (!Number.isFinite(purchaseAmount) || purchaseAmount <= 0) {
        throw new ConvexError("Enter a valid commitment amount in USD.");
      }
      if (purchaseAmount < minPrice - 1e-6) {
        throw new ConvexError(
          `Minimum commitment is $${minPrice.toFixed(2)} for this plan.`,
        );
      }
      if (plan.maxPriceUSD !== undefined && purchaseAmount > plan.maxPriceUSD + 1e-6) {
        throw new ConvexError(
          `Maximum commitment for this plan is $${plan.maxPriceUSD.toFixed(2)}.`,
        );
      }
      if (purchaseAmount > totalBalance + 1e-6) {
        throw new ConvexError(
          "That amount exceeds your available balance for the selected wallet.",
        );
      }
    } else {
      purchaseAmount = maxCap;
    }

    const now = Date.now();
    const endTime = now + plan.duration * 24 * 60 * 60 * 1000;

    const activePlans = await ctx.db
      .query("plans")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    let dailyEarningTier: "low" | "mid" | "high" | undefined;
    let currentRate: number;

    if (plan.dailyRoiPercent !== undefined && plan.dailyRoiPercent > 0) {
      currentRate = plan.dailyRoiPercent;
    } else {
      dailyEarningTier = resolveEarningTierForPlan(plan, activePlans);
      currentRate =
        plan.minDailyROI !== undefined && plan.maxDailyROI !== undefined
          ? plan.minDailyROI + Math.random() * (plan.maxDailyROI - plan.minDailyROI)
          : purchaseAmount > 0
            ? ((plan.estimatedDailyEarning ?? 0) / purchaseAmount) * 100
            : 0;
    }

    const operationId = await ctx.db.insert("miningOperations", {
      userId: args.userId,
      planId: args.planId,
      coin: args.coin,
      hashRate: plan.hashRate,
      hashRateUnit: plan.hashRateUnit,
      purchaseAmount,
      startTime: now,
      endTime,
      totalMined: 0,
      currentRate,
      ...(dailyEarningTier !== undefined ? { dailyEarningTier } : {}),
      lastPayoutDate: undefined, // Will be set on first payout
      status: "active",
      pausedBy: undefined,
      createdAt: now,
    });

    if (fundingSource === "mining") {
      await deductUsdFromMiningBalance(ctx, user, purchaseAmount, args.prices);
    } else {
      await deductUsdLikeFromPlatformBalance(ctx, user, purchaseAmount, args.prices);
    }

    await ctx.db.insert("auditLogs", {
      actorId: args.userId,
      action: "plan:purchase",
      entity: "miningOperation",
      entityId: operationId,
      metadata: {
        planId: args.planId,
        planName: plan.name,
        coin: args.coin,
        purchaseAmount,
        priceUSD: plan.priceUSD,
        fundingSource,
        commitAmountUsd: args.commitAmountUsd,
      },
      createdAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.emails.sendPlanPurchasedEmail, {
      operationId,
      fundingSource,
    });

    return operationId;
  },
});

