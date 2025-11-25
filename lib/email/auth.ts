import { render } from "@react-email/render";
import { getAppBaseUrl } from "@/lib/env";
import { getResendClient } from "./client";
import { VerificationEmail } from "@/emails/verification-email";
import { PasswordResetEmail } from "@/emails/password-reset-email";

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
  const url = `${getAppBaseUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`;

  if (!client) {
    console.info(
      `[email] Verification email skipped for ${email}. Configure RESEND_API_KEY to enable delivery.`,
    );
    console.info(`Verification link: ${url}`);
    return;
  }

  const emailHtml = await render(
    VerificationEmail({
      verificationUrl: url,
    }),
  );

  await client.emails.send({
    from: getFromEmail(),
    to: email,
    subject: "Confirm your email address - blockhashpro",
    html: emailHtml,
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
  const url = `${getAppBaseUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;

  if (!client) {
    console.info(
      `[email] Password reset email skipped for ${email}. Configure RESEND_API_KEY to enable delivery.`,
    );
    console.info(`Reset link: ${url}`);
    return;
  }

  const emailHtml = await render(
    PasswordResetEmail({
      resetUrl: url,
    }),
  );

  await client.emails.send({
    from: getFromEmail(),
    to: email,
    subject: "Reset your password - blockhashpro",
    html: emailHtml,
  });
}

