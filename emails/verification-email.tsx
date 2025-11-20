import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface VerificationEmailProps {
  verificationUrl: string;
}

export const VerificationEmail = ({ verificationUrl }: VerificationEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Confirm your email address to activate your blockhashpro account</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to blockhashpro</Heading>
          
          <Text style={text}>
            Thank you for creating an account with blockhashpro. To complete your registration and start mining cryptocurrency, please confirm your email address.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={verificationUrl}>
              Confirm Email Address
            </Button>
          </Section>

          <Text style={text}>
            Or copy and paste this link into your browser:
          </Text>
          
          <Text style={linkText}>
            {verificationUrl}
          </Text>

          <Text style={footer}>
            This confirmation link will expire in 60 minutes. If you didn't create an account with blockhashpro, you can safely ignore this email.
          </Text>

          <Text style={footer}>
            Best regards,<br />
            The blockhashpro Team
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default VerificationEmail;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const h1 = {
  color: "#1f2937",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.3",
  margin: "0 0 24px",
};

const text = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "1.5",
  margin: "0 0 16px",
};

const buttonContainer = {
  margin: "32px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#2563eb",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const linkText = {
  color: "#2563eb",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 24px",
  wordBreak: "break-all" as const,
};

const footer = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "16px 0 0",
};

