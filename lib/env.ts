const DEFAULT_APP_URL = "https://blockhashpro.xyz";
const LOCAL_APP_URL = "http://localhost:3000";

function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (trimmed.length === 0) {
    return "";
  }
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getAppBaseUrl() {
  const explicitUrl = normalizeUrl(process.env.NEXT_PUBLIC_APP_URL ?? "");
  if (explicitUrl) {
    return explicitUrl;
  }

  const vercelUrl = normalizeUrl(process.env.VERCEL_URL ?? "");
  if (vercelUrl) {
    return vercelUrl;
  }

  if (process.env.NODE_ENV === "development") {
    return LOCAL_APP_URL;
  }

  return DEFAULT_APP_URL;
}

