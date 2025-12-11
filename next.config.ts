import type { NextConfig } from "next";

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
  // Empty turbopack config to allow webpack to be used
  // Webpack config below handles tap module stubbing from thread-stream
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Ignore warnings about missing test dependencies
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /node_modules\/thread-stream/,
        message: /Can't resolve 'tap'/,
      },
      {
        module: /node_modules\/thread-stream/,
        message: /Module not found.*tap/,
      },
      /Can't resolve 'tap'/,
      /Module not found.*tap/,
    ];

    // Use NormalModuleReplacementPlugin to replace tap imports with empty module
    const webpack = require('webpack');
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /^tap$/,
        require.resolve('./tap-stub.js')
      )
    );

    // Provide fallback for 'tap' module (used in test files)
    if (!config.resolve) {
      config.resolve = {};
    }
    if (!config.resolve.alias) {
      config.resolve.alias = {};
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      tap: require.resolve('./tap-stub.js'),
    };

    if (!config.resolve.fallback) {
      config.resolve.fallback = {};
    }
    config.resolve.fallback = {
      ...config.resolve.fallback,
      tap: require.resolve('./tap-stub.js'),
    };

    // Also add externals for tap to prevent bundling
    if (isServer) {
      if (!config.externals) {
        config.externals = [];
      }
      if (typeof config.externals === 'function') {
        const originalExternals = config.externals;
        config.externals = [
          originalExternals,
          ({ request }: { request: string }) => {
            if (request === 'tap') {
              return `commonjs ${require.resolve('./tap-stub.js')}`;
            }
          },
        ];
      } else if (Array.isArray(config.externals)) {
        config.externals.push(({ request }: { request: string }) => {
          if (request === 'tap') {
            return `commonjs ${require.resolve('./tap-stub.js')}`;
          }
        });
      }
    }

    return config;
  },
};

export default nextConfig;
