import { internalAction } from "./_generated/server";
import { v } from "convex/values";

import { api, internal } from "./_generated/api";

/** Next.js app URL for /api/emails/dispatch. Set in Convex: EMAIL_DISPATCH_BASE_URL or NEXT_PUBLIC_APP_URL (production site, not localhost). */
function emailDispatchBaseUrl() {
  const a = process.env.EMAIL_DISPATCH_BASE_URL?.replace(/\/$/, "");
  const b = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return a || b || "https://blockhashpro.xyz";
}

async function postDispatch(kind: string, payload: Record<string, unknown>) {
  const baseUrl = emailDispatchBaseUrl();
  const secret = process.env.EMAIL_DISPATCH_SECRET;
  if (!secret) {
    console.warn(
      "[email] EMAIL_DISPATCH_SECRET is not set in Convex — skipping email dispatch",
    );
    return;
  }

  const response = await fetch(`${baseUrl}/api/emails/dispatch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({ kind, payload }),
  });

  if (!response.ok) {
    console.error("[email] Dispatch failed:", await response.text());
  }
}

export const sendTicketReplyEmail = internalAction({
  args: {
    to: v.optional(v.string()),
    ticketSubject: v.string(),
    ticketId: v.string(),
    replyMessage: v.string(),
    isAdminReply: v.boolean(),
    userName: v.optional(v.string()),
    alsoNotifyAdmins: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admins = await ctx.runQuery(internal.users.listAdminEmails, {});
    await postDispatch("ticket_reply", {
      to: args.to ?? "",
      ticketSubject: args.ticketSubject,
      ticketId: args.ticketId,
      replyMessage: args.replyMessage,
      isAdminReply: args.isAdminReply,
      userName: args.userName,
      alsoNotifyAdmins: args.alsoNotifyAdmins ?? false,
      adminRecipients: admins,
    });
  },
});

export const sendTicketStatusChangeEmail = internalAction({
  args: {
    to: v.string(),
    ticketSubject: v.string(),
    ticketId: v.string(),
    status: v.string(),
    userName: v.optional(v.string()),
    alsoNotifyAdmins: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admins = await ctx.runQuery(internal.users.listAdminEmails, {});
    await postDispatch("ticket_status", {
      to: args.to,
      ticketSubject: args.ticketSubject,
      ticketId: args.ticketId,
      status: args.status,
      userName: args.userName,
      alsoNotifyAdmins: args.alsoNotifyAdmins ?? true,
      adminRecipients: admins,
    });
  },
});

export const sendDepositSubmittedEmail = internalAction({
  args: { depositId: v.id("deposits") },
  handler: async (ctx, args) => {
    const [admins, deposit] = await Promise.all([
      ctx.runQuery(internal.users.listAdminEmails, {}),
      ctx.runQuery(internal.deposits.getDepositById, {
        depositId: args.depositId,
      }),
    ]);
    if (!deposit) return;
    const user = await ctx.runQuery(internal.deposits.getUserById, {
      userId: deposit.userId,
    });
    await postDispatch("deposit_submitted", {
      depositId: args.depositId,
      amount: deposit.amount,
      crypto: deposit.crypto,
      txHash: deposit.txHash,
      userEmail: user?.email ?? "",
      adminRecipients: admins,
    });
  },
});

export const sendDepositProcessedEmail = internalAction({
  args: {
    depositId: v.id("deposits"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    adminNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const [admins, deposit, templates] = await Promise.all([
      ctx.runQuery(internal.users.listAdminEmails, {}),
      ctx.runQuery(internal.deposits.getDepositById, {
        depositId: args.depositId,
      }),
      ctx.runQuery(internal.platformSettings.getEmailTemplateStrings, {}),
    ]);
    if (!deposit) return;
    const user = await ctx.runQuery(internal.deposits.getUserById, {
      userId: deposit.userId,
    });
    await postDispatch("deposit_processed", {
      depositId: args.depositId,
      status: args.status,
      amount: deposit.amount,
      crypto: deposit.crypto,
      userEmail: user?.email ?? "",
      adminNote: args.adminNote,
      emailDepositSubject: templates.emailDepositSubject,
      emailDepositBody: templates.emailDepositBody,
      adminRecipients: admins,
    });
  },
});

export const sendWithdrawalRequestedEmail = internalAction({
  args: { withdrawalId: v.id("withdrawals") },
  handler: async (ctx, args) => {
    const [admins, withdrawal] = await Promise.all([
      ctx.runQuery(internal.users.listAdminEmails, {}),
      ctx.runQuery(internal.withdrawals.getWithdrawalById, {
        withdrawalId: args.withdrawalId,
      }),
    ]);
    if (!withdrawal) return;
    const user = await ctx.runQuery(internal.deposits.getUserById, {
      userId: withdrawal.userId,
    });
    await postDispatch("withdrawal_requested", {
      withdrawalId: args.withdrawalId,
      amount: withdrawal.amount,
      crypto: withdrawal.crypto,
      destinationAddress: withdrawal.destinationAddress,
      balanceSource: withdrawal.balanceSource ?? "platform",
      userEmail: user?.email ?? "",
      adminRecipients: admins,
    });
  },
});

export const sendWithdrawalStatusEmail = internalAction({
  args: {
    withdrawalId: v.id("withdrawals"),
    status: v.union(
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    adminNote: v.optional(v.string()),
    txHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const [admins, withdrawal, templates] = await Promise.all([
      ctx.runQuery(internal.users.listAdminEmails, {}),
      ctx.runQuery(internal.withdrawals.getWithdrawalById, {
        withdrawalId: args.withdrawalId,
      }),
      ctx.runQuery(internal.platformSettings.getEmailTemplateStrings, {}),
    ]);
    if (!withdrawal) return;
    const user = await ctx.runQuery(internal.deposits.getUserById, {
      userId: withdrawal.userId,
    });
    await postDispatch("withdrawal_status", {
      withdrawalId: args.withdrawalId,
      status: args.status,
      amount: withdrawal.amount,
      crypto: withdrawal.crypto,
      userEmail: user?.email ?? "",
      adminNote: args.adminNote,
      txHash: args.txHash,
      emailWithdrawalSubject: templates.emailWithdrawalSubject,
      emailWithdrawalBody: templates.emailWithdrawalBody,
      adminRecipients: admins,
    });
  },
});

export const sendTicketCreatedEmail = internalAction({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    const [admins, ticket] = await Promise.all([
      ctx.runQuery(internal.users.listAdminEmails, {}),
      ctx.runQuery(internal.tickets.getTicketForEmail, {
        ticketId: args.ticketId,
      }),
    ]);
    if (!ticket) return;
    await postDispatch("ticket_created", {
      ticketId: args.ticketId,
      ticketEmail: ticket.email,
      name: ticket.name,
      subject: ticket.subject,
      message: ticket.message,
      adminRecipients: admins,
    });
  },
});

export const sendPlanPurchasedEmail = internalAction({
  args: {
    operationId: v.id("miningOperations"),
    fundingSource: v.optional(
      v.union(v.literal("platform"), v.literal("mining")),
    ),
  },
  handler: async (ctx, args) => {
    const op = await ctx.runQuery(api.miningOperations.getMiningOperationById, {
      operationId: args.operationId,
    });
    if (!op) return;
    const [plan, user, admins] = await Promise.all([
      ctx.runQuery(api.plans.getPlanById, { planId: op.planId }),
      ctx.runQuery(internal.deposits.getUserById, { userId: op.userId }),
      ctx.runQuery(internal.users.listAdminEmails, {}),
    ]);
    if (!plan) return;
    const funding = args.fundingSource ?? "platform";
    await postDispatch("plan_purchased", {
      operationId: args.operationId,
      userEmail: user?.email ?? "",
      planName: plan.name,
      purchaseAmount: op.purchaseAmount,
      coin: op.coin,
      durationDays: plan.duration,
      endTime: op.endTime,
      hashRate: op.hashRate,
      hashRateUnit: op.hashRateUnit,
      fundingSource: funding,
      adminRecipients: admins,
    });
  },
});

export const sendMiningOperationRenewedEmail = internalAction({
  args: { operationId: v.id("miningOperations") },
  handler: async (ctx, args) => {
    const op = await ctx.runQuery(api.miningOperations.getMiningOperationById, {
      operationId: args.operationId,
    });
    if (!op) return;
    const [plan, user, admins] = await Promise.all([
      ctx.runQuery(api.plans.getPlanById, { planId: op.planId }),
      ctx.runQuery(internal.deposits.getUserById, { userId: op.userId }),
      ctx.runQuery(internal.users.listAdminEmails, {}),
    ]);
    if (!plan) return;
    await postDispatch("mining_operation_renewed", {
      operationId: args.operationId,
      userEmail: user?.email ?? "",
      planName: plan.name,
      purchaseAmount: op.purchaseAmount,
      coin: op.coin,
      durationDays: plan.duration,
      endTime: op.endTime,
      hashRate: op.hashRate,
      hashRateUnit: op.hashRateUnit,
      adminRecipients: admins,
    });
  },
});

export const sendMiningOperationCompletedEmail = internalAction({
  args: { operationId: v.id("miningOperations") },
  handler: async (ctx, args) => {
    const op = await ctx.runQuery(api.miningOperations.getMiningOperationById, {
      operationId: args.operationId,
    });
    if (!op) return;
    const [plan, user, admins] = await Promise.all([
      ctx.runQuery(api.plans.getPlanById, { planId: op.planId }),
      ctx.runQuery(internal.deposits.getUserById, { userId: op.userId }),
      ctx.runQuery(internal.users.listAdminEmails, {}),
    ]);
    await postDispatch("mining_operation_completed", {
      operationId: args.operationId,
      userEmail: user?.email ?? "",
      planName: plan?.name ?? "Mining plan",
      purchaseAmount: op.purchaseAmount,
      coin: op.coin,
      totalMined: op.totalMined,
      endTime: op.endTime,
      adminRecipients: admins,
    });
  },
});
