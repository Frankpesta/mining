import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";
import { ConvexError, v } from "convex/values";

import { mutation, query } from "./_generated/server";

const hashToken = (token: string) => bytesToHex(sha256(utf8ToBytes(token)));

export const createSession = mutation({
  args: {
    userId: v.id("users"),
    sessionId: v.string(),
    token: v.string(),
    expiresAt: v.number(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("sessions", {
      userId: args.userId,
      sessionId: args.sessionId,
      tokenHash: hashToken(args.token),
      createdAt: Date.now(),
      expiresAt: args.expiresAt,
      userAgent: args.userAgent,
      ipAddress: args.ipAddress,
    });
  },
});

export const getSessionById = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
    if (!session) {
      return null;
    }
    if (session.expiresAt < Date.now()) {
      return null;
    }
    return session;
  },
});

export const verifySessionToken = query({
  args: { sessionId: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
    if (!session) {
      return null;
    }
    if (session.tokenHash !== hashToken(args.token)) {
      return null;
    }
    if (session.expiresAt < Date.now()) {
      return null;
    }
    return session;
  },
});

export const invalidateSession = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();
    if (!session) {
      throw new ConvexError("Session not found");
    }
    await ctx.db.delete(session._id);
  },
});

export const invalidateUserSessions = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    await Promise.all(sessions.map((session) => ctx.db.delete(session._id)));
  },
});

