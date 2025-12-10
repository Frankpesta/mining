import { ConvexError, v } from "convex/values";

import { mutation, query, action, internalMutation, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id, Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

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

    return ctx.db.insert("deposits", {
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
 * Action to update deposit status and automatically start mining operation if approved
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
    // Convert deposit amount to USD
    let depositAmountUSD: number;
    
    if (args.crypto === "ETH") {
      // Fetch ETH price
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
        );
        if (response.ok) {
          const data = await response.json();
          const ethPrice = data.ethereum?.usd ?? 0;
          if (ethPrice > 0) {
            depositAmountUSD = args.amount * ethPrice;
          } else {
            // Fallback: use approximate ETH price if API fails
            console.warn("Failed to fetch ETH price, using fallback price of $3000");
            depositAmountUSD = args.amount * 3000;
          }
        } else {
          // Fallback: use approximate ETH price if API fails
          console.warn("Failed to fetch ETH price, using fallback price of $3000");
          depositAmountUSD = args.amount * 3000;
        }
      } catch (error) {
        // Fallback: use approximate ETH price if API fails
        console.warn("Error fetching ETH price, using fallback price of $3000:", error);
        depositAmountUSD = args.amount * 3000;
      }
    } else if (args.crypto === "BTC") {
      // Fetch BTC price
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
        );
        if (response.ok) {
          const data = await response.json();
          const btcPrice = data.bitcoin?.usd ?? 0;
          if (btcPrice > 0) {
            depositAmountUSD = args.amount * btcPrice;
          } else {
            // Fallback: use approximate BTC price if API fails
            console.warn("Failed to fetch BTC price, using fallback price of $60000");
            depositAmountUSD = args.amount * 60000;
          }
        } else {
          // Fallback: use approximate BTC price if API fails
          console.warn("Failed to fetch BTC price, using fallback price of $60000");
          depositAmountUSD = args.amount * 60000;
        }
      } catch (error) {
        // Fallback: use approximate BTC price if API fails
        console.warn("Error fetching BTC price, using fallback price of $60000:", error);
        depositAmountUSD = args.amount * 60000;
      }
    } else if (args.crypto === "USDT" || args.crypto === "USDC") {
      // For stablecoins (USDT, USDC), use 1:1 conversion to USD
      depositAmountUSD = args.amount;
    } else {
      throw new ConvexError(`Unsupported deposit crypto: ${String(args.crypto)}`);
    }

    // Find matching plan based on deposit amount
    const plans = await ctx.runQuery(internal.plans.listAllPlansInternal);
    const activePlans = plans.filter((plan) => plan.isActive);
    
    // Sort plans by order (ascending)
    activePlans.sort((a, b) => a.order - b.order);
    
    // Find the first plan where deposit amount falls within minPriceUSD and maxPriceUSD
    let matchingPlan = null;
    for (const plan of activePlans) {
      const minPrice = plan.minPriceUSD ?? plan.priceUSD;
      const maxPrice = plan.maxPriceUSD ?? Infinity;
      
      if (depositAmountUSD >= minPrice && depositAmountUSD <= maxPrice) {
        matchingPlan = plan;
        break;
      }
    }
    
    // If no plan matches, use the highest tier plan (Elite Package) if deposit is above its minimum
    if (!matchingPlan && activePlans.length > 0) {
      const highestPlan = activePlans[activePlans.length - 1];
      const highestMinPrice = highestPlan.minPriceUSD ?? highestPlan.priceUSD;
      if (depositAmountUSD >= highestMinPrice) {
        matchingPlan = highestPlan;
      }
    }
    
    // If still no plan matches, use the lowest tier plan
    if (!matchingPlan && activePlans.length > 0) {
      matchingPlan = activePlans[0];
    }
    
    if (!matchingPlan) {
      console.warn(`No matching plan found for deposit amount $${depositAmountUSD}`);
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
    
    // Calculate total balance in USD
    // We need to convert BTC and ETH balances to USD for comparison with purchaseAmount
    // Fetch prices for BTC and ETH
    let btcPriceUSD = 60000; // Fallback price
    let ethPriceUSD = 3000; // Fallback price
    
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd"
      );
      if (response.ok) {
        const data = await response.json();
        btcPriceUSD = data.bitcoin?.usd ?? 60000;
        ethPriceUSD = data.ethereum?.usd ?? 3000;
      }
    } catch (error) {
      console.warn("Failed to fetch prices for balance calculation, using fallback prices");
    }
    
    const btcBalance = user.platformBalance.BTC ?? 0;
    const ethBalance = user.platformBalance.ETH ?? 0;
    const totalBalanceUSD = (btcBalance * btcPriceUSD) + (ethBalance * ethPriceUSD);
    
    // Use the deposit amount USD, but cap at plan's maxPriceUSD if set
    let purchaseAmount = depositAmountUSD;
    if (matchingPlan.maxPriceUSD !== undefined && purchaseAmount > matchingPlan.maxPriceUSD) {
      purchaseAmount = matchingPlan.maxPriceUSD;
    }
    
    // Ensure purchase amount doesn't exceed user's total balance in USD
    if (purchaseAmount > totalBalanceUSD) {
      purchaseAmount = totalBalanceUSD;
    }
    
    // Use the prices already fetched above for deduction calculation
    
    // Calculate how much BTC/ETH to deduct (in crypto units)
    const btcToDeduct = purchaseAmount / btcPriceUSD;
    const ethToDeduct = purchaseAmount / ethPriceUSD;
    
    // Create mining operation via internal mutation
    await ctx.runMutation(internal.deposits.createMiningOperationFromDeposit, {
      userId: args.userId,
      planId: matchingPlan._id,
      coin: miningCoin,
      purchaseAmount,
      depositId: args.depositId,
      btcToDeduct,
      ethToDeduct,
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
    btcToDeduct: v.number(),
    ethToDeduct: v.number(),
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
    // Duration is in days, convert to milliseconds
    const endTime = now + plan.duration * 24 * 60 * 60 * 1000;

    // Calculate initial daily ROI rate (randomized within range if available, otherwise use estimatedDailyEarning)
    let randomROI: number;
    if (plan.minDailyROI !== undefined && plan.maxDailyROI !== undefined) {
      const roiRange = plan.maxDailyROI - plan.minDailyROI;
      randomROI = plan.minDailyROI + Math.random() * roiRange;
    } else {
      // Fallback: calculate ROI from estimatedDailyEarning and purchaseAmount
      // This is for backward compatibility with old plans
      randomROI = (plan.estimatedDailyEarning / args.purchaseAmount) * 100;
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
      currentRate: randomROI, // Store daily ROI percentage
      lastPayoutDate: undefined, // Will be set on first payout
      status: "active",
      pausedBy: undefined,
      createdAt: now,
    });

    // Deduct the purchase amount from user's platform balance
    // Convert USD purchase amount to crypto amounts using provided prices
    const btcBalance = user.platformBalance.BTC ?? 0;
    const ethBalance = user.platformBalance.ETH ?? 0;
    
    // Calculate how much USD value we have in BTC and ETH
    const btcValueUSD = btcBalance * args.btcPriceUSD;
    const ethValueUSD = ethBalance * args.ethPriceUSD;
    const totalValueUSD = btcValueUSD + ethValueUSD;
    
    if (totalValueUSD < args.purchaseAmount) {
      throw new ConvexError("Insufficient platform balance");
    }
    
    // Deduct from BTC first, then ETH
    let remainingCostUSD = args.purchaseAmount;
    const balanceUpdates: Partial<typeof user.platformBalance> = {};
    
    if (btcValueUSD > 0 && remainingCostUSD > 0) {
      if (btcValueUSD >= remainingCostUSD) {
        // Deduct entirely from BTC
        const btcToDeduct = remainingCostUSD / args.btcPriceUSD;
        balanceUpdates.BTC = btcBalance - btcToDeduct;
        remainingCostUSD = 0;
      } else {
        // Deduct all BTC, continue with ETH
        balanceUpdates.BTC = 0;
        remainingCostUSD -= btcValueUSD;
      }
    }
    
    if (ethValueUSD > 0 && remainingCostUSD > 0) {
      // Deduct remaining from ETH
      const ethToDeduct = remainingCostUSD / args.ethPriceUSD;
      if (ethBalance >= ethToDeduct) {
        balanceUpdates.ETH = ethBalance - ethToDeduct;
        remainingCostUSD = 0;
      } else {
        throw new ConvexError("Insufficient platform balance");
      }
    }
    
    if (remainingCostUSD > 0) {
      throw new ConvexError("Insufficient platform balance");
    }

    await ctx.db.patch(args.userId, {
      platformBalance: {
        ...user.platformBalance,
        BTC: balanceUpdates.BTC ?? user.platformBalance.BTC,
        ETH: balanceUpdates.ETH ?? user.platformBalance.ETH,
      },
    });

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

