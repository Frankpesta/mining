import type { NextRequest } from "next/server";

/** Validates Bearer token against EMAIL_DISPATCH_SECRET (Convex + Next.js must match). */
export function verifyEmailDispatchSecret(request: NextRequest): boolean {
  const secret = process.env.EMAIL_DISPATCH_SECRET;
  if (!secret) {
    console.warn(
      "[email] EMAIL_DISPATCH_SECRET is not set — refusing dispatch requests",
    );
    return false;
  }
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return false;
  }
  return auth.slice(7) === secret;
}
