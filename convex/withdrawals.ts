import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

type Crypto = "ETH" | "USDT" | "USDC";

const WITHDRAWAL_FEES: Record<Crypto, number> = {
  ETH: 0.001,
  USDT: 10,
  USDC: 10,
};

const calculateNetworkFee = (crypto: Crypto, amount: number) => {
  const baseFee = WITHDRAWAL_FEES[crypto];
  if (crypto === "ETH") {
    return Math.max(baseFee, amount * 0.0025);
  }
  return baseFee;
};

export const createWithdrawalRequest = mutation({
  args: {
    userId: v.id("users"),
    crypto: v.union(v.literal("ETH"), v.literal("USDT"), v.literal("USDC")),
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

    const currentBalance = user.platformBalance[args.crypto as Crypto];
    if (currentBalance < args.amount) {
      throw new ConvexError("Insufficient platform balance");
    }

    const networkFee = args.requestedFee ?? calculateNetworkFee(args.crypto as Crypto, args.amount);
    if (networkFee >= args.amount) {
      throw new ConvexError("Amount must exceed the network fee");
    }

    const finalAmount = args.amount - networkFee;

    await ctx.db.patch(user._id, {
      platformBalance: {
        ...user.platformBalance,
        [args.crypto]: currentBalance - args.amount,
      },
    });

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
      const updatedBalance = {
        ...user.platformBalance,
        [withdrawal.crypto]:
          user.platformBalance[withdrawal.crypto as Crypto] + withdrawal.amount,
      };
      await ctx.db.patch(user._id, { platformBalance: updatedBalance });
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
  ctx: Parameters<typeof listAdminWithdrawals["handler"]>[0],
  withdrawals: Array<
    {
      _id: Id<"withdrawals">;
      userId: Id<"users">;
    } & Record<string, any>
  >,
) {
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

