import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.AUTH_SECRET;
const DEFAULT_SESSION_DAYS = 7;

if (!JWT_SECRET) {
  console.warn(
    "AUTH_SECRET is not set. JWT-based authentication will not work until this is configured.",
  );
}

export type SessionPayload = {
  userId: string;
  role: "user" | "admin";
  email: string;
  sessionId: string;
};

function getSecretKey() {
  if (!JWT_SECRET) {
    throw new Error("Missing AUTH_SECRET environment variable");
  }
  return new TextEncoder().encode(JWT_SECRET);
}

export async function signSessionToken(
  payload: Omit<SessionPayload, "sessionId"> & { sessionId: string },
  expiresInDays = DEFAULT_SESSION_DAYS,
) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expiresInDays * 24 * 60 * 60;

  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

