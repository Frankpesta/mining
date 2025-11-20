import { getAppBaseUrl } from "@/lib/env";

import { getResendClient } from "./client";

const DEFAULT_FROM_EMAIL = "blockhashpro Support <support@blockhashpro.xyz>";

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM_EMAIL;
}

export async function sendTicketReplyEmail({
  to,
  ticketSubject,
  ticketId,
  replyMessage,
  isAdminReply,
  userName,
}: {
  to: string;
  ticketSubject: string;
  ticketId: string;
  replyMessage: string;
  isAdminReply: boolean;
  userName?: string;
}) {
  const client = getResendClient();
  const ticketUrl = `${getAppBaseUrl()}/dashboard/tickets/${ticketId}`;

  if (!client) {
    console.info(
      `[email] Ticket reply email skipped for ${to}. Configure RESEND_API_KEY to enable delivery.`,
    );
    console.info(`Ticket URL: ${ticketUrl}`);
    return;
  }

  const subject = isAdminReply
    ? `Re: ${ticketSubject} - blockhashpro Support`
    : `New reply on ticket: ${ticketSubject}`;

  await client.emails.send({
    from: getFromEmail(),
    to,
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">blockhashpro Support</h2>
        </div>
        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <h3 style="color: #1f2937; margin-top: 0;">${isAdminReply ? "Admin Response" : "New Reply"}</h3>
          <p style="color: #4b5563;">${userName ? `Hi ${userName},` : "Hello,"}</p>
          <p style="color: #4b5563;">
            ${isAdminReply ? "Our support team has replied to your ticket:" : "You have a new reply on your ticket:"}
          </p>
          <div style="background-color: white; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; color: #1f2937; white-space: pre-wrap;">${replyMessage}</p>
          </div>
          <div style="margin-top: 30px;">
            <a href="${ticketUrl}" target="_blank" style="background-color:#2563eb;padding:12px 24px;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
              View Ticket
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Ticket ID: ${ticketId}<br/>
            Subject: ${ticketSubject}
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendTicketStatusChangeEmail({
  to,
  ticketSubject,
  ticketId,
  status,
  userName,
}: {
  to: string;
  ticketSubject: string;
  ticketId: string;
  status: string;
  userName?: string;
}) {
  const client = getResendClient();
  const ticketUrl = `${getAppBaseUrl()}/dashboard/tickets/${ticketId}`;

  if (!client) {
    console.info(
      `[email] Ticket status change email skipped for ${to}. Configure RESEND_API_KEY to enable delivery.`,
    );
    console.info(`Ticket URL: ${ticketUrl}`);
    return;
  }

  const statusLabels: Record<string, string> = {
    open: "Opened",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
  };

  await client.emails.send({
    from: getFromEmail(),
    to,
    subject: `Ticket ${statusLabels[status] || status}: ${ticketSubject}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">blockhashpro Support</h2>
        </div>
        <div style="background-color: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px;">
          <h3 style="color: #1f2937; margin-top: 0;">Ticket Status Updated</h3>
          <p style="color: #4b5563;">${userName ? `Hi ${userName},` : "Hello,"}</p>
          <p style="color: #4b5563;">
            Your ticket status has been updated to <strong>${statusLabels[status] || status}</strong>.
          </p>
          <div style="margin-top: 30px;">
            <a href="${ticketUrl}" target="_blank" style="background-color:#2563eb;padding:12px 24px;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;display:inline-block;">
              View Ticket
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Ticket ID: ${ticketId}<br/>
            Subject: ${ticketSubject}
          </p>
        </div>
      </div>
    `,
  });
}

