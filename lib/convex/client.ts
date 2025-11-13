import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL ?? process.env.CONVEX_URL;

let client: ConvexHttpClient | null = null;

export function getConvexClient() {
  if (!CONVEX_URL) {
    throw new Error(
      "Missing NEXT_PUBLIC_CONVEX_URL or CONVEX_URL environment variable. Convex client cannot be created.",
    );
  }

  if (!client) {
    client = new ConvexHttpClient(CONVEX_URL);
  }

  return client;
}

