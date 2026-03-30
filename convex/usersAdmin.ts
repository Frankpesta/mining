import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const listAllUsers = query({
  args: {
    search: v.optional(v.string()),
    role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    let users = await ctx.db.query("users").collect();

    if (args.role) {
      users = users.filter((user) => user.role === args.role);
    }

    if (args.search) {
      const searchLower = args.search.toLowerCase();
      users = users.filter((user) => user.email.toLowerCase().includes(searchLower));
    }

    return users
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});

export const getUserDetails = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    const [deposits, withdrawals, miningOps] = await Promise.all([
      ctx.db
        .query("deposits")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect(),
      ctx.db
        .query("withdrawals")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect(),
      ctx.db
        .query("miningOperations")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect(),
    ]);

    return {
      user,
      stats: {
        totalDeposits: deposits.length,
        totalWithdrawals: withdrawals.length,
        activeMiningOps: miningOps.filter((op) => op.status === "active").length,
        totalMiningOps: miningOps.length,
      },
    };
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    adminId: v.id("users"),
    newRole: v.union(v.literal("user"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    const [admin, user] = await Promise.all([
      ctx.db.get(args.adminId),
      ctx.db.get(args.userId),
    ]);

    if (!admin || admin.role !== "admin") {
      throw new ConvexError("Only administrators can update user roles");
    }

    if (!user) {
      throw new ConvexError("User not found");
    }

    await ctx.db.patch(args.userId, {
      role: args.newRole,
    });

    await ctx.db.insert("auditLogs", {
      actorId: args.adminId,
      action: "user:updateRole",
      entity: "user",
      entityId: args.userId,
      metadata: {
        oldRole: user.role,
        newRole: args.newRole,
      },
      createdAt: Date.now(),
    });
  },
});

export const adjustUserPlatformBalance = mutation({
  args: {
    adminId: v.id("users"),
    userId: v.id("users"),
    crypto: v.union(
      v.literal("ETH"),
      v.literal("BTC"),
      v.literal("USDT"),
      v.literal("USDC"),
    ),
    delta: v.number(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const [admin, user] = await Promise.all([
      ctx.db.get(args.adminId),
      ctx.db.get(args.userId),
    ]);

    if (!admin || admin.role !== "admin") {
      throw new ConvexError("Only administrators can adjust user balances");
    }

    if (!user) {
      throw new ConvexError("User not found");
    }

    if (args.delta === 0) {
      throw new ConvexError("Adjustment amount cannot be zero");
    }

    const key = args.crypto;
    const current =
      key === "BTC"
        ? (user.platformBalance.BTC ?? 0)
        : (user.platformBalance[key] as number);

    const next = current + args.delta;
    if (next < -1e-12) {
      throw new ConvexError("Adjustment would result in a negative balance");
    }

    const normalized = next < 1e-12 ? 0 : next;

    await ctx.db.patch(args.userId, {
      platformBalance: {
        ...user.platformBalance,
        [key]: normalized,
      },
    });

    await ctx.db.insert("auditLogs", {
      actorId: args.adminId,
      action: "user:balanceAdjust",
      entity: "user",
      entityId: args.userId,
      metadata: {
        crypto: args.crypto,
        delta: args.delta,
        note: args.note,
        targetEmail: user.email,
      },
      createdAt: Date.now(),
    });
  },
});

export const toggleUserSuspension = mutation({
  args: {
    userId: v.id("users"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const [admin, user] = await Promise.all([
      ctx.db.get(args.adminId),
      ctx.db.get(args.userId),
    ]);

    if (!admin || admin.role !== "admin") {
      throw new ConvexError("Only administrators can suspend users");
    }

    if (!user) {
      throw new ConvexError("User not found");
    }

    await ctx.db.patch(args.userId, {
      isSuspended: !user.isSuspended,
    });

    await ctx.db.insert("auditLogs", {
      actorId: args.adminId,
      action: user.isSuspended ? "user:unsuspend" : "user:suspend",
      entity: "user",
      entityId: args.userId,
      metadata: {
        email: user.email,
      },
      createdAt: Date.now(),
    });
  },
});

