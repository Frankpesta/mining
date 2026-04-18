import { ConvexError, v } from "convex/values";

import { mutation, query, internalQuery } from "./_generated/server";


export const getSetting = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();
    return setting?.value ?? null;
  },
});

export const getAllSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("platformSettings").collect();
    return settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      },
      {} as Record<string, unknown>,
    );
  },
});

const EMAIL_TEMPLATE_DEFAULTS: Record<string, string> = {
  emailDepositSubject: "Deposit Approved",
  emailDepositBody: "Your deposit has been approved.",
  emailWithdrawalSubject: "Withdrawal Processed",
  emailWithdrawalBody: "Your withdrawal has been processed.",
};

/** Used when sending transactional emails from internal actions. */
export const getEmailTemplateStrings = internalQuery({
  args: {},
  handler: async (ctx) => {
    const result = { ...EMAIL_TEMPLATE_DEFAULTS };
    for (const key of Object.keys(EMAIL_TEMPLATE_DEFAULTS)) {
      const row = await ctx.db
        .query("platformSettings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .first();
      if (row?.value !== undefined && typeof row.value === "string" && row.value.trim()) {
        result[key] = row.value;
      }
    }
    return result;
  },
});

export const setSetting = mutation({
  args: {
    key: v.string(),
    value: v.any(),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new ConvexError("Only administrators can update platform settings");
    }

    const existing = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    const payload = {
      key: args.key,
      value: args.value,
      updatedAt: Date.now(),
      updatedBy: args.adminId,
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return ctx.db.insert("platformSettings", payload);
  },
});

export const deleteSetting = mutation({
  args: {
    key: v.string(),
    adminId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    if (!admin || admin.role !== "admin") {
      throw new ConvexError("Only administrators can delete platform settings");
    }

    const setting = await ctx.db
      .query("platformSettings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (setting) {
      await ctx.db.delete(setting._id);
    }
  },
});

