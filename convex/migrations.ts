import { v } from "convex/values";
import { mutation } from "./_generated/server";

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Migration: Add referral fields to existing users
 * Run this once to populate referralCode, referralBonusEarned, and totalReferrals for existing users
 */
export const migrateUsersWithReferralFields = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let updated = 0;

    for (const user of users) {
      const updates: {
        referralCode?: string;
        referralBonusEarned?: number;
        totalReferrals?: number;
      } = {};

      // Generate referral code if missing
      if (!user.referralCode) {
        let referralCode = generateReferralCode();
        let existingCode = await ctx.db
          .query("users")
          .withIndex("by_referral_code", (q) => q.eq("referralCode", referralCode))
          .first();

        while (existingCode) {
          referralCode = generateReferralCode();
          existingCode = await ctx.db
            .query("users")
            .withIndex("by_referral_code", (q) => q.eq("referralCode", referralCode))
            .first();
        }
        updates.referralCode = referralCode;
      }

      // Set default values if missing
      if (user.referralBonusEarned === undefined) {
        updates.referralBonusEarned = 0;
      }

      if (user.totalReferrals === undefined) {
        updates.totalReferrals = 0;
      }

      // Only update if there are changes
      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(user._id, updates);
        updated++;
      }
    }

    return { updated, total: users.length };
  },
});

