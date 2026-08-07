import { ConvexError, v } from "convex/values";

import { mutation, query, internalQuery } from "./_generated/server";
import type { Id, Doc } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import {
  patchMiningCoinBalance,
  patchPlatformCoinBalance,
  readMiningCoinBalance,
  readPlatformCoinBalance,
} from "./balanceHelpers";

export const createBankWithdrawalRequest = mutation({
  args: {
    userId: v.id("users"),
    balanceSource: v.union(v.literal("platform"), v.literal("mining")),
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
    currency: v.string(),
    accountHolderName: v.string(),
    bankName: v.string(),
    accountNumber: v.string(),
    accountType: v.optional(v.union(v.literal("checking"), v.literal("savings"))),
    routingNumber: v.optional(v.string()),
    swiftCode: v.optional(v.string()),
    iban: v.optional(v.string()),
    bankAddress: v.optional(v.string()),
    bankCountry: v.string(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.amount <= 0) {
      throw new ConvexError("Withdrawal amount must be greater than zero");
    }

    if (
      args.balanceSource === "mining" &&
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
      args.balanceSource === "platform"
        ? readPlatformCoinBalance(user, args.crypto)
        : readMiningCoinBalance(user, args.crypto);

    if (currentBalance < args.amount) {
      throw new ConvexError(
        args.balanceSource === "platform"
          ? "Insufficient platform balance"
          : "Insufficient mining balance",
      );
    }

    const nextBalance = currentBalance - args.amount;

    if (args.balanceSource === "platform") {
      await ctx.db.patch(user._id, {
        platformBalance: patchPlatformCoinBalance(user, args.crypto, nextBalance),
      });
    } else {
      await ctx.db.patch(user._id, {
        miningBalance: patchMiningCoinBalance(user, args.crypto, nextBalance),
      });
    }

    const bankWithdrawalId = await ctx.db.insert("bankWithdrawals", {
      userId: args.userId,
      balanceSource: args.balanceSource,
      crypto: args.crypto,
      amount: args.amount,
      currency: args.currency,
      status: "pending",
      accountHolderName: args.accountHolderName,
      bankName: args.bankName,
      accountNumber: args.accountNumber,
      accountType: args.accountType,
      routingNumber: args.routingNumber,
      swiftCode: args.swiftCode,
      iban: args.iban,
      bankAddress: args.bankAddress,
      bankCountry: args.bankCountry,
      adminNote: undefined,
      userNote: args.note,
      approvedBy: undefined,
      createdAt: Date.now(),
      processedAt: undefined,
    });

    await ctx.db.insert("auditLogs", {
      actorId: args.userId,
      action: "bank_withdrawal:create",
      entity: "bankWithdrawal",
      entityId: bankWithdrawalId,
      metadata: {
        amount: args.amount,
        crypto: args.crypto,
        currency: args.currency,
        balanceSource: args.balanceSource,
        bankName: args.bankName,
      },
      createdAt: Date.now(),
    });

    return bankWithdrawalId;
  },
});

export const getBankWithdrawalById = internalQuery({
  args: { bankWithdrawalId: v.id("bankWithdrawals") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.bankWithdrawalId);
  },
});

export const listUserBankWithdrawals = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    return ctx.db
      .query("bankWithdrawals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);
  },
});

export const listAdminBankWithdrawals = query({
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
    const bankWithdrawals = await ctx.db
      .query("bankWithdrawals")
      .order("desc")
      .take(limit);

    const filtered = args.status
      ? bankWithdrawals.filter((bankWithdrawal) => bankWithdrawal.status === args.status)
      : bankWithdrawals;

    return withUserEmail(ctx, filtered);
  },
});

export const updateBankWithdrawalStatus = mutation({
  args: {
    bankWithdrawalId: v.id("bankWithdrawals"),
    adminId: v.id("users"),
    status: v.union(
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const [admin, bankWithdrawal] = await Promise.all([
      ctx.db.get(args.adminId),
      ctx.db.get(args.bankWithdrawalId),
    ]);

    if (!admin || admin.role !== "admin") {
      throw new ConvexError("Only administrators can update bank withdrawals");
    }

    if (!bankWithdrawal) {
      throw new ConvexError("Bank withdrawal not found");
    }

    if (bankWithdrawal.status === "completed" || bankWithdrawal.status === "failed") {
      throw new ConvexError("Bank withdrawal has already been finalized");
    }

    const currentStatus = bankWithdrawal.status;
    const allowedStatuses =
      currentStatus === "pending"
        ? ["approved", "rejected", "failed", "completed"]
        : currentStatus === "approved"
          ? ["completed", "failed"]
          : [];

    if (!allowedStatuses.includes(args.status)) {
      throw new ConvexError("Invalid status transition");
    }

    const user = await ctx.db.get(bankWithdrawal.userId);
    if (!user) {
      throw new ConvexError("Associated user not found");
    }

    if (args.status === "rejected" || args.status === "failed") {
      if (bankWithdrawal.balanceSource === "mining") {
        const cur = readMiningCoinBalance(user, bankWithdrawal.crypto);
        await ctx.db.patch(user._id, {
          miningBalance: patchMiningCoinBalance(
            user,
            bankWithdrawal.crypto,
            cur + bankWithdrawal.amount,
          ),
        });
      } else {
        const cur = readPlatformCoinBalance(user, bankWithdrawal.crypto);
        await ctx.db.patch(user._id, {
          platformBalance: patchPlatformCoinBalance(
            user,
            bankWithdrawal.crypto,
            cur + bankWithdrawal.amount,
          ),
        });
      }
    }

    let approvedBy = bankWithdrawal.approvedBy;
    if (args.status === "approved") {
      approvedBy = args.adminId;
    } else if (!approvedBy && (args.status === "completed" || args.status === "failed" || args.status === "rejected")) {
      approvedBy = args.adminId;
    }

    await ctx.db.patch(args.bankWithdrawalId, {
      status: args.status,
      adminNote: args.adminNote ?? bankWithdrawal.adminNote,
      approvedBy,
      processedAt:
        args.status === "completed" || args.status === "failed"
          ? Date.now()
          : bankWithdrawal.processedAt,
    });

    await ctx.db.insert("auditLogs", {
      actorId: args.adminId,
      action: "bank_withdrawal:update",
      entity: "bankWithdrawal",
      entityId: args.bankWithdrawalId,
      metadata: {
        newStatus: args.status,
        amount: bankWithdrawal.amount,
        crypto: bankWithdrawal.crypto,
        userId: bankWithdrawal.userId,
      },
      createdAt: Date.now(),
    });
  },
});

async function withUserEmail(
  ctx: QueryCtx,
  bankWithdrawals: Array<Doc<"bankWithdrawals">>,
): Promise<Array<Doc<"bankWithdrawals"> & { userEmail: string | null }>> {
  const uniqueUserIds = Array.from(new Set(bankWithdrawals.map((bankWithdrawal) => bankWithdrawal.userId)));
  const users = await Promise.all(uniqueUserIds.map((userId) => ctx.db.get(userId)));
  const emailMap = new Map<Id<"users">, string>();

  users.forEach((user) => {
    if (user) {
      emailMap.set(user._id, user.email);
    }
  });

  return bankWithdrawals.map((bankWithdrawal) => ({
    ...bankWithdrawal,
    userEmail: emailMap.get(bankWithdrawal.userId) ?? null,
  }));
}
