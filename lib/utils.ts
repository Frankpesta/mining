import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, currency = "USD", useCompact = true) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: useCompact ? "compact" : "standard",
    maximumFractionDigits: useCompact ? 2 : 0,
  }).format(value);
}

/**
 * Mining / wallet USD totals: avoid compact "B" (billions); use "M" (millions) for large values.
 */
export function formatUsdMiningDisplay(value: number) {
  if (!Number.isFinite(value)) {
    return formatCurrency(0, "USD", false);
  }
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    const millions = value / 1_000_000;
    return `${new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(millions)}M`;
  }
  return formatCurrency(value, "USD", true);
}

export function formatDate(value: number | Date) {
  const date = typeof value === "number" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

