import { Button, Heading, Section, Text } from "@react-email/components";
import * as React from "react";

import { EmailLayout } from "./email-layout";

export type TicketReplyEmailProps = {
  siteUrl: string;
  ticketSubject: string;
  ticketId: string;
  replyMessage: string;
  isAdminReply: boolean;
  userName?: string;
  variant?: "default" | "admin";
};

export function TicketReplyEmail({
  siteUrl,
  ticketSubject,
  ticketId,
  replyMessage,
  isAdminReply,
  userName,
  variant = "default",
}: TicketReplyEmailProps) {
  const ticketUrl = `${siteUrl.replace(/\/$/, "")}/dashboard/tickets/${ticketId}`;
  const preview = isAdminReply
    ? `Support replied: ${ticketSubject}`
    : `New reply on: ${ticketSubject}`;

  return (
    <EmailLayout preview={preview} variant={variant} siteUrl={siteUrl}>
      <Heading style={h2}>
        {isAdminReply ? "Support response" : "New reply on your ticket"}
      </Heading>
      <Text style={lead}>
        {userName ? `Hi ${userName},` : "Hello,"}{" "}
        {isAdminReply
          ? "Our team has replied to your support ticket."
          : "There is a new message on this ticket."}
      </Text>
      <Section style={quote}>
        <Text style={quoteText}>{replyMessage}</Text>
      </Section>
      <Section style={{ marginTop: "24px", textAlign: "center" as const }}>
        <Button href={ticketUrl} style={btn}>
          View conversation
        </Button>
      </Section>
      <Text style={meta}>
        Ticket · {ticketSubject}
        <br />
        Reference · {ticketId}
      </Text>
    </EmailLayout>
  );
}

const h2 = {
  color: "#0f172a",
  fontSize: "20px",
  fontWeight: "700",
  margin: "0 0 14px",
};

const lead = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 18px",
};

const quote = {
  backgroundColor: "#f8fafc",
  borderLeft: "4px solid #6366f1",
  borderRadius: "0 8px 8px 0",
  padding: "16px 18px",
};

const quoteText = {
  color: "#1e293b",
  fontSize: "14px",
  lineHeight: "1.65",
  margin: "0",
  whiteSpace: "pre-wrap" as const,
};

const btn = {
  backgroundColor: "#4f46e5",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  padding: "12px 28px",
  textDecoration: "none",
};

const meta = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "1.55",
  margin: "28px 0 0",
};
