import { ConvexError, v } from "convex/values";
import type { FunctionReturnType } from "convex/server";

import { mutation, query } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { api } from "./_generated/api";

export const getProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    return profile;
  },
});

export const getProfileWithPicture = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!profile) {
      return null;
    }

    let profilePictureUrl: string | null = null;
    if (profile.profilePictureId) {
      profilePictureUrl = await ctx.storage.getUrl(profile.profilePictureId);
    }

    return {
      ...profile,
      profilePictureUrl,
    };
  },
});

export const updateProfile = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const { userId, ...profileData } = args;
    
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    const now = Date.now();
    const payload = {
      ...profileData,
      updatedAt: now,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return ctx.db.insert("profiles", {
      userId,
      ...profileData,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateProfilePicture = mutation({
  args: {
    userId: v.id("users"),
    profilePictureId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    // Delete old picture if exists
    if (existing?.profilePictureId) {
      await ctx.storage.delete(existing.profilePictureId);
    }

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, {
        profilePictureId: args.profilePictureId,
        updatedAt: now,
      });
      return existing._id;
    }

    return ctx.db.insert("profiles", {
      userId: args.userId,
      profilePictureId: args.profilePictureId,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const getAllProfiles = query({
  args: {},
  handler: async (ctx) => {
    const profiles = await ctx.db.query("profiles").collect();
    const users = await ctx.db.query("users").collect();
    const userMap = new Map(users.map((u) => [u._id, u]));

    const profilesWithUsers = await Promise.all(
      profiles.map(async (profile) => {
        let profilePictureUrl: string | null = null;
        if (profile.profilePictureId) {
          profilePictureUrl = await ctx.storage.getUrl(profile.profilePictureId);
        }

        const user = userMap.get(profile.userId);
        return {
          ...profile,
          email: user?.email ?? null,
          profilePictureUrl,
        };
      })
    );

    return profilesWithUsers;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export type Profile = FunctionReturnType<typeof api.profiles.getProfile>;
export type ProfileWithPicture = FunctionReturnType<typeof api.profiles.getProfileWithPicture>;

