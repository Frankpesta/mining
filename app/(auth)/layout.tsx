import type { Metadata } from "next";
import Link from "next/link";

import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: {
    default: "Access HashHorizon",
    template: "%s | HashHorizon",
  },
  description:
    "Secure access to HashHorizon. Create an account, verify your email, and manage mining operations effortlessly.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 bg-background md:grid-cols-[1fr_480px]">
      <div className="relative hidden items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 px-12 text-slate-100 md:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.3),_transparent_55%)]" />
        <div className="relative z-10 flex max-w-md flex-col gap-8">
          <div>
            <span className="text-sm uppercase tracking-[0.4em] text-blue-300">
              HashHorizon
            </span>
            <h2 className="mt-4 text-3xl font-bold leading-tight">
              Enterprise-grade crypto mining marketplace
            </h2>
          </div>
          <p className="text-sm text-slate-200/80">
            Manage deposits, mining operations, and withdrawals with real-time analytics and
            admin approval workflows. Build trust with secure email-first authentication.
          </p>
          <div className="flex flex-wrap gap-3 text-xs uppercase tracking-wide text-blue-200/80">
            <FeatureBadge>Realtime dashboards</FeatureBadge>
            <FeatureBadge>Convex powered</FeatureBadge>
            <FeatureBadge>Viem settlements</FeatureBadge>
            <FeatureBadge>Resend notifications</FeatureBadge>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center bg-background px-6 py-12 sm:px-10">
        <div className="w-full max-w-md space-y-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              HH
            </span>
            Back to site
          </Link>
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            {children}
          </div>
          <p className="text-center text-xs text-muted-foreground">
            By continuing you agree to our{" "}
            <Link
              href="/legal/terms"
              className="font-medium text-primary hover:underline"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href="/legal/privacy"
              className="font-medium text-primary hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureBadge({ children }: { children: React.ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-blue-300/40 bg-blue-400/10 px-3 py-1 text-[11px] font-medium uppercase tracking-wide",
      )}
    >
      {children}
    </span>
  );
}

