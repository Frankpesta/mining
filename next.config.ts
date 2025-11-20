import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack for build to avoid font loading issues
  experimental: {
    turbo: false,
  },
};

export default nextConfig;
