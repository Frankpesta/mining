import { render } from "@react-email/render";

import { EventNoticeEmail } from "@/emails/event-notice-email";
import { TicketReplyEmail } from "@/emails/ticket-reply-email";
import { TicketStatusEmail } from "@/emails/ticket-status-email";
import { getAppBaseUrl } from "@/lib/env";

import { getResendClient } from "./client";

const DEFAULT_FROM =
  process.env.RESEND_FROM_EMAIL ?? "blockhashpro <no-reply@blockhashpro.xyz>";

function getFrom() {
  return process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM;
}

function mergeAdminRecipients(payloadList: unknown): string[] {
  const extra =
    process.env.ADMIN_NOTIFICATION_EMAILS?.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean) ??
    [];
  const fromPayload = Array.isArray(payloadList)
    ? payloadList.filter((e): e is string => typeof e === "string" && e.includes("@"))
    : [];
  return [...new Set([...fromPayload, ...extra])];
}

function formatCrypto(crypto: string, amount: number): string {
  const stable = crypto === "USDT" || crypto === "USDC";
  const decimals = crypto === "BTC" ? 8 : crypto === "ETH" ? 6 : stable ? 2 : 6;
  const s = amount.toFixed(decimals).replace(/\.?0+$/, "");
  return `${s} ${crypto}`;
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

async function sendHtml(opts: {
  to: string;
  subject: string;
  html: string;
}) {
  const client = getResendClient();
  if (!client) {
    console.info(`[email] Skipped send to ${opts.to} — RESEND_API_KEY not set`);
    return;
  }
  await client.emails.send({
    from: getFrom(),
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
}

function withdrawalStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: "Pending review",
    approved: "Approved — processing",
    rejected: "Rejected",
    completed: "Completed",
    failed: "Failed",
  };
  return map[status] ?? status;
}

export async function handleEmailDispatch(kind: string, payload: Record<string, unknown>) {
  const siteUrl = getAppBaseUrl();
  const admins = mergeAdminRecipients(payload.adminRecipients);

  switch (kind) {
    case "deposit_submitted": {
      const amount = Number(payload.amount);
      const crypto = String(payload.crypto ?? "");
      const userEmail = String(payload.userEmail ?? "");
      const depositId = String(payload.depositId ?? "");

      if (userEmail) {
        const html = await render(
          EventNoticeEmail({
            siteUrl,
            preview: "We received your deposit request",
            title: "Deposit request received",
            intro:
              "We received your deposit and it is pending review. You will get another email when it is approved or rejected.",
            rows: [
              { label: "Amount", value: formatCrypto(crypto, amount) },
              { label: "Reference", value: depositId },
              ...(payload.txHash
                ? [{ label: "TX hash", value: String(payload.txHash) }]
                : []),
            ],
            cta: {
              href: `${siteUrl.replace(/\/$/, "")}/dashboard`,
              label: "Open dashboard",
            },
          }),
        );
        await sendHtml({
          to: userEmail,
          subject: `Deposit request received · blockhashpro`,
          html,
        });
      }

      for (const adminTo of admins) {
        const html = await render(
          EventNoticeEmail({
            siteUrl,
            variant: "admin",
            preview: `New deposit request · ${formatCrypto(crypto, amount)}`,
            title: "New deposit request",
            intro: "A user submitted a deposit that is awaiting review.",
            rows: [
              { label: "User", value: userEmail || "—" },
              { label: "Amount", value: formatCrypto(crypto, amount) },
              { label: "Deposit ID", value: depositId },
              ...(payload.txHash
                ? [{ label: "TX hash", value: String(payload.txHash) }]
                : []),
            ],
            cta: {
              href: `${siteUrl.replace(/\/$/, "")}/admin/deposits`,
              label: "Review deposits",
            },
          }),
        );
        await sendHtml({
          to: adminTo,
          subject: `[Admin] New deposit · ${formatCrypto(crypto, amount)}`,
          html,
        });
      }
      break;
    }

    case "deposit_processed": {
      const status = String(payload.status ?? "");
      const amount = Number(payload.amount);
      const crypto = String(payload.crypto ?? "");
      const userEmail = String(payload.userEmail ?? "");
      const depositId = String(payload.depositId ?? "");
      const adminNote = payload.adminNote ? String(payload.adminNote) : "";
      const depositSubject =
        status === "approved"
          ? String(payload.emailDepositSubject ?? "Deposit approved")
          : "Deposit request updated";
      const depositBody =
        status === "approved"
          ? String(
              payload.emailDepositBody ??
                "Your deposit has been approved and credited to your platform wallet.",
            )
          : `Your deposit request was not approved.${adminNote ? ` Note: ${adminNote}` : ""}`;

      if (userEmail) {
        const html = await render(
          EventNoticeEmail({
            siteUrl,
            preview:
              status === "approved"
                ? "Your deposit was approved"
                : "Update on your deposit request",
            title:
              status === "approved" ? depositSubject : "Deposit request not approved",
            intro: depositBody,
            rows: [
              { label: "Amount", value: formatCrypto(crypto, amount) },
              { label: "Reference", value: depositId },
              { label: "Status", value: status === "approved" ? "Approved" : "Rejected" },
              ...(status === "rejected" && adminNote
                ? [{ label: "Reason", value: adminNote }]
                : []),
            ],
            cta: {
              href: `${siteUrl.replace(/\/$/, "")}/dashboard`,
              label: "Go to dashboard",
            },
          }),
        );
        await sendHtml({
          to: userEmail,
          subject:
            status === "approved"
              ? depositSubject
              : "Deposit request not approved · blockhashpro",
          html,
        });
      }

      for (const adminTo of admins) {
        const html = await render(
          EventNoticeEmail({
            siteUrl,
            variant: "admin",
            preview: `Deposit ${status} · ${depositId}`,
            title: `Deposit ${status}`,
            intro: "A deposit request was processed.",
            rows: [
              { label: "User", value: userEmail || "—" },
              { label: "Amount", value: formatCrypto(crypto, amount) },
              { label: "Deposit ID", value: depositId },
              { label: "Outcome", value: status === "approved" ? "Approved" : "Rejected" },
              ...(adminNote ? [{ label: "Admin note", value: adminNote }] : []),
            ],
            cta: {
              href: `${siteUrl.replace(/\/$/, "")}/admin/deposits`,
              label: "Open admin deposits",
            },
          }),
        );
        await sendHtml({
          to: adminTo,
          subject: `[Admin] Deposit ${status} · ${formatCrypto(crypto, amount)}`,
          html,
        });
      }
      break;
    }

    case "withdrawal_requested": {
      const amount = Number(payload.amount);
      const crypto = String(payload.crypto ?? "");
      const userEmail = String(payload.userEmail ?? "");
      const withdrawalId = String(payload.withdrawalId ?? "");
      const destination = String(payload.destinationAddress ?? "");
      const balanceSource = String(payload.balanceSource ?? "platform");

      if (userEmail) {
        const html = await render(
          EventNoticeEmail({
            siteUrl,
            preview: "Withdrawal request received",
            title: "Withdrawal request received",
            intro:
              "We received your withdrawal request. Our team will review it shortly. Funds remain reserved until processing completes.",
            rows: [
              { label: "Amount", value: formatCrypto(crypto, amount) },
              { label: "Wallet", value: balanceSource === "mining" ? "Mining earnings" : "Platform" },
              { label: "Destination", value: destination },
              { label: "Reference", value: withdrawalId },
            ],
            cta: {
              href: `${siteUrl.replace(/\/$/, "")}/dashboard/withdraw`,
              label: "Withdrawal history",
            },
          }),
        );
        await sendHtml({
          to: userEmail,
          subject: `Withdrawal requested · ${formatCrypto(crypto, amount)}`,
          html,
        });
      }

      for (const adminTo of admins) {
        const html = await render(
          EventNoticeEmail({
            siteUrl,
            variant: "admin",
            preview: `Withdrawal queued · ${formatCrypto(crypto, amount)}`,
            title: "New withdrawal request",
            intro: "A user submitted a withdrawal.",
            rows: [
              { label: "User", value: userEmail || "—" },
              { label: "Amount", value: formatCrypto(crypto, amount) },
              { label: "Wallet", value: balanceSource === "mining" ? "Mining" : "Platform" },
              { label: "Destination", value: destination },
              { label: "Withdrawal ID", value: withdrawalId },
            ],
            cta: {
              href: `${siteUrl.replace(/\/$/, "")}/admin/withdrawals`,
              label: "Review withdrawals",
            },
          }),
        );
        await sendHtml({
          to: adminTo,
          subject: `[Admin] New withdrawal · ${formatCrypto(crypto, amount)}`,
          html,
        });
      }
      break;
    }

    case "withdrawal_status": {
      const status = String(payload.status ?? "");
      const amount = Number(payload.amount);
      const crypto = String(payload.crypto ?? "");
      const userEmail = String(payload.userEmail ?? "");
      const withdrawalId = String(payload.withdrawalId ?? "");
      const adminNote = payload.adminNote ? String(payload.adminNote) : "";
      const txHash = payload.txHash ? String(payload.txHash) : "";
      const templateSubject = String(
        payload.emailWithdrawalSubject ?? "Withdrawal update",
      );
      const templateBody = String(
        payload.emailWithdrawalBody ??
          "There is an update regarding your withdrawal request.",
      );

      const userSubject =
        status === "completed"
          ? templateSubject
          : `Withdrawal ${withdrawalStatusLabel(status)} · blockhashpro`;

      const userIntro =
        status === "completed"
          ? templateBody
          : `Your withdrawal status is now: ${withdrawalStatusLabel(status)}.`;

      if (userEmail) {
        const rows: { label: string; value: string }[] = [
          { label: "Amount", value: formatCrypto(crypto, amount) },
          { label: "Reference", value: withdrawalId },
          { label: "Status", value: withdrawalStatusLabel(status) },
        ];
        if (txHash) rows.push({ label: "Transaction", value: txHash });
        if (adminNote) {
          rows.push({ label: "Note from our team", value: adminNote });
        }

        const html = await render(
          EventNoticeEmail({
            siteUrl,
            preview: userSubject,
            title: "Withdrawal update",
            intro: userIntro,
            rows,
            cta: {
              href: `${siteUrl.replace(/\/$/, "")}/dashboard/withdraw`,
              label: "View withdrawals",
            },
          }),
        );
        await sendHtml({
          to: userEmail,
          subject: userSubject,
          html,
        });
      }

      for (const adminTo of admins) {
        const html = await render(
          EventNoticeEmail({
            siteUrl,
            variant: "admin",
            preview: `Withdrawal ${status}`,
            title: `Withdrawal ${status}`,
            intro: "Withdrawal status was updated.",
            rows: [
              { label: "User", value: userEmail || "—" },
              { label: "Amount", value: formatCrypto(crypto, amount) },
              { label: "ID", value: withdrawalId },
              { label: "Status", value: withdrawalStatusLabel(status) },
              ...(txHash ? [{ label: "TX hash", value: txHash }] : []),
              ...(adminNote ? [{ label: "Admin note", value: adminNote }] : []),
            ],
            cta: {
              href: `${siteUrl.replace(/\/$/, "")}/admin/withdrawals`,
              label: "Admin withdrawals",
            },
          }),
        );
        await sendHtml({
          to: adminTo,
          subject: `[Admin] Withdrawal ${status} · ${formatCrypto(crypto, amount)}`,
          html,
        });
      }
      break;
    }

    case "plan_purchased": {
      const userEmail = String(payload.userEmail ?? "");
      const planName = String(payload.planName ?? "Plan");
      const purchaseAmount = Number(payload.purchaseAmount);
      const coin = String(payload.coin ?? "");
      const durationDays = Number(payload.durationDays ?? 0);
      const endTime = Number(payload.endTime ?? 0);
      const fundingSource = String(payload.fundingSource ?? "platform");
      const operationId = String(payload.operationId ?? "");
      const hashRate =
        payload.hashRate !== undefined ? Number(payload.hashRate) : 0;
      const hashRateUnit = String(payload.hashRateUnit ?? "");

      const endDate =
        endTime > 0
          ? new Date(endTime).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "—";

      if (userEmail) {
        const html = await render(
          EventNoticeEmail({
            siteUrl,
            preview: `Mining plan started · ${planName}`,
            title: "Mining plan active",
            intro: `Your purchase is confirmed. The contract runs until ${endDate}.`,
            rows: [
              { label: "Plan", value: planName },
              { label: "Principal (USD)", value: formatUsd(purchaseAmount) },
              { label: "Reward asset", value: coin },
              { label: "Hash rate", value: `${hashRate} ${hashRateUnit}` },
              { label: "Duration", value: `${durationDays} days` },
              { label: "Contract ends", value: endDate },
              {
                label: "Funded from",
                value:
                  fundingSource === "mining"
                    ? "Mined earnings (reinvest)"
                    : "Platform wallet",
              },
              { label: "Operation ID", value: operationId },
            ],
            cta: {
              href: `${siteUrl.replace(/\/$/, "")}/dashboard/mining`,
              label: "View mining",
            },
          }),
        );
        await sendHtml({
          to: userEmail,
          subject: `Plan started · ${planName} · blockhashpro`,
          html,
        });
      }

      for (const adminTo of admins) {
        const html = await render(
          EventNoticeEmail({
            siteUrl,
            variant: "admin",
            preview: `Plan purchased · ${userEmail}`,
            title: "User purchased a mining plan",
            intro: "A user started a new mining operation.",
            rows: [
              { label: "User", value: userEmail || "—" },
              { label: "Plan", value: planName },
              { label: "Principal (USD)", value: formatUsd(purchaseAmount) },
              { label: "Coin", value: coin },
              { label: "Operation ID", value: operationId },
              {
                label: "Funded from",
                value: fundingSource === "mining" ? "Mining" : "Platform",
              },
            ],
            cta: {
              href: `${siteUrl.replace(/\/$/, "")}/admin/mining-operations`,
              label: "Mining operations",
            },
          }),
        );
        await sendHtml({
          to: adminTo,
          subject: `[Admin] Plan purchase · ${formatUsd(purchaseAmount)} · ${userEmail || "user"}`,
          html,
        });
      }
      break;
    }

    case "mining_operation_completed": {
      const userEmail = String(payload.userEmail ?? "");
      const planName = String(payload.planName ?? "Mining plan");
      const purchaseAmount = Number(payload.purchaseAmount);
      const coin = String(payload.coin ?? "");
      const totalMined = Number(payload.totalMined ?? 0);
      const endTime = Number(payload.endTime ?? 0);
      const operationId = String(payload.operationId ?? "");

      const endDate =
        endTime > 0
          ? new Date(endTime).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "—";

      if (userEmail) {
        const html = await render(
          EventNoticeEmail({
            siteUrl,
            preview: "Your mining contract has ended",
            title: "Mining plan completed",
            intro:
              "The scheduled duration for this contract has finished. You can start a new plan from Mining packages anytime.",
            rows: [
              { label: "Plan", value: planName },
              { label: "Principal (USD)", value: formatUsd(purchaseAmount) },
              { label: "Reward asset", value: coin },
              { label: "Tracked total mined (USD)", value: formatUsd(totalMined) },
              { label: "Ended", value: endDate },
              { label: "Operation ID", value: operationId },
            ],
            cta: {
              href: `${siteUrl.replace(/\/$/, "")}/dashboard/mining-packages`,
              label: "Browse plans",
            },
          }),
        );
        await sendHtml({
          to: userEmail,
          subject: `Mining plan completed · ${planName} · blockhashpro`,
          html,
        });
      }

      for (const adminTo of admins) {
        const html = await render(
          EventNoticeEmail({
            siteUrl,
            variant: "admin",
            preview: `Contract completed · ${operationId}`,
            title: "Mining contract completed",
            intro: "A mining operation reached its scheduled end date.",
            rows: [
              { label: "User", value: userEmail || "—" },
              { label: "Plan", value: planName },
              { label: "Principal (USD)", value: formatUsd(purchaseAmount) },
              { label: "Operation ID", value: operationId },
            ],
            cta: {
              href: `${siteUrl.replace(/\/$/, "")}/admin/mining-operations`,
              label: "Admin mining",
            },
          }),
        );
        await sendHtml({
          to: adminTo,
          subject: `[Admin] Mining completed · ${planName} · ${userEmail || "user"}`,
          html,
        });
      }
      break;
    }

    case "ticket_created": {
      const ticketEmail = String(payload.ticketEmail ?? "");
      const name = String(payload.name ?? "");
      const subject = String(payload.subject ?? "");
      const ticketId = String(payload.ticketId ?? "");
      const message = String(payload.message ?? "").slice(0, 4000);

      for (const adminTo of admins) {
        const html = await render(
          EventNoticeEmail({
            siteUrl,
            variant: "admin",
            preview: `New ticket: ${subject}`,
            title: "New support ticket",
            intro: "A new ticket was opened from the site.",
            rows: [
              { label: "From", value: ticketEmail },
              { label: "Name", value: name || "—" },
              { label: "Subject", value: subject },
              { label: "Ticket ID", value: ticketId },
              { label: "Message", value: message || "—" },
            ],
            cta: {
              href: `${siteUrl.replace(/\/$/, "")}/admin/tickets`,
              label: "Manage tickets",
            },
          }),
        );
        await sendHtml({
          to: adminTo,
          subject: `[Admin] Ticket: ${subject}`,
          html,
        });
      }

      if (ticketEmail) {
        const html = await render(
          EventNoticeEmail({
            siteUrl,
            preview: "We received your message",
            title: "We received your request",
            intro:
              "Thanks for contacting blockhashpro. Our team will respond as soon as possible.",
            rows: [
              { label: "Subject", value: subject },
              { label: "Ticket ID", value: ticketId },
            ],
            cta: {
              href: `${siteUrl.replace(/\/$/, "")}/dashboard/tickets/${ticketId}`,
              label: "View ticket",
            },
          }),
        );
        await sendHtml({
          to: ticketEmail,
          subject: `We received your message · ${subject}`,
          html,
        });
      }
      break;
    }

    case "ticket_reply": {
      const to = String(payload.to ?? "");
      const ticketSubject = String(payload.ticketSubject ?? "");
      const ticketId = String(payload.ticketId ?? "");
      const replyMessage = String(payload.replyMessage ?? "");
      const isAdminReply = Boolean(payload.isAdminReply);
      const userName = payload.userName ? String(payload.userName) : undefined;
      const alsoNotifyAdmins = Boolean(payload.alsoNotifyAdmins);

      if (to) {
        const html = await render(
          TicketReplyEmail({
            siteUrl,
            ticketSubject,
            ticketId,
            replyMessage,
            isAdminReply,
            userName,
            variant: "default",
          }),
        );
        await sendHtml({
          to,
          subject: isAdminReply
            ? `Re: ${ticketSubject} · blockhashpro`
            : `New reply · ${ticketSubject}`,
          html,
        });
      }

      if (alsoNotifyAdmins && admins.length > 0) {
        for (const adminTo of admins) {
          if (adminTo === to) continue;
          const html = await render(
            TicketReplyEmail({
              siteUrl,
              ticketSubject,
              ticketId,
              replyMessage,
              isAdminReply,
              userName,
              variant: "admin",
            }),
          );
          await sendHtml({
            to: adminTo,
            subject: `[Admin] Ticket reply · ${ticketSubject}`,
            html,
          });
        }
      }
      break;
    }

    case "ticket_status": {
      const to = String(payload.to ?? "");
      const ticketSubject = String(payload.ticketSubject ?? "");
      const ticketId = String(payload.ticketId ?? "");
      const status = String(payload.status ?? "");
      const userName = payload.userName ? String(payload.userName) : undefined;
      const alsoNotifyAdmins = Boolean(payload.alsoNotifyAdmins);

      if (to) {
        const html = await render(
          TicketStatusEmail({
            siteUrl,
            ticketSubject,
            ticketId,
            status,
            userName,
            variant: "default",
          }),
        );
        await sendHtml({
          to,
          subject: `Ticket update · ${ticketSubject}`,
          html,
        });
      }

      if (alsoNotifyAdmins && admins.length > 0) {
        for (const adminTo of admins) {
          const html = await render(
            TicketStatusEmail({
              siteUrl,
              ticketSubject,
              ticketId,
              status,
              userName,
              variant: "admin",
            }),
          );
          await sendHtml({
            to: adminTo,
            subject: `[Admin] Ticket ${status} · ${ticketSubject}`,
            html,
          });
        }
      }
      break;
    }

    default:
      console.warn(`[email] Unknown dispatch kind: ${kind}`);
  }
}
