import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

export type EmailLayoutProps = {
  preview: string;
  variant?: "default" | "admin";
  /** Dashboard / site root for footer link */
  siteUrl: string;
  children: React.ReactNode;
};

const BRAND = "blockhashpro";

export function EmailLayout({
  preview,
  variant = "default",
  siteUrl,
  children,
}: EmailLayoutProps) {
  const dash = `${siteUrl.replace(/\/$/, "")}/dashboard`;

  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Section style={outerWrap}>
          <Container style={card}>
            <Section style={hero}>
              {variant === "admin" ? (
                <Text style={adminRibbon}>Admin · internal notice</Text>
              ) : null}
              <Text style={brandWordmark}>{BRAND}</Text>
              <Section style={accentStripe} />
              <Text style={tagline}>Mining · withdrawals · support</Text>
            </Section>
            <Section style={inner}>{children}</Section>
            <Section style={footer}>
              <Text style={footerMuted}>
                You are receiving this because of activity on your {BRAND}{" "}
                account or an admin action that concerns you.
              </Text>
              <Link href={dash} style={footerLink}>
                Open dashboard
              </Link>
              <Text style={copyright}>
                © {new Date().getFullYear()} {BRAND}
              </Text>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#e8edf5",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  margin: 0,
  padding: "32px 12px",
};

const outerWrap = {
  margin: "0 auto",
};

const card = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  boxShadow:
    "0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 10px 24px -6px rgba(15, 23, 42, 0.12)",
  maxWidth: "560px",
  margin: "0 auto",
  overflow: "hidden" as const,
  border: "1px solid #e2e8f0",
};

const hero = {
  backgroundColor: "#0f172a",
  padding: "28px 32px 20px",
  textAlign: "left" as const,
};

const adminRibbon = {
  color: "#67e8f9",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  margin: "0 0 12px",
};

const brandWordmark = {
  color: "#f8fafc",
  fontSize: "22px",
  fontWeight: "700",
  letterSpacing: "-0.02em",
  margin: "0 0 14px",
};

const accentStripe = {
  height: "3px",
  width: "56px",
  borderRadius: "2px",
  background: "linear-gradient(90deg, #22d3ee, #6366f1)",
  margin: "0 0 10px",
};

const tagline = {
  color: "#94a3b8",
  fontSize: "13px",
  margin: "0",
  fontWeight: "400",
};

const inner = {
  padding: "32px 32px 28px",
};

const footer = {
  padding: "20px 32px 28px",
  borderTop: "1px solid #f1f5f9",
  backgroundColor: "#f8fafc",
};

const footerMuted = {
  color: "#64748b",
  fontSize: "12px",
  lineHeight: "1.55",
  margin: "0 0 14px",
};

const footerLink = {
  color: "#4f46e5",
  fontSize: "13px",
  fontWeight: "600",
  textDecoration: "none",
};

const copyright = {
  color: "#94a3b8",
  fontSize: "11px",
  margin: "16px 0 0",
};
