const DEFAULT_APP_URL = "https://blockhashpro.xyz";

export function getAppBaseUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    return appUrl;
  }

  // Always use the default app URL instead of VERCEL_URL
  // to ensure emails contain the correct production URL
  return DEFAULT_APP_URL;
}

