import { internalAction } from "./_generated/server";
import { v } from "convex/values";

export const sendTicketReplyEmail = internalAction({
  args: {
    to: v.string(),
    ticketSubject: v.string(),
    ticketId: v.string(),
    replyMessage: v.string(),
    isAdminReply: v.boolean(),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Call Next.js API route to send email via Resend
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/emails/ticket-reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: args.to,
        ticketSubject: args.ticketSubject,
        ticketId: args.ticketId,
        replyMessage: args.replyMessage,
        isAdminReply: args.isAdminReply,
        userName: args.userName,
      }),
    });

    if (!response.ok) {
      console.error("Failed to send ticket reply email:", await response.text());
    }
  },
});

export const sendTicketStatusChangeEmail = internalAction({
  args: {
    to: v.string(),
    ticketSubject: v.string(),
    ticketId: v.string(),
    status: v.string(),
    userName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/emails/ticket-status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: args.to,
        ticketSubject: args.ticketSubject,
        ticketId: args.ticketId,
        status: args.status,
        userName: args.userName,
      }),
    });

    if (!response.ok) {
      console.error("Failed to send ticket status change email:", await response.text());
    }
  },
});

