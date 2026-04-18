import { Button, Heading, Text } from "@react-email/components";
import * as React from "react";

import { EmailLayout } from "./email-layout";

const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
};

export type TicketStatusEmailProps = {
  siteUrl: string;
  ticketSubject: string;
  ticketId: string;
  status: string;
  userName?: string;
  variant?: "default" | "admin";
};

export function TicketStatusEmail({
  siteUrl,
  ticketSubject,
  ticketId,
  status,
  userName,
  variant = "default",
}: TicketStatusEmailProps) {
  const ticketUrl = `${siteUrl.replace(/\/$/, "")}/dashboard/tickets/${ticketId}`;
  const label = STATUS_LABELS[status] ?? status;
  const preview = `Ticket status: ${label}`;

  return (
    <EmailLayout preview={preview} variant={variant} siteUrl={siteUrl}>
      <Heading style={h2}>Ticket status updated</Heading>
      <Text style={lead}>
        {userName ? `Hi ${userName},` : "Hello,"} Your ticket status is now{" "}
        <strong style={{ color: "#0f172a" }}>{label}</strong>.
      </Text>
      <Text style={meta}>
        Subject · {ticketSubject}
        <br />
        Reference · {ticketId}
      </Text>
      <Button href={ticketUrl} style={btn}>
        Open ticket
      </Button>
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
  lineHeight: "1.65",
  margin: "0 0 18px",
};

const meta = {
  color: "#64748b",
  fontSize: "13px",
  lineHeight: "1.55",
  margin: "0 0 22px",
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
