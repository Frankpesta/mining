import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const platformBalance = () =>
  v.object({
    ETH: v.number(),
    USDT: v.number(),
    USDC: v.number(),
    BTC: v.optional(v.number()),
    SOL: v.optional(v.number()),
    LTC: v.optional(v.number()),
    BNB: v.optional(v.number()),
    ADA: v.optional(v.number()),
    XRP: v.optional(v.number()),
    DOGE: v.optional(v.number()),
    DOT: v.optional(v.number()),
    MATIC: v.optional(v.number()),
    AVAX: v.optional(v.number()),
    ATOM: v.optional(v.number()),
    LINK: v.optional(v.number()),
    UNI: v.optional(v.number()),
    others: v.optional(v.record(v.string(), v.number())),
  });

const miningBalance = () =>
  v.object({
    BTC: v.number(),
    ETH: v.number(),
    LTC: v.number(),
    SOL: v.optional(v.number()),
    BNB: v.optional(v.number()),
    ADA: v.optional(v.number()),
    XRP: v.optional(v.number()),
    DOGE: v.optional(v.number()),
    DOT: v.optional(v.number()),
    MATIC: v.optional(v.number()),
    AVAX: v.optional(v.number()),
    ATOM: v.optional(v.number()),
    LINK: v.optional(v.number()),
    UNI: v.optional(v.number()),
    others: v.optional(v.record(v.string(), v.number())),
  });

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
    isEmailVerified: v.boolean(),
    verificationToken: v.optional(v.string()),
    verificationTokenExpiresAt: v.optional(v.number()),
    resetToken: v.optional(v.string()),
    resetTokenExpiresAt: v.optional(v.number()),
    platformBalance: platformBalance(),
    miningBalance: miningBalance(),
    isSuspended: v.boolean(),
    createdAt: v.number(),
    lastLogin: v.optional(v.number()),
    referralCode: v.optional(v.string()),
    referredBy: v.optional(v.id("users")),
    referralBonusEarned: v.optional(v.number()),
    totalReferrals: v.optional(v.number()),
  })
    .index("by_email", ["email"])
    .index("by_verification_token", ["verificationToken"])
    .index("by_reset_token", ["resetToken"])
    .index("by_referral_code", ["referralCode"])
    .index("by_referred_by", ["referredBy"]),

  sessions: defineTable({
    userId: v.id("users"),
    sessionId: v.string(),
    tokenHash: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  })
    .index("by_session", ["sessionId"])
    .index("by_user", ["userId"]),

  deposits: defineTable({
    userId: v.id("users"),
    crypto: v.union(v.literal("ETH"), v.literal("BTC"), v.literal("USDT"), v.literal("USDC")),
    amount: v.number(),
    txHash: v.optional(v.string()),
    walletAddress: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    adminNote: v.optional(v.string()),
    approvedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    approvedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  withdrawals: defineTable({
    userId: v.id("users"),
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
    destinationAddress: v.string(),
    networkFee: v.number(),
    finalAmount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    txHash: v.optional(v.string()),
    adminNote: v.optional(v.string()),
    userNote: v.optional(v.string()),
    approvedBy: v.optional(v.id("users")),
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  plans: defineTable({
    name: v.string(),
    hashRate: v.number(),
    hashRateUnit: v.union(v.literal("TH/s"), v.literal("GH/s"), v.literal("MH/s")),
    duration: v.number(), // Duration in days
    minPriceUSD: v.optional(v.number()), // Minimum entry amount
    maxPriceUSD: v.optional(v.number()), // Maximum entry amount (optional for unlimited)
    priceUSD: v.number(), // Default/display price (required for backward compatibility)
    supportedCoins: v.array(v.string()),
    minDailyROI: v.optional(v.number()), // Minimum daily ROI percentage (e.g., 0.5 for 0.5%)
    maxDailyROI: v.optional(v.number()), // Maximum daily ROI percentage (e.g., 0.7 for 0.7%)
    estimatedDailyEarning: v.number(), // Average daily earning (for display)
    isActive: v.boolean(),
    features: v.array(v.string()),
    idealFor: v.optional(v.string()), // Target audience description
    createdAt: v.number(),
    updatedAt: v.number(),
    order: v.number(),
  })
    .index("by_active", ["isActive"])
    .index("by_order", ["order"]),

  miningOperations: defineTable({
    userId: v.id("users"),
    planId: v.id("plans"),
    coin: v.string(),
    hashRate: v.number(),
    hashRateUnit: v.string(),
    purchaseAmount: v.number(), // The actual amount paid for this operation (for ROI calculation)
    startTime: v.number(),
    endTime: v.number(),
    totalMined: v.number(), // Total earnings accumulated (in USD)
    currentRate: v.number(), // Current daily ROI rate (percentage)
    lastPayoutDate: v.optional(v.number()), // Last date profits were paid out (timestamp at start of day)
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("paused")),
    pausedBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  auditLogs: defineTable({
    actorId: v.optional(v.id("users")),
    action: v.string(),
    entity: v.string(),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.record(v.string(), v.any())),
    createdAt: v.number(),
  }).index("by_actor", ["actorId"]),

  hotWallets: defineTable({
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
    address: v.string(),
    label: v.optional(v.string()),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }).index("by_crypto", ["crypto"]),

  platformSettings: defineTable({
    key: v.string(),
    value: v.any(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }).index("by_key", ["key"]),

  referralSettings: defineTable({
    referralBonusAmount: v.number(),
    isEnabled: v.boolean(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }),

  referrals: defineTable({
    referrerId: v.id("users"),
    referredUserId: v.id("users"),
    bonusAmount: v.number(),
    status: v.union(v.literal("pending"), v.literal("awarded"), v.literal("cancelled")),
    awardedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_referrer", ["referrerId"])
    .index("by_referred_user", ["referredUserId"]),

  profiles: defineTable({
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    city: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    zipCode: v.optional(v.string()),
    dateOfBirth: v.optional(v.number()),
    bio: v.optional(v.string()),
    profilePictureId: v.optional(v.id("_storage")),
    updatedAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"]),

  tickets: defineTable({
    userId: v.optional(v.id("users")), // Optional for guest contact form submissions
    email: v.string(),
    name: v.string(),
    subject: v.string(),
    message: v.string(),
    company: v.optional(v.string()),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed"),
    ),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high")),
    assignedTo: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
    resolvedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_email", ["email"]),

  ticketReplies: defineTable({
    ticketId: v.id("tickets"),
    userId: v.id("users"), // Admin or user who replied
    message: v.string(),
    isAdminReply: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_ticket", ["ticketId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("ticket_reply"),
      v.literal("ticket_status_change"),
      v.literal("deposit_approved"),
      v.literal("withdrawal_approved"),
      v.literal("withdrawal_rejected"),
      v.literal("mining_completed"),
    ),
    title: v.string(),
    message: v.string(),
    relatedId: v.optional(v.string()), // ID of related entity (ticket, deposit, etc.)
    isRead: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_unread", ["userId", "isRead"]),
});

