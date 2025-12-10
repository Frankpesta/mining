import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Id, Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";

type SupportedCrypto = 
  | "BTC"
  | "ETH"
  | "SOL"
  | "LTC"
  | "BNB"
  | "ADA"
  | "XRP"
  | "DOGE"
  | "DOT"
  | "MATIC"
  | "AVAX"
  | "ATOM"
  | "LINK"
  | "UNI"
  | "USDT"
  | "USDC";

const WITHDRAWAL_FEES: Record<string, number> = {
  BTC: 0.0001,
  ETH: 0.001,
  SOL: 0.01,
  LTC: 0.001,
  BNB: 0.001,
  ADA: 1,
  XRP: 0.1,
  DOGE: 1,
  DOT: 0.1,
  MATIC: 0.1,
  AVAX: 0.01,
  ATOM: 0.01,
  LINK: 0.1,
  UNI: 0.1,
  USDT: 10,
  USDC: 10,
};

const calculateNetworkFee = (crypto: string, amount: number) => {
  const baseFee = WITHDRAWAL_FEES[crypto] ?? 0.001;
  if (crypto === "ETH") {
    return Math.max(baseFee, amount * 0.0025);
  }
  if (crypto === "BTC") {
    return Math.max(baseFee, amount * 0.0001);
  }
  return baseFee;
};

export const createWithdrawalRequest = mutation({
  args: {
    userId: v.id("users"),
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
    amount: v.number(),
    destinationAddress: v.string(),
    requestedFee: v.optional(v.number()),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) {
      throw new ConvexError("Withdrawal amount must be greater than zero");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // Get current balance - handle both required and optional fields
    let currentBalance = 0;
    if (args.crypto === "ETH" || args.crypto === "USDT" || args.crypto === "USDC") {
      currentBalance = user.platformBalance[args.crypto] ?? 0;
    } else if (args.crypto === "BTC") {
      currentBalance = user.platformBalance.BTC ?? 0;
    } else {
      // For optional coins, check if they exist in platformBalance
      const optionalCoin = args.crypto as "SOL" | "LTC" | "BNB" | "ADA" | "XRP" | "DOGE" | "DOT" | "MATIC" | "AVAX" | "ATOM" | "LINK" | "UNI";
      currentBalance = (user.platformBalance[optionalCoin] as number | undefined) ?? 0;
    }
    
    if (currentBalance < args.amount) {
      throw new ConvexError("Insufficient platform balance");
    }

    const networkFee = args.requestedFee ?? calculateNetworkFee(args.crypto, args.amount);
    if (networkFee >= args.amount) {
      throw new ConvexError("Amount must exceed the network fee");
    }

    const finalAmount = args.amount - networkFee;

    // Update balance based on crypto type
    if (args.crypto === "ETH" || args.crypto === "USDT" || args.crypto === "USDC") {
      await ctx.db.patch(user._id, {
        platformBalance: {
          ...user.platformBalance,
          [args.crypto]: currentBalance - args.amount,
        },
      });
    } else if (args.crypto === "BTC") {
      await ctx.db.patch(user._id, {
        platformBalance: {
          ...user.platformBalance,
          BTC: currentBalance - args.amount,
        },
      });
    } else {
      // Handle optional coins
      const optionalCoin = args.crypto as "SOL" | "LTC" | "BNB" | "ADA" | "XRP" | "DOGE" | "DOT" | "MATIC" | "AVAX" | "ATOM" | "LINK" | "UNI";
      await ctx.db.patch(user._id, {
        platformBalance: {
          ...user.platformBalance,
          [optionalCoin]: currentBalance - args.amount,
        },
      });
    }

    const withdrawalId = await ctx.db.insert("withdrawals", {
      userId: args.userId,
      crypto: args.crypto,
      amount: args.amount,
      destinationAddress: args.destinationAddress,
      networkFee,
      finalAmount,
      status: "pending",
      txHash: undefined,
      adminNote: undefined,
      userNote: args.note,
      approvedBy: undefined,
      createdAt: Date.now(),
      processedAt: undefined,
    });

    await ctx.db.insert("auditLogs", {
      actorId: args.userId,
      action: "withdrawal:create",
      entity: "withdrawal",
      entityId: withdrawalId,
      metadata: {
        amount: args.amount,
        crypto: args.crypto,
        destination: args.destinationAddress,
      },
      createdAt: Date.now(),
    });

    return withdrawalId;
  },
});

export const listUserWithdrawals = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return ctx.db
      .query("withdrawals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

export const listAdminWithdrawals = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("approved"),
        v.literal("rejected"),
        v.literal("completed"),
        v.literal("failed"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const withdrawals = await ctx.db
      .query("withdrawals")
      .order("desc")
      .take(limit);

    const filtered = args.status
      ? withdrawals.filter((withdrawal) => withdrawal.status === args.status)
      : withdrawals;

    return withUserEmail(ctx, filtered);
  },
});

export const updateWithdrawalStatus = mutation({
  args: {
    withdrawalId: v.id("withdrawals"),
    adminId: v.id("users"),
    status: v.union(
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    adminNote: v.optional(v.string()),
    txHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const [admin, withdrawal] = await Promise.all([
      ctx.db.get(args.adminId),
      ctx.db.get(args.withdrawalId),
    ]);

    if (!admin || admin.role !== "admin") {
      throw new ConvexError("Only administrators can update withdrawals");
    }

    if (!withdrawal) {
      throw new ConvexError("Withdrawal not found");
    }

    if (withdrawal.status === "completed" || withdrawal.status === "failed") {
      throw new ConvexError("Withdrawal has already been finalized");
    }

    const currentStatus = withdrawal.status;
    const allowedStatuses =
      currentStatus === "pending"
        ? ["approved", "rejected", "failed", "completed"]
        : currentStatus === "approved"
          ? ["completed", "failed"]
          : [];

    if (!allowedStatuses.includes(args.status)) {
      throw new ConvexError("Invalid status transition");
    }

    const user = await ctx.db.get(withdrawal.userId);
    if (!user) {
      throw new ConvexError("Associated user not found");
    }

    if (args.status === "rejected" || args.status === "failed") {
      // Refund the withdrawal amount back to user's platform balance
      if (withdrawal.crypto === "ETH" || withdrawal.crypto === "USDT" || withdrawal.crypto === "USDC") {
        await ctx.db.patch(user._id, {
          platformBalance: {
            ...user.platformBalance,
            [withdrawal.crypto]: user.platformBalance[withdrawal.crypto] + withdrawal.amount,
          },
        });
      } else if (withdrawal.crypto === "BTC") {
        await ctx.db.patch(user._id, {
          platformBalance: {
            ...user.platformBalance,
            BTC: (user.platformBalance.BTC ?? 0) + withdrawal.amount,
          },
        });
      } else {
        // Handle optional coins
        const optionalCoin = withdrawal.crypto as "SOL" | "LTC" | "BNB" | "ADA" | "XRP" | "DOGE" | "DOT" | "MATIC" | "AVAX" | "ATOM" | "LINK" | "UNI";
        const currentBalance = (user.platformBalance[optionalCoin] as number | undefined) ?? 0;
        await ctx.db.patch(user._id, {
          platformBalance: {
            ...user.platformBalance,
            [optionalCoin]: currentBalance + withdrawal.amount,
          },
        });
      }
    }

    let approvedBy = withdrawal.approvedBy;
    if (args.status === "approved") {
      approvedBy = args.adminId;
    } else if (!approvedBy && (args.status === "completed" || args.status === "failed" || args.status === "rejected")) {
      approvedBy = args.adminId;
    }

    await ctx.db.patch(args.withdrawalId, {
      status: args.status,
      txHash: args.txHash ?? withdrawal.txHash,
      adminNote: args.adminNote ?? withdrawal.adminNote,
      approvedBy,
      processedAt:
        args.status === "completed" || args.status === "failed" ? Date.now() : withdrawal.processedAt,
    });

    await ctx.db.insert("auditLogs", {
      actorId: args.adminId,
      action: "withdrawal:update",
      entity: "withdrawal",
      entityId: args.withdrawalId,
      metadata: {
        newStatus: args.status,
        amount: withdrawal.amount,
        crypto: withdrawal.crypto,
        userId: withdrawal.userId,
      },
      createdAt: Date.now(),
    });
  },
});

async function withUserEmail(
  ctx: QueryCtx,
  withdrawals: Array<Doc<"withdrawals">>,
): Promise<Array<Doc<"withdrawals"> & { userEmail: string | null }>> {
  const uniqueUserIds = Array.from(new Set(withdrawals.map((withdrawal) => withdrawal.userId)));
  const users = await Promise.all(uniqueUserIds.map((userId) => ctx.db.get(userId)));
  const emailMap = new Map<Id<"users">, string>();

  users.forEach((user) => {
    if (user) {
      emailMap.set(user._id, user.email);
    }
  });

  return withdrawals.map((withdrawal) => ({
    ...withdrawal,
    userEmail: emailMap.get(withdrawal.userId) ?? null,
  }));
}

