import {
  Button,
  Heading,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

import { EmailLayout } from "./email-layout";

interface VerificationEmailProps {
  verificationUrl: string;
  siteUrl: string;
}

export const VerificationEmail = ({
  verificationUrl,
  siteUrl,
}: VerificationEmailProps) => {
  return (
    <EmailLayout
      preview="Confirm your email to activate your blockhashpro account"
      siteUrl={siteUrl}
    >
      <Heading style={h2}>Confirm your email</Heading>
      <Text style={lead}>
        Thank you for registering. Complete verification to access your dashboard
        and mining features.
      </Text>
      <Section style={{ textAlign: "center" as const }}>
        <Button href={verificationUrl} style={btn}>
          Confirm email address
        </Button>
      </Section>
      <Text style={muted}>Or paste this link into your browser:</Text>
      <Text style={link}>{verificationUrl}</Text>
      <Text style={footnote}>
        This link expires in 60 minutes. If you did not sign up, you can ignore
        this email.
      </Text>
    </EmailLayout>
  );
};

export default VerificationEmail;

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

const muted = {
  color: "#64748b",
  fontSize: "13px",
  margin: "28px 0 8px",
};

const link = {
  color: "#4f46e5",
  fontSize: "12px",
  wordBreak: "break-all" as const,
  margin: "0 0 20px",
};

const footnote = {
  color: "#94a3b8",
  fontSize: "12px",
  lineHeight: "1.55",
  margin: "0",
};
