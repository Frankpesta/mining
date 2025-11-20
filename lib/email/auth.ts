import { getAppBaseUrl } from "@/lib/env";

import { getResendClient } from "./client";

const DEFAULT_FROM_EMAIL = "blockhashpro <no-reply@blockhashpro.xyz>";

function getFromEmail() {
  return process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM_EMAIL;
}

export async function sendVerificationEmail({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const client = getResendClient();
  const url = `${getAppBaseUrl()}/auth/verify-email?token=${token}`;

  if (!client) {
    console.info(
      `[email] Verification email skipped for ${email}. Configure RESEND_API_KEY to enable delivery.`,
    );
    console.info(`Verification link: ${url}`);
    return;
  }

  await client.emails.send({
    from: getFromEmail(),
    to: email,
    subject: "Verify your blockhashpro account",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Welcome to blockhashpro!</h2>
        <p>Thanks for signing up. Please verify your email to activate your account:</p>
        <p><a href="${url}" target="_blank" style="background-color:#2563eb;padding:12px 24px;color:#ffffff;text-decoration:none;border-radius:9999px;font-weight:bold;">Verify Email</a></p>
        <p>Or copy and paste this URL into your browser:</p>
        <pre style="white-space:break-spaces;">${url}</pre>
        <p>This link will expire in 60 minutes.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const client = getResendClient();
  const url = `${getAppBaseUrl()}/auth/reset-password?token=${token}`;

  if (!client) {
    console.info(
      `[email] Password reset email skipped for ${email}. Configure RESEND_API_KEY to enable delivery.`,
    );
    console.info(`Reset link: ${url}`);
    return;
  }

  await client.emails.send({
    from: getFromEmail(),
    to: email,
    subject: "Reset your blockhashpro password",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5;">
        <h2>Password Reset Requested</h2>
        <p>We received a request to reset your password. If this was you, click the button below:</p>
        <p><a href="${url}" target="_blank" style="background-color:#2563eb;padding:12px 24px;color:#ffffff;text-decoration:none;border-radius:9999px;font-weight:bold;">Reset Password</a></p>
        <p>If you didn't request this change, you can ignore this email.</p>
        <p>This link will expire in 30 minutes.</p>
      </div>
    `,
  });
}

