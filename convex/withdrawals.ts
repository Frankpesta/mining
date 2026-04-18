import { ConvexError, v } from "convex/values";

import { mutation, query, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id, Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import {
  patchMiningCoinBalance,
  patchPlatformCoinBalance,
  readMiningCoinBalance,
  readPlatformCoinBalance,
} from "./balanceHelpers";

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
    balanceSource: v.optional(
      v.union(v.literal("platform"), v.literal("mining")),
    ),
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

    const balanceSource = args.balanceSource ?? "platform";

    if (
      balanceSource === "mining" &&
      (args.crypto === "USDT" || args.crypto === "USDC")
    ) {
      throw new ConvexError(
        "USDT and USDC are only in your platform (deposit) wallet. Switch balance source to Platform.",
      );
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    const currentBalance =
      balanceSource === "platform"
        ? readPlatformCoinBalance(user, args.crypto)
        : readMiningCoinBalance(user, args.crypto);

    if (currentBalance < args.amount) {
      throw new ConvexError(
        balanceSource === "platform"
          ? "Insufficient platform balance"
          : "Insufficient mining balance",
      );
    }

    const networkFee = args.requestedFee ?? calculateNetworkFee(args.crypto, args.amount);
    if (networkFee >= args.amount) {
      throw new ConvexError("Amount must exceed the network fee");
    }

    const finalAmount = args.amount - networkFee;

    const nextBalance = currentBalance - args.amount;

    if (balanceSource === "platform") {
      await ctx.db.patch(user._id, {
        platformBalance: patchPlatformCoinBalance(user, args.crypto, nextBalance),
      });
    } else {
      await ctx.db.patch(user._id, {
        miningBalance: patchMiningCoinBalance(user, args.crypto, nextBalance),
      });
    }

    const withdrawalId = await ctx.db.insert("withdrawals", {
      userId: args.userId,
      balanceSource,
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
        balanceSource,
        destination: args.destinationAddress,
      },
      createdAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.emails.sendWithdrawalRequestedEmail, {
      withdrawalId,
    });

    return withdrawalId;
  },
});

export const getWithdrawalById = internalQuery({
  args: { withdrawalId: v.id("withdrawals") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.withdrawalId);
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
      const refundSource = withdrawal.balanceSource ?? "platform";
      if (refundSource === "mining") {
        const cur = readMiningCoinBalance(user, withdrawal.crypto);
        await ctx.db.patch(user._id, {
          miningBalance: patchMiningCoinBalance(
            user,
            withdrawal.crypto,
            cur + withdrawal.amount,
          ),
        });
      } else {
        const cur = readPlatformCoinBalance(user, withdrawal.crypto);
        await ctx.db.patch(user._id, {
          platformBalance: patchPlatformCoinBalance(
            user,
            withdrawal.crypto,
            cur + withdrawal.amount,
          ),
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

    await ctx.scheduler.runAfter(0, internal.emails.sendWithdrawalStatusEmail, {
      withdrawalId: args.withdrawalId,
      status: args.status,
      adminNote: args.adminNote,
      txHash: args.txHash,
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

