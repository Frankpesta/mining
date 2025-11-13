import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const platformBalance = () =>
  v.object({
    ETH: v.number(),
    USDT: v.number(),
    USDC: v.number(),
  });

const miningBalance = () =>
  v.object({
    BTC: v.number(),
    ETH: v.number(),
    LTC: v.number(),
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
  })
    .index("by_email", ["email"])
    .index("by_verification_token", ["verificationToken"])
    .index("by_reset_token", ["resetToken"]),

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
    crypto: v.union(v.literal("ETH"), v.literal("USDT"), v.literal("USDC")),
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
    crypto: v.union(v.literal("ETH"), v.literal("USDT"), v.literal("USDC")),
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
    duration: v.number(),
    priceUSD: v.number(),
    supportedCoins: v.array(v.string()),
    estimatedDailyEarning: v.number(),
    isActive: v.boolean(),
    features: v.array(v.string()),
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
    startTime: v.number(),
    endTime: v.number(),
    totalMined: v.number(),
    currentRate: v.number(),
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
    crypto: v.union(v.literal("ETH"), v.literal("USDT"), v.literal("USDC")),
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
});

