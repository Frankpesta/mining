import Link from "next/link";

import { verifyEmailByToken } from "@/app/(auth)/actions";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const rawToken = params?.token;

  if (!rawToken) {
    return <InvalidToken message="Missing verification token." />;
  }

  // Decode the token in case it's URL-encoded
  const token = decodeURIComponent(rawToken);

  let verificationError: string | null = null;
  try {
    await verifyEmailByToken(token);
  } catch (error) {
    // Handle ConvexError and regular Error instances
    if (error instanceof Error) {
      verificationError = error.message;
    } else if (error && typeof error === "object" && "message" in error) {
      verificationError = String(error.message);
    } else {
      verificationError = "Unable to verify email address.";
    }
  }

  if (verificationError) {
    return <InvalidToken message={verificationError} />;
  }

  return <VerifiedMessage />;
}

function InvalidToken({ message }: { message: string }) {
  const isExpired = message.toLowerCase().includes("expired");
  const isInvalid = message.toLowerCase().includes("invalid");

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isExpired ? "Verification link expired" : "Verification link invalid"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isExpired
            ? "This verification link has expired. Please request a new one to continue."
            : isInvalid
              ? "This verification link is invalid or has already been used. Please request a new one."
              : "Unable to verify your email address. The link may be invalid or expired."}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <Link
          href="/auth/resend-verification"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
        >
          Request new verification email
        </Link>
        <Link
          href="/auth/login"
          className="text-sm font-medium text-primary hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

function VerifiedMessage() {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Email verified</h1>
        <p className="text-sm text-muted-foreground">
          Your email address is confirmed. You can now access the blockhashpro dashboard.
        </p>
      </div>
      <Link
        href="/auth/login"
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
      >
        Continue to sign in
      </Link>
    </div>
  );
}

