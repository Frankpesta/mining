import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const rawToken = params?.token;

  if (!rawToken) {
    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Reset link missing</h1>
          <p className="text-sm text-muted-foreground">
            The password reset link is missing from the URL. Please check your email and click the link again, or request a new reset link.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/auth/forgot-password"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Request a new reset link
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

  // Decode the token in case it's URL-encoded
  const token = decodeURIComponent(rawToken);

  return <ResetPasswordForm token={token} />;
}

