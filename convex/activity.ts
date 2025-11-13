import { v } from "convex/values";

import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const getUserActivity = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    entity: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    let logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_actor", (q) => q.eq("actorId", args.userId))
      .collect();

    if (args.entity) {
      logs = logs.filter((log) => log.entity === args.entity);
    }

    const deposits = await ctx.db
      .query("deposits")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const withdrawals = await ctx.db
      .query("withdrawals")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const miningOps = await ctx.db
      .query("miningOperations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    const activityItems = [
      ...logs.map((log) => ({
        type: "audit" as const,
        id: log._id,
        timestamp: log.createdAt,
        action: log.action,
        entity: log.entity,
        metadata: log.metadata,
      })),
      ...deposits.map((deposit) => ({
        type: "deposit" as const,
        id: deposit._id,
        timestamp: deposit.createdAt,
        amount: deposit.amount,
        crypto: deposit.crypto,
        status: deposit.status,
      })),
      ...withdrawals.map((withdrawal) => ({
        type: "withdrawal" as const,
        id: withdrawal._id,
        timestamp: withdrawal.createdAt,
        amount: withdrawal.amount,
        crypto: withdrawal.crypto,
        status: withdrawal.status,
      })),
      ...miningOps.map((op) => ({
        type: "mining" as const,
        id: op._id,
        timestamp: op.createdAt,
        coin: op.coin,
        hashRate: op.hashRate,
        status: op.status,
      })),
    ];

    return activityItems
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  },
});

