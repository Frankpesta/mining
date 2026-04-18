import { Button, Heading, Hr, Section, Text } from "@react-email/components";
import * as React from "react";

import { EmailLayout, type EmailLayoutProps } from "./email-layout";

export type EventDetailRow = { label: string; value: string };

export type EventNoticeEmailProps = {
  preview: string;
  title: string;
  intro?: string;
  rows: EventDetailRow[];
  cta?: { href: string; label: string };
  siteUrl: string;
  variant?: EmailLayoutProps["variant"];
};

export function EventNoticeEmail({
  preview,
  title,
  intro,
  rows,
  cta,
  siteUrl,
  variant = "default",
}: EventNoticeEmailProps) {
  return (
    <EmailLayout preview={preview} variant={variant} siteUrl={siteUrl}>
      <Heading style={h2}>{title}</Heading>
      {intro ? (
        <Text style={lead}>{intro}</Text>
      ) : null}
      <Section style={card}>
        {rows.map((row, i) => (
          <Section key={i} style={rowStyle}>
            <Text style={label}>{row.label}</Text>
            <Text style={value}>{row.value}</Text>
          </Section>
        ))}
      </Section>
      {cta ? (
        <>
          <Hr style={hr} />
          <Section style={{ textAlign: "center" as const }}>
            <Button href={cta.href} style={btn}>
              {cta.label}
            </Button>
          </Section>
        </>
      ) : null}
    </EmailLayout>
  );
}

const h2 = {
  color: "#0f172a",
  fontSize: "20px",
  fontWeight: "700",
  lineHeight: "1.35",
  margin: "0 0 16px",
};

const lead = {
  color: "#475569",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 22px",
};

const card = {
  backgroundColor: "#f8fafc",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  padding: "4px 0",
};

const rowStyle = {
  padding: "12px 18px",
  borderBottom: "1px solid #e2e8f0",
};

const label = {
  color: "#64748b",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.04em",
  textTransform: "uppercase" as const,
  margin: "0 0 4px",
};

const value = {
  color: "#0f172a",
  fontSize: "14px",
  fontWeight: "500",
  margin: "0",
  wordBreak: "break-word" as const,
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "28px 0",
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
