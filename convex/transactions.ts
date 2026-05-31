import { v } from "convex/values";

import { query } from "./_generated/server";

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
