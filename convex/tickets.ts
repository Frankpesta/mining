import { ConvexError, v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Create a ticket (from contact form or user dashboard)
export const createTicket = mutation({
  args: {
    userId: v.optional(v.id("users")),
    email: v.string(),
    name: v.string(),
    subject: v.string(),
    message: v.string(),
    company: v.optional(v.string()),
    priority: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const ticketId = await ctx.db.insert("tickets", {
      userId: args.userId,
      email: args.email,
      name: args.name,
      subject: args.subject,
      message: args.message,
      company: args.company,
      status: "open",
      priority: args.priority ?? "medium",
      createdAt: now,
      updatedAt: now,
    });

    // Create initial notification for admins (if user is logged in)
    if (args.userId) {
      // We'll create admin notifications via a separate mechanism
      // For now, just return the ticket
    }

    return ticketId;
  },
});

// Get all tickets (admin)
export const getAllTickets = query({
  args: {
    status: v.optional(
      v.union(v.literal("open"), v.literal("in_progress"), v.literal("resolved"), v.literal("closed")),
    ),
  },
  handler: async (ctx, args) => {
    const tickets = args.status
      ? await ctx.db
          .query("tickets")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .collect()
      : await ctx.db.query("tickets").collect();
    
    // Get user info for tickets with userId
    const userIds = new Set(tickets.map((t) => t.userId).filter((id): id is Id<"users"> => id !== undefined));
    const users = await Promise.all(Array.from(userIds).map((id) => ctx.db.get(id)));
    const userMap = new Map(
      users
        .filter((u): u is NonNullable<typeof u> => u !== null && u !== undefined)
        .map((u) => [u._id, u] as [Id<"users">, NonNullable<typeof u>])
    );

    return tickets.map((ticket) => ({
      ...ticket,
      user: ticket.userId ? userMap.get(ticket.userId) : null,
    }));
  },
});

// Get tickets for a specific user
export const getUserTickets = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return tickets.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get a single ticket with replies
export const getTicketWithReplies = query({
  args: {
    ticketId: v.id("tickets"),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      return null;
    }

    const replies = await ctx.db
      .query("ticketReplies")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .collect();

    // Get user info for replies
    const userIds = new Set(replies.map((r) => r.userId));
    const users = await Promise.all(Array.from(userIds).map((id) => ctx.db.get(id)));
    const userMap = new Map(
      users
        .filter((u): u is NonNullable<typeof u> => u !== null && u !== undefined)
        .map((u) => [u._id, u] as [Id<"users">, NonNullable<typeof u>])
    );

    const repliesWithUsers = replies
      .map((reply) => ({
        ...reply,
        user: userMap.get(reply.userId),
      }))
      .sort((a, b) => a.createdAt - b.createdAt);

    return {
      ...ticket,
      replies: repliesWithUsers,
    };
  },
});

// Reply to a ticket
export const replyToTicket = mutation({
  args: {
    ticketId: v.id("tickets"),
    userId: v.id("users"),
    message: v.string(),
    isAdminReply: v.boolean(),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new ConvexError("Ticket not found");
    }

    // Check permissions
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    const isAdmin = user.role === "admin";
    if (args.isAdminReply && !isAdmin) {
      throw new ConvexError("Only admins can create admin replies");
    }

    // Create reply
    const replyId = await ctx.db.insert("ticketReplies", {
      ticketId: args.ticketId,
      userId: args.userId,
      message: args.message,
      isAdminReply: args.isAdminReply,
      createdAt: Date.now(),
    });

    // Update ticket status
    let newStatus = ticket.status;
    if (args.isAdminReply && ticket.status === "open") {
      newStatus = "in_progress";
    }

    await ctx.db.patch(args.ticketId, {
      status: newStatus,
      updatedAt: Date.now(),
    });

    // Create notification for the other party
    const notificationUserId = args.isAdminReply ? ticket.userId : ticket.assignedTo;
    if (notificationUserId) {
      await ctx.scheduler.runAfter(0, internal.tickets.createNotification, {
        userId: notificationUserId,
        type: "ticket_reply",
        title: args.isAdminReply ? "Admin replied to your ticket" : "New reply on your ticket",
        message: args.message.substring(0, 100) + (args.message.length > 100 ? "..." : ""),
        relatedId: args.ticketId,
      });

      // Send email notification
      const user = await ctx.db.get(notificationUserId);
      if (user) {
        await ctx.scheduler.runAfter(0, internal.emails.sendTicketReplyEmail, {
          to: ticket.email,
          ticketSubject: ticket.subject,
          ticketId: args.ticketId,
          replyMessage: args.message,
          isAdminReply: args.isAdminReply,
          userName: ticket.name,
        });
      }
    }

    return replyId;
  },
});

// Update ticket status (admin only)
export const updateTicketStatus = mutation({
  args: {
    ticketId: v.id("tickets"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed"),
    ),
    assignedTo: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) {
      throw new ConvexError("Ticket not found");
    }

    const updates: {
      status: typeof args.status;
      updatedAt: number;
      assignedTo?: Id<"users">;
      resolvedAt?: number;
    } = {
      status: args.status,
      updatedAt: Date.now(),
    };

    if (args.assignedTo !== undefined) {
      updates.assignedTo = args.assignedTo;
    }

    if (args.status === "resolved" || args.status === "closed") {
      updates.resolvedAt = Date.now();
    }

    await ctx.db.patch(args.ticketId, updates);

    // Create notification for user
    if (ticket.userId) {
      await ctx.scheduler.runAfter(0, internal.tickets.createNotification, {
        userId: ticket.userId,
        type: "ticket_status_change",
        title: `Ticket ${args.status}`,
        message: `Your ticket "${ticket.subject}" status has been updated to ${args.status}`,
        relatedId: args.ticketId,
      });

      // Send email notification
      const user = await ctx.db.get(ticket.userId);
      if (user) {
        await ctx.scheduler.runAfter(0, internal.emails.sendTicketStatusChangeEmail, {
          to: ticket.email,
          ticketSubject: ticket.subject,
          ticketId: args.ticketId,
          status: args.status,
          userName: ticket.name,
        });
      }
    }
  },
});

// Internal mutation to create notification (called via scheduler)
export const createNotification = internalMutation({
  args: {
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
    relatedId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: args.type,
      title: args.title,
      message: args.message,
      relatedId: args.relatedId,
      isRead: false,
      createdAt: Date.now(),
    });
  },
});

