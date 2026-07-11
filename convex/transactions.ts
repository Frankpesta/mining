import { v } from "convex/values";

import { query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export type TransactionEntry = {
  type: "deposit" | "withdrawal" | "payout" | "purchase" | "renewal" | "referral";
  id: string;
  timestamp: number;
  crypto: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "completed" | "failed";
  detail?: string;
};

/**
 * Unified ledger across every balance-affecting event: deposits, withdrawals,
 * mining ROI payouts, plan purchases (mining operation starts), auto-renewal
 * re-charges, and awarded referral bonuses. The Transactions page previously
 * only surfaced miningPayouts, so everything else never appeared there.
 *
 * Auto-renewals (convex/crons.ts) patch the existing miningOperations row in
 * place rather than inserting a new one, so they don't get their own
 * "purchase" entry from `operations` below - each renewal instead logs an
 * auditLogs row (action "mining:autoRenew") which is surfaced here as its
 * own "renewal" entry so the re-charge isn't invisible to the user.
 */
export const listUserTransactions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<TransactionEntry[]> => {
    const limit = args.limit ?? 100;

    const [deposits, withdrawals, payouts, operations, referrals, auditLogs] = await Promise.all([
      ctx.db
        .query("deposits")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect(),
      ctx.db
        .query("withdrawals")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect(),
      ctx.db
        .query("miningPayouts")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect(),
      ctx.db
        .query("miningOperations")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .collect(),
      ctx.db
        .query("referrals")
        .withIndex("by_referrer", (q) => q.eq("referrerId", args.userId))
        .collect(),
      ctx.db
        .query("auditLogs")
        .withIndex("by_actor", (q) => q.eq("actorId", args.userId))
        .collect(),
    ]);

    const planIds = Array.from(new Set(operations.map((op) => op.planId)));
    const plans = await Promise.all(planIds.map((planId) => ctx.db.get(planId)));
    const planNames = new Map(
      plans.filter((plan) => plan !== null).map((plan) => [plan._id, plan.name]),
    );
    const operationsById = new Map(operations.map((op) => [op._id, op]));
    const renewals = auditLogs.filter((log) => log.action === "mining:autoRenew");

    const entries: TransactionEntry[] = [
      ...deposits.map((deposit) => ({
        type: "deposit" as const,
        id: deposit._id,
        timestamp: deposit.createdAt,
        crypto: deposit.crypto,
        amount: deposit.amount,
        status: deposit.status,
      })),
      ...withdrawals.map((withdrawal) => ({
        type: "withdrawal" as const,
        id: withdrawal._id,
        timestamp: withdrawal.createdAt,
        crypto: withdrawal.crypto,
        amount: withdrawal.finalAmount,
        status: withdrawal.status,
      })),
      ...payouts.map((payout) => ({
        type: "payout" as const,
        id: payout._id,
        timestamp: payout.createdAt,
        crypto: payout.coin,
        amount: payout.profitUSD,
        status: "completed" as const,
      })),
      ...operations.map((operation) => ({
        type: "purchase" as const,
        id: operation._id,
        timestamp: operation.createdAt,
        crypto: operation.coin,
        amount: operation.purchaseAmount,
        status: "completed" as const,
        detail: planNames.get(operation.planId) ?? "Mining plan",
      })),
      ...renewals.map((log) => {
        const metadata = log.metadata as
          | { planId?: Id<"plans">; purchaseAmount?: number }
          | undefined;
        const operation = log.entityId
          ? operationsById.get(log.entityId as Id<"miningOperations">)
          : undefined;
        const planName =
          (metadata?.planId ? planNames.get(metadata.planId) : undefined) ??
          (operation ? planNames.get(operation.planId) : undefined) ??
          "Mining plan";
        return {
          type: "renewal" as const,
          id: log._id,
          timestamp: log.createdAt,
          crypto: operation?.coin ?? "USD",
          amount: metadata?.purchaseAmount ?? operation?.purchaseAmount ?? 0,
          status: "completed" as const,
          detail: `${planName} (auto-renewal)`,
        };
      }),
      ...referrals
        .filter((referral) => referral.status === "awarded")
        .map((referral) => ({
          type: "referral" as const,
          id: referral._id,
          timestamp: referral.awardedAt ?? referral.createdAt,
          crypto: "USD",
          amount: referral.bonusAmount,
          status: "completed" as const,
        })),
    ];

    return entries.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  },
});

export const listUserMiningPayouts = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    const payouts = await ctx.db
      .query("miningPayouts")
      .withIndex("by_user_payout_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    const planIds = Array.from(new Set(payouts.map((payout) => payout.planId)));
    const plans = await Promise.all(planIds.map((planId) => ctx.db.get(planId)));
    const planNames = new Map(
      plans
        .filter((plan) => plan !== null)
        .map((plan) => [plan._id, plan.name]),
    );

    return payouts
      .map((payout) => ({
        ...payout,
        planName: planNames.get(payout.planId) ?? "Mining plan",
      }));
  },
});
