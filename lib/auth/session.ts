import crypto from "crypto";

import { redirect } from "next/navigation";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getConvexClient } from "@/lib/convex/client";

import { clearSessionCookie, getSessionCookie, setSessionCookie } from "./cookies";
import { signSessionToken, verifySessionToken } from "./jwt";

const SESSION_EXPIRY_DAYS = 7;

type SessionPayloadType = NonNullable<Awaited<ReturnType<typeof verifySessionToken>>>;

type SessionContext = {
  token: string;
  payload: SessionPayloadType;
};

export async function createSession(options: {
  userId: Id<"users">;
  role: "user" | "admin";
  email: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}) {
  const convex = getConvexClient();
  const sessionId = crypto.randomUUID();
  const token = await signSessionToken(
    {
      userId: options.userId,
      role: options.role,
      email: options.email,
      sessionId,
    },
    SESSION_EXPIRY_DAYS,
  );

  const expiresAt = Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  await convex.mutation(api.sessions.createSession, {
    userId: options.userId,
    sessionId,
    token,
    expiresAt,
    userAgent: options.userAgent ?? undefined,
    ipAddress: options.ipAddress ?? undefined,
  });

  await setSessionCookie(token);

  return token;
}

export async function getSession(): Promise<SessionContext | null> {
  const token = await getSessionCookie();
  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    await clearSessionCookie();
    return null;
  }

  const convex = getConvexClient();
  const session = await convex.query(api.sessions.verifySessionToken, {
    sessionId: payload.sessionId,
    token,
  });

  if (!session) {
    await clearSessionCookie();
    return null;
  }

  return { token, payload };
}

export async function requireSession() {
  const session = await getSession();
  if (!session) {
    redirect("/auth/login");
  }
  return session;
}

export async function requireAdminSession() {
  const session = await requireSession();
  if (session.payload.role !== "admin") {
    redirect("/dashboard");
  }
  return session;
}

export async function signOut(sessionId?: string) {
  const convex = getConvexClient();
  if (sessionId) {
    await convex.mutation(api.sessions.invalidateSession, { sessionId });
  } else {
    const session = await getSession();
    if (session) {
      await convex.mutation(api.sessions.invalidateSession, {
        sessionId: session.payload.sessionId,
      });
    }
  }
  await clearSessionCookie();
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) {
    return null;
  }
  const convex = getConvexClient();
  const user = await convex.query(api.users.getUserById, {
    userId: session.payload.userId as Id<"users">,
  });
  if (!user) {
    await signOut(session.payload.sessionId);
    return null;
  }
  return { user, session };
}