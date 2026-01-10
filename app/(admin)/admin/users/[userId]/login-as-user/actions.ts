"use server";

import { requireAdminSession } from "@/lib/auth/session";
import { createSession } from "@/lib/auth/session";
import { getConvexClient } from "@/lib/convex/client";
import { api } from "@/convex/_generated/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Id } from "@/convex/_generated/dataModel";

export async function loginAsUser(userId: string) {
  const adminSession = await requireAdminSession();

  // Verify admin is logged in
  if (!adminSession) {
    throw new Error("Unauthorized");
  }

  const convex = getConvexClient();
  
  // Get the target user
  const user = await convex.query(api.users.getUserById, {
    userId: userId as Id<"users">,
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Get user agent and IP for session creation
  let userAgent: string | undefined;
  let ipAddress: string | undefined;
  
  try {
    const headerList = await headers();
    userAgent = headerList.get("user-agent") ?? undefined;
    const forwardedFor = headerList.get("x-forwarded-for");
    ipAddress = forwardedFor?.split(",")[0]?.trim();
  } catch {
    // headers() may not be available
  }

  // Create a session for the target user
  await createSession({
    userId: user._id,
    role: user.role,
    email: user.email,
    userAgent,
    ipAddress,
  });

  // Update last login
  await convex.mutation(api.users.updateLastLogin, {
    userId: user._id,
    lastLogin: Date.now(),
  });

  // Redirect to user dashboard
  redirect("/dashboard");
}
