import {
  Button,
  Heading,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

import { EmailLayout } from "./email-layout";

interface PasswordResetEmailProps {
  resetUrl: string;
  siteUrl: string;
}

export const PasswordResetEmail = ({
  resetUrl,
  siteUrl,
}: PasswordResetEmailProps) => {
  return (
    <EmailLayout
      preview="Reset your blockhashpro password"
      siteUrl={siteUrl}
    >
      <Heading style={h2}>Password reset</Heading>
      <Text style={lead}>
        We received a request to reset your password. If this was you, use the
        button below. If not, you can safely ignore this message.
      </Text>
      <Section style={{ textAlign: "center" as const }}>
        <Button href={resetUrl} style={btn}>
          Reset password
        </Button>
      </Section>
      <Text style={muted}>Or copy this link:</Text>
      <Text style={link}>{resetUrl}</Text>
      <Text style={warn}>
        This link expires in 30 minutes for your security.
      </Text>
    </EmailLayout>
  );
};

export default PasswordResetEmail;

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
  margin: "0 0 18px",
};

const warn = {
  color: "#94a3b8",
  fontSize: "12px",
  margin: "0",
};
