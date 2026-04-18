import { handleEmailDispatch } from "./notifications";

/** Used by `/api/emails/ticket-*` routes (secured by EMAIL_DISPATCH_SECRET). */
export async function sendTicketReplyEmail({
  to,
  ticketSubject,
  ticketId,
  replyMessage,
  isAdminReply,
  userName,
  alsoNotifyAdmins,
}: {
  to: string;
  ticketSubject: string;
  ticketId: string;
  replyMessage: string;
  isAdminReply: boolean;
  userName?: string;
  alsoNotifyAdmins?: boolean;
}) {
  await handleEmailDispatch("ticket_reply", {
    to,
    ticketSubject,
    ticketId,
    replyMessage,
    isAdminReply,
    userName,
    alsoNotifyAdmins: alsoNotifyAdmins ?? false,
    adminRecipients: [],
  });
}

export async function sendTicketStatusChangeEmail({
  to,
  ticketSubject,
  ticketId,
  status,
  userName,
  alsoNotifyAdmins,
}: {
  to: string;
  ticketSubject: string;
  ticketId: string;
  status: string;
  userName?: string;
  alsoNotifyAdmins?: boolean;
}) {
  await handleEmailDispatch("ticket_status", {
    to,
    ticketSubject,
    ticketId,
    status,
    userName,
    alsoNotifyAdmins: alsoNotifyAdmins ?? true,
    adminRecipients: [],
  });
}
