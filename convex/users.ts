import { ConvexError, v } from "convex/values";
import type { FunctionReturnType } from "convex/server";

import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { api } from "./_generated/api";

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    return ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db.get(args.userId);
  },
});

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const createUser = mutation({
  args: {
    email: v.string(),
    passwordHash: v.string(),
    verificationToken: v.string(),
    verificationTokenExpiresAt: v.number(),
    referralCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      throw new ConvexError("Email is already registered");
    }

    // Generate unique referral code
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

    // Find referrer if referral code provided
    let referredBy: Id<"users"> | undefined = undefined;
    if (args.referralCode) {
      const referrer = await ctx.db
        .query("users")
        .withIndex("by_referral_code", (q) => q.eq("referralCode", args.referralCode))
        .first();
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      email,
      passwordHash: args.passwordHash,
      role: "user",
      isEmailVerified: false,
      verificationToken: args.verificationToken,
      verificationTokenExpiresAt: args.verificationTokenExpiresAt,
      resetToken: undefined,
      resetTokenExpiresAt: undefined,
      platformBalance: { ETH: 0, USDT: 0, USDC: 0 },
      miningBalance: { BTC: 0, ETH: 0, LTC: 0, others: undefined },
      isSuspended: false,
      createdAt: now,
      lastLogin: undefined,
      referralCode: referralCode,
      referredBy: referredBy,
      referralBonusEarned: 0,
      totalReferrals: 0,
    });

    // Create referral record if referred
    if (referredBy) {
      const referralSettings = await ctx.db.query("referralSettings").first();
      const bonusAmount = referralSettings?.referralBonusAmount ?? 20; // Default $20
      
      await ctx.db.insert("referrals", {
        referrerId: referredBy,
        referredUserId: userId,
        bonusAmount,
        status: "pending",
        createdAt: now,
      });

      // Award bonus to referrer
      const referrer = await ctx.db.get(referredBy);
      if (referrer) {
        await ctx.db.patch(referredBy, {
          totalReferrals: (referrer.totalReferrals || 0) + 1,
        });
      }
    }

    return userId;
  },
});

export const setVerificationToken = mutation({
  args: {
    userId: v.id("users"),
    verificationToken: v.string(),
    verificationTokenExpiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      verificationToken: args.verificationToken,
      verificationTokenExpiresAt: args.verificationTokenExpiresAt,
      isEmailVerified: false,
    });
  },
});

export const consumeVerificationToken = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_verification_token", (q) => q.eq("verificationToken", args.token))
      .first();

    if (!user) {
      throw new ConvexError("Invalid verification token or token has already been used");
    }

    if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt < Date.now()) {
      throw new ConvexError("Verification token has expired");
    }

    await ctx.db.patch(user._id, {
      isEmailVerified: true,
      verificationToken: undefined,
      verificationTokenExpiresAt: undefined,
    });

    // Award referral bonus if user was referred
    if (user.referredBy) {
      const referral = await ctx.db
        .query("referrals")
        .withIndex("by_referred_user", (q) => q.eq("referredUserId", user._id))
        .first();
      
      if (referral && referral.status === "pending") {
        const referralSettings = await ctx.db.query("referralSettings").first();
        const isEnabled = referralSettings?.isEnabled ?? true;
        
        if (isEnabled) {
          // Award bonus to referrer's platform balance (USDC)
          const referrer = await ctx.db.get(user.referredBy);
          if (referrer) {
            await ctx.db.patch(user.referredBy, {
              platformBalance: {
                ...referrer.platformBalance,
                USDC: referrer.platformBalance.USDC + referral.bonusAmount,
              },
              referralBonusEarned: (referrer.referralBonusEarned || 0) + referral.bonusAmount,
            });

            // Update referral status
            await ctx.db.patch(referral._id, {
              status: "awarded",
              awardedAt: Date.now(),
            });
          }
        }
      }
    }

    return user._id;
  },
});

export const setResetToken = mutation({
  args: {
    userId: v.id("users"),
    resetToken: v.string(),
    resetTokenExpiresAt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      resetToken: args.resetToken,
      resetTokenExpiresAt: args.resetTokenExpiresAt,
    });
  },
});

export const consumeResetToken = mutation({
  args: { token: v.string(), passwordHash: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_reset_token", (q) => q.eq("resetToken", args.token))
      .first();

    if (!user) {
      throw new ConvexError("Invalid reset token or token has already been used");
    }

    if (user.resetTokenExpiresAt && user.resetTokenExpiresAt < Date.now()) {
      throw new ConvexError("Reset token has expired");
    }

    await ctx.db.patch(user._id, {
      passwordHash: args.passwordHash,
      resetToken: undefined,
      resetTokenExpiresAt: undefined,
    });

    return user._id;
  },
});

export const updateLastLogin = mutation({
  args: { userId: v.id("users"), lastLogin: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { lastLogin: args.lastLogin });
  },
});

export const suspendUser = mutation({
  args: { userId: v.id("users"), isSuspended: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { isSuspended: args.isSuspended });
  },
});

export const adjustPlatformBalance = mutation({
  args: {
    userId: v.id("users"),
    currency: v.union(v.literal("ETH"), v.literal("USDT"), v.literal("USDC")),
    amountDelta: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }
    const balance = user.platformBalance[args.currency] + args.amountDelta;
    if (balance < 0) {
      throw new ConvexError("Insufficient balance");
    }
    await ctx.db.patch(args.userId, {
      platformBalance: {
        ...user.platformBalance,
        [args.currency]: balance,
      },
    });
  },
});

export const adjustMiningBalance = mutation({
  args: {
    userId: v.id("users"),
    coin: v.string(),
    amountDelta: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }
    const current =
      args.coin === "BTC" || args.coin === "ETH" || args.coin === "LTC"
        ? user.miningBalance[args.coin]
        : user.miningBalance.others?.[args.coin] ?? 0;

    const nextValue = current + args.amountDelta;
    if (nextValue < 0) {
      throw new ConvexError("Insufficient mining balance");
    }

    if (args.coin === "BTC" || args.coin === "ETH" || args.coin === "LTC") {
      await ctx.db.patch(args.userId, {
        miningBalance: {
          ...user.miningBalance,
          [args.coin]: nextValue,
        },
      });
      return;
    }

    await ctx.db.patch(args.userId, {
      miningBalance: {
        ...user.miningBalance,
        others: {
          ...user.miningBalance.others,
          [args.coin]: nextValue,
        },
      },
    });
  },
});

export type UserDoc = NonNullable<FunctionReturnType<typeof api.users.getUserByEmail>>;

export type UserId = Id<"users">;

