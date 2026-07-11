import { ConvexError, v } from "convex/values";

import { mutation, query, action, internalMutation, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id, Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { selectLeastQualifyingPlanForDeposit } from "./planSelection";
import { resolveEarningTierForPlan } from "./earningTiers";
import { deductUsdLikeFromPlatformBalance } from "./platformBalanceUsd";
import { totalUsdLikePlatformBalance } from "../lib/crypto-static-usd";
import { fetchLivePricesWithFallback, FALLBACK_PRICES } from "./priceFeed";

type Crypto = "ETH" | "BTC" | "USDT" | "USDC";

export const createDepositRequest = mutation({
  args: {
    userId: v.id("users"),
    crypto: v.union(v.literal("ETH"), v.literal("BTC"), v.literal("USDT"), v.literal("USDC")),
    amount: v.number(),
    txHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) {
      throw new ConvexError("Deposit amount must be greater than zero");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    const hotWallet = await ctx.db
      .query("hotWallets")
      .withIndex("by_crypto", (q) => q.eq("crypto", args.crypto))
      .first();

    if (!hotWallet) {
      throw new ConvexError(`No deposit wallet configured for ${args.crypto}`);
    }

    const depositId = await ctx.db.insert("deposits", {
      userId: args.userId,
      crypto: args.crypto,
      amount: args.amount,
      txHash: args.txHash,
      walletAddress: hotWallet.address,
      status: "pending",
      adminNote: undefined,
      approvedBy: undefined,
      createdAt: Date.now(),
      approvedAt: undefined,
    });

    await ctx.scheduler.runAfter(0, internal.emails.sendDepositSubmittedEmail, {
      depositId,
    });

    return depositId;
  },
});

export const listUserDeposits = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return ctx.db
      .query("deposits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

export const listAdminDeposits = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const deposits = await ctx.db
      .query("deposits")
      .order("desc")
      .take(limit);

    const filtered = args.status
      ? deposits.filter((deposit) => deposit.status === args.status)
      : deposits;

    return withUserEmail(ctx, filtered);
  },
});

/**
 * Internal mutation to update deposit status (called by action)
 */
export const updateDepositStatusInternal = internalMutation({
  args: {
    depositId: v.id("deposits"),
    adminId: v.id("users"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    adminNote: v.optional(v.string()),
    txHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const deposit = await ctx.db.get(args.depositId);
    if (!deposit) {
      throw new ConvexError("Deposit not found");
    }

    const user = await ctx.db.get(deposit.userId);
    if (!user) {
      throw new ConvexError("Associated user not found");
    }

    if (args.status === "approved") {
      if (deposit.crypto === "BTC") {
        // Handle BTC deposit
        await ctx.db.patch(user._id, {
          platformBalance: {
            ...user.platformBalance,
            BTC: (user.platformBalance.BTC ?? 0) + (deposit.amount ?? 0),
          },
        });
      } else if (deposit.crypto === "ETH") {
        // Handle ETH deposit
        await ctx.db.patch(user._id, {
          platformBalance: {
            ...user.platformBalance,
            ETH: user.platformBalance.ETH + (deposit.amount ?? 0),
          },
        });
      } else if (deposit.crypto === "USDT") {
        // Handle USDT deposit
        await ctx.db.patch(user._id, {
          platformBalance: {
            ...user.platformBalance,
            USDT: user.platformBalance.USDT + (deposit.amount ?? 0),
          },
        });
      } else if (deposit.crypto === "USDC") {
        // Handle USDC deposit
        await ctx.db.patch(user._id, {
          platformBalance: {
            ...user.platformBalance,
            USDC: user.platformBalance.USDC + (deposit.amount ?? 0),
          },
        });
      }
    }

    await ctx.db.patch(args.depositId, {
      status: args.status,
      adminNote: args.adminNote,
      approvedBy: args.adminId,
      approvedAt: args.status === "approved" ? Date.now() : undefined,
      txHash: args.txHash ?? deposit.txHash,
    });

    await ctx.db.insert("auditLogs", {
      actorId: args.adminId,
      action: "deposit:update",
      entity: "deposit",
      entityId: args.depositId,
      metadata: {
        newStatus: args.status,
        amount: deposit.amount,
        crypto: deposit.crypto,
        userId: deposit.userId,
      },
      createdAt: Date.now(),
    });
  },
});

/**
 * Action to update deposit status. If approved, credits the platform wallet.
 * Auto-starts a mining contract only when the deposit qualifies for a plan with
 * `renewalType: "auto"` (e.g. Gold). Manual-renewal plans (e.g. Micro) stay on-platform for manual purchase.
 */
export const updateDepositStatus = action({
  args: {
    depositId: v.id("deposits"),
    adminId: v.id("users"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    adminNote: v.optional(v.string()),
    txHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const [admin, deposit] = await Promise.all([
      ctx.runQuery(internal.deposits.getUserById, { userId: args.adminId }),
      ctx.runQuery(internal.deposits.getDepositById, { depositId: args.depositId }),
    ]);

    if (!admin || admin.role !== "admin") {
      throw new ConvexError("Only administrators can update deposits");
    }

    if (!deposit) {
      throw new ConvexError("Deposit not found");
    }

    if (deposit.status !== "pending") {
      throw new ConvexError("Deposit has already been processed");
    }

    // Update deposit status
    await ctx.runMutation(internal.deposits.updateDepositStatusInternal, {
      depositId: args.depositId,
      adminId: args.adminId,
      status: args.status,
      adminNote: args.adminNote,
      txHash: args.txHash,
    });

    // If approved, automatically start mining operation
    if (args.status === "approved") {
      await ctx.runAction(internal.deposits.startMiningFromDeposit, {
        depositId: args.depositId,
        userId: deposit.userId,
        crypto: deposit.crypto,
        amount: deposit.amount,
      });
    }

    await ctx.runAction(internal.emails.sendDepositProcessedEmail, {
      depositId: args.depositId,
      status: args.status,
      adminNote: args.adminNote,
    });
  },
});

/**
 * Helper query to get user by ID (for internal use)
 */
export const getUserById = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.userId);
  },
});

/**
 * Helper query to get deposit by ID (for internal use)
 */
export const getDepositById = internalQuery({
  args: { depositId: v.id("deposits") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.depositId);
  },
});

/**
 * Internal action to start mining operation from approved deposit
 */
export const startMiningFromDeposit = internalAction({
  args: {
    depositId: v.id("deposits"),
    userId: v.id("users"),
    crypto: v.union(v.literal("ETH"), v.literal("BTC"), v.literal("USDT"), v.literal("USDC")),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    // One shared live-price fetch (Binance -> Coinbase -> CoinGecko, falling
    // back to hardcoded prices) covers both the deposit-amount conversion
    // below and the balance check further down - previously these were two
    // separate, weaker CoinGecko-only fetches.
    const { prices } = await fetchLivePricesWithFallback();
    const btcPriceUSD = prices["BTC"] ?? FALLBACK_PRICES.BTC;
    const ethPriceUSD = prices["ETH"] ?? FALLBACK_PRICES.ETH;

    // Convert deposit amount to USD
    let depositAmountUSD: number;

    if (args.crypto === "ETH") {
      depositAmountUSD = args.amount * ethPriceUSD;
    } else if (args.crypto === "BTC") {
      depositAmountUSD = args.amount * btcPriceUSD;
    } else if (args.crypto === "USDT" || args.crypto === "USDC") {
      // For stablecoins (USDT, USDC), use 1:1 conversion to USD
      depositAmountUSD = args.amount;
    } else {
      throw new ConvexError(`Unsupported deposit crypto: ${String(args.crypto)}`);
    }

    // Find matching plan based on deposit amount
    const plans = await ctx.runQuery(internal.plans.listAllPlansInternal);
    const activePlans = plans.filter((plan) => plan.isActive);

    const matchingPlan = selectLeastQualifyingPlanForDeposit(activePlans, depositAmountUSD);

    if (!matchingPlan) {
      console.warn(`No matching plan found for deposit amount $${depositAmountUSD}`);
      return;
    }

    if ((matchingPlan.renewalType ?? "manual") !== "auto") {
      console.log(
        `[startMiningFromDeposit] Deposit ~$${depositAmountUSD.toFixed(2)} maps to plan "${matchingPlan.name}" (manual). Funds remain on platform balance.`,
      );
      return;
    }

    // Determine which coin to mine - only BTC or ETH can be mined
    // Prefer the deposit crypto if it's BTC or ETH, otherwise default to BTC
    let miningCoin: string;
    if (args.crypto === "BTC" || args.crypto === "ETH") {
      // Only mine BTC or ETH
      miningCoin = args.crypto;
    } else {
      // For USDT/USDC deposits, default to BTC for mining
      // (USDT/USDC are stablecoins, so they don't need to be mined themselves)
      miningCoin = "BTC";
    }
    
    // Ensure the plan supports BTC or ETH (at least one must be supported)
    if (!matchingPlan.supportedCoins.includes("BTC") && !matchingPlan.supportedCoins.includes("ETH")) {
      console.warn(`Plan ${matchingPlan.name} does not support BTC or ETH, defaulting to BTC`);
      miningCoin = "BTC";
    } else if (!matchingPlan.supportedCoins.includes(miningCoin)) {
      // If the selected coin is not supported, use the other one
      miningCoin = matchingPlan.supportedCoins.includes("BTC") ? "BTC" : "ETH";
    }
    
    // Calculate purchase amount (same logic as purchasePlan)
    const user = await ctx.runQuery(internal.deposits.getUserById, { userId: args.userId });
    if (!user) {
      throw new ConvexError("User not found");
    }

    // Total balance in USD, using the live prices fetched above.
    const totalBalanceUSD = totalUsdLikePlatformBalance(user.platformBalance, {
      ETH: ethPriceUSD,
      BTC: btcPriceUSD,
    });

    // Use the deposit amount USD, but cap at plan's maxPriceUSD if set
    let purchaseAmount = depositAmountUSD;
    if (matchingPlan.maxPriceUSD !== undefined && purchaseAmount > matchingPlan.maxPriceUSD) {
      purchaseAmount = matchingPlan.maxPriceUSD;
    }
    
    // Ensure purchase amount doesn't exceed user's total balance in USD
    if (purchaseAmount > totalBalanceUSD) {
      purchaseAmount = totalBalanceUSD;
    }
    
    await ctx.runMutation(internal.deposits.createMiningOperationFromDeposit, {
      userId: args.userId,
      planId: matchingPlan._id,
      coin: miningCoin,
      purchaseAmount,
      depositId: args.depositId,
      btcPriceUSD,
      ethPriceUSD,
    });
  },
});

/**
 * Internal mutation to create mining operation from deposit
 */
export const createMiningOperationFromDeposit = internalMutation({
  args: {
    userId: v.id("users"),
    planId: v.id("plans"),
    coin: v.string(),
    purchaseAmount: v.number(),
    depositId: v.id("deposits"),
    btcPriceUSD: v.number(),
    ethPriceUSD: v.number(),
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
          : args.purchaseAmount > 0
            ? ((plan.estimatedDailyEarning ?? 0) / args.purchaseAmount) * 100
            : 0;
    }

    const operationId = await ctx.db.insert("miningOperations", {
      userId: args.userId,
      planId: args.planId,
      coin: args.coin,
      hashRate: plan.hashRate,
      hashRateUnit: plan.hashRateUnit,
      purchaseAmount: args.purchaseAmount,
      startTime: now,
      endTime,
      totalMined: 0,
      currentRate,
      ...(dailyEarningTier !== undefined ? { dailyEarningTier } : {}),
      lastPayoutDate: undefined,
      status: "active",
      pausedBy: undefined,
      createdAt: now,
    });

    const priceOverride = { ETH: args.ethPriceUSD, BTC: args.btcPriceUSD };
    const totalValueUSD = totalUsdLikePlatformBalance(user.platformBalance, priceOverride);

    if (totalValueUSD + 1e-9 < args.purchaseAmount) {
      throw new ConvexError("Insufficient platform balance");
    }

    await deductUsdLikeFromPlatformBalance(ctx, user, args.purchaseAmount, priceOverride);

    await ctx.db.insert("auditLogs", {
      actorId: args.userId,
      action: "plan:purchase:from_deposit",
      entity: "miningOperation",
      entityId: operationId,
      metadata: {
        planId: args.planId,
        planName: plan.name,
        coin: args.coin,
        purchaseAmount: args.purchaseAmount,
        depositId: args.depositId,
      },
      createdAt: now,
    });

    return operationId;
  },
});

async function withUserEmail(
  ctx: QueryCtx,
  deposits: Array<Doc<"deposits">>,
): Promise<Array<Doc<"deposits"> & { userEmail: string | null }>> {
  const uniqueUserIds = Array.from(new Set(deposits.map((deposit) => deposit.userId)));
  const users = await Promise.all(uniqueUserIds.map((userId) => ctx.db.get(userId)));
  const emailMap = new Map<Id<"users">, string>();

  users.forEach((user) => {
    if (user) {
      emailMap.set(user._id, user.email);
    }
  });

  return deposits.map((deposit) => ({
    ...deposit,
    userEmail: emailMap.get(deposit.userId) ?? null,
  }));
}

