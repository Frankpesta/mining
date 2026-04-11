import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Full currency strings (e.g. $1,595.11) — no compact K/M/B suffixes. */
export function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    notation: "standard",
  }).format(value);
}

/** Whole and cent parts for marketing-style superscript prices (e.g. 100 and 00). */
export function splitUsdDisplayParts(value: number): { dollars: string; cents: string } {
  const [dollars, cents] = value.toFixed(2).split(".");
  return { dollars, cents };
}

export function formatDate(value: number | Date) {
  const date = typeof value === "number" ? new Date(value) : value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

