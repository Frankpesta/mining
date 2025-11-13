"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "@/lib/wallet/config";
import { useState, useEffect } from "react";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  // Suppress WalletConnect's internal empty object console errors
  useEffect(() => {
    const originalError = console.error;
    const originalLog = console.log;
    const originalWarn = console.warn;

    const createInterceptor = (original: typeof console.error) => {
      return (...args: unknown[]) => {
        // Aggressively suppress empty object errors - they provide no useful information
        if (args.length > 0) {
          const firstArg = args[0];
          
          // Check if first argument is an empty object using multiple methods
          if (
            typeof firstArg === "object" &&
            firstArg !== null &&
            !Array.isArray(firstArg) &&
            firstArg.constructor === Object
          ) {
            // Quick check: enumerable properties
            const keys = Object.keys(firstArg);
            if (keys.length === 0) {
              // Double-check with JSON to be absolutely sure
              try {
                if (JSON.stringify(firstArg) === "{}") {
                  return; // Suppress empty object
                }
              } catch {
                // If stringification fails but keys.length is 0, still suppress
                return;
              }
            }
          }
        }

        // Check stack trace for WalletConnect internal logging (only if not already suppressed)
        try {
          const stackTrace = new Error().stack || "";
          if (
            stackTrace.includes("forwardToConsole") ||
            stackTrace.includes("appendToLogs") ||
            stackTrace.includes("3cabc_") ||
            stackTrace.includes("Ti.restore") ||
            stackTrace.includes("Ti.restart") ||
            stackTrace.includes("Ti.onConnect") ||
            stackTrace.includes("Ti.start")
          ) {
            // If from WalletConnect and first arg is an object, suppress it
            if (args.length > 0 && typeof args[0] === "object" && args[0] !== null && !Array.isArray(args[0])) {
              try {
                if (JSON.stringify(args[0]) === "{}" || Object.keys(args[0]).length === 0) {
                  return; // Suppress WalletConnect empty object errors
                }
              } catch {
                // If we can't stringify but it's from WalletConnect, suppress anyway
                return;
              }
            }
          }
        } catch {
          // If stack trace check fails, continue
        }

        original.apply(console, args);
      };
    };

    console.error = createInterceptor(originalError);
    console.log = createInterceptor(originalLog);
    console.warn = createInterceptor(originalWarn);

    return () => {
      console.error = originalError;
      console.log = originalLog;
      console.warn = originalWarn;
    };
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}

