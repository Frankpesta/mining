import { ConvexError, v } from "convex/values";
import type { FunctionReturnType } from "convex/server";

import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { api } from "./_generated/api";

export const getReferralSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("referralSettings").first();
    if (!settings) {
      // Initialize default settings
      return {
        referralBonusAmount: 20,
        isEnabled: true,
      };
    }
    return {
      referralBonusAmount: settings.referralBonusAmount,
      isEnabled: settings.isEnabled,
    };
  },
});

export const updateReferralSettings = mutation({
  args: {
    referralBonusAmount: v.number(),
    isEnabled: v.boolean(),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new ConvexError("Only administrators can update referral settings");
    }

    const existing = await ctx.db.query("referralSettings").first();
    const payload = {
      referralBonusAmount: args.referralBonusAmount,
      isEnabled: args.isEnabled,
      updatedAt: Date.now(),
      updatedBy: args.adminId,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return ctx.db.insert("referralSettings", payload);
  },
});

export const getUserReferralStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q) => q.eq("referrerId", args.userId))
      .collect();

    const totalReferrals = referrals.length;
    const awardedReferrals = referrals.filter((r) => r.status === "awarded").length;
    const pendingReferrals = referrals.filter((r) => r.status === "pending").length;
    const totalBonusEarned = referrals
      .filter((r) => r.status === "awarded")
      .reduce((sum, r) => sum + r.bonusAmount, 0);

    return {
      referralCode: user.referralCode || "",
      totalReferrals,
      awardedReferrals,
      pendingReferrals,
      totalBonusEarned,
      referralBonusEarned: user.referralBonusEarned || 0,
    };
  },
});

export const getAllReferrals = query({
  args: {},
  handler: async (ctx) => {
    const referrals = await ctx.db.query("referrals").collect();
    const users = await ctx.db.query("users").collect();
    const userMap = new Map(users.map((u) => [u._id, u]));

    return referrals.map((referral) => ({
      ...referral,
      referrerEmail: userMap.get(referral.referrerId)?.email ?? null,
      referredUserEmail: userMap.get(referral.referredUserId)?.email ?? null,
    }));
  },
});

export const getReferralsByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q) => q.eq("referrerId", args.userId))
      .collect();

    const users = await ctx.db.query("users").collect();
    const userMap = new Map(users.map((u) => [u._id, u]));

    return referrals.map((referral) => ({
      ...referral,
      referredUserEmail: userMap.get(referral.referredUserId)?.email ?? null,
    }));
  },
});

export const awardReferralBonus = mutation({
  args: {
    referralId: v.id("referrals"),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new ConvexError("Only administrators can award referral bonuses");
    }

    const referral = await ctx.db.get(args.referralId);
    if (!referral) {
      throw new ConvexError("Referral not found");
    }

    if (referral.status !== "pending") {
      throw new ConvexError("Referral bonus already processed");
    }

    const referrer = await ctx.db.get(referral.referrerId);
    if (!referrer) {
      throw new ConvexError("Referrer not found");
    }

    // Award bonus to referrer's platform balance (USDC)
    await ctx.db.patch(referral.referrerId, {
      platformBalance: {
        ...referrer.platformBalance,
        USDC: referrer.platformBalance.USDC + referral.bonusAmount,
      },
      referralBonusEarned: (referrer.referralBonusEarned || 0) + referral.bonusAmount,
    });

    // Update referral status
    await ctx.db.patch(args.referralId, {
      status: "awarded",
      awardedAt: Date.now(),
    });

    return { success: true };
  },
});

export type ReferralStats = FunctionReturnType<typeof api.referrals.getUserReferralStats>;

