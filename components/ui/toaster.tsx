"use client";

import { Toaster as SonnerToaster } from "sonner";

import { cn } from "@/lib/utils";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      richColors
      toastOptions={{
        classNames: {
          toast: cn(
            "group pointer-events-auto flex w-full max-w-sm items-center justify-between gap-3 rounded-lg border border-border bg-background p-4 shadow-lg transition",
          ),
          title: "text-sm font-semibold text-foreground",
          description: "text-sm text-muted-foreground",
          actionButton:
            "rounded-md border border-border bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90",
          closeButton:
            "text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        },
      }}
    />
  );
}

