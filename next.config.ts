import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Use webpack instead of Turbopack (needed for tap module handling)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.convex.cloud",
      },
    ],
  },
  // Set output file tracing root to avoid lockfile warnings
  outputFileTracingRoot: path.join(__dirname),
  // Empty turbopack config to satisfy Next.js 16 requirement
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Ignore warnings about missing test dependencies from thread-stream
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      /Can't resolve 'tap'/,
      /Module not found.*tap/,
    ];

    // Use NormalModuleReplacementPlugin to replace tap imports with stub
    const webpack = require('webpack');
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^tap$/,
        require.resolve('./tap-stub.js')
      )
    );

    // Add alias for tap module
    config.resolve.alias = {
      ...config.resolve.alias,
      tap: require.resolve('./tap-stub.js'),
    };

    return config;
  },
};

export default nextConfig;
