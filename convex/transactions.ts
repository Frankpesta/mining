import { v } from "convex/values";

import { query } from "./_generated/server";

export type TransactionEntry = {
  type: "deposit" | "withdrawal" | "payout" | "purchase" | "referral";
  id: string;
  timestamp: number;
  crypto: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "completed" | "failed";
  detail?: string;
};

/**
 * Unified ledger across every balance-affecting event: deposits, withdrawals,
 * mining ROI payouts, plan purchases (mining operation starts), and awarded
 * referral bonuses. The Transactions page previously only surfaced
 * miningPayouts, so everything else never appeared there.
 */
export const listUserTransactions = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<TransactionEntry[]> => {
    const limit = args.limit ?? 100;

    const [deposits, withdrawals, payouts, operations, referrals] = await Promise.all([
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
    ]);

    const planIds = Array.from(new Set(operations.map((op) => op.planId)));
    const plans = await Promise.all(planIds.map((planId) => ctx.db.get(planId)));
    const planNames = new Map(
      plans.filter((plan) => plan !== null).map((plan) => [plan._id, plan.name]),
    );

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
