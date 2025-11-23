import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Note: Turbopack is enabled by default in Next.js 16
  // Font loading issues are typically network-related, not config-related
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.convex.cloud",
      },
    ],
  },
};

export default nextConfig;
