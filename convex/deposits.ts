import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

type Crypto = "ETH" | "USDT" | "USDC";

export const createDepositRequest = mutation({
  args: {
    userId: v.id("users"),
    crypto: v.union(v.literal("ETH"), v.literal("USDT"), v.literal("USDC")),
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

export const updateDepositStatus = mutation({
  args: {
    depositId: v.id("deposits"),
    adminId: v.id("users"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    adminNote: v.optional(v.string()),
    txHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const [admin, deposit] = await Promise.all([
      ctx.db.get(args.adminId),
      ctx.db.get(args.depositId),
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

    const user = await ctx.db.get(deposit.userId);
    if (!user) {
      throw new ConvexError("Associated user not found");
    }

    if (args.status === "approved") {
      const updatedBalance = {
        ...user.platformBalance,
        [deposit.crypto]:
          user.platformBalance[deposit.crypto as Crypto] + (deposit.amount ?? 0),
      };

      await ctx.db.patch(user._id, {
        platformBalance: updatedBalance,
      });
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

async function withUserEmail(
  ctx: Parameters<typeof listAdminDeposits["handler"]>[0],
  deposits: Array<
    {
      _id: Id<"deposits">;
      userId: Id<"users">;
    } & Record<string, any>
  >,
) {
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

