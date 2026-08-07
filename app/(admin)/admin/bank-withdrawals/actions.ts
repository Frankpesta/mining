"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { api } from "@/convex/_generated/api";
import { getCurrentUser } from "@/lib/auth/session";
import { getConvexClient } from "@/lib/convex/client";

import type { Id } from "@/convex/_generated/dataModel";

const reviewSchema = z.object({
  bankWithdrawalId: z.string().min(1, "Missing bank withdrawal identifier"),
  status: z.enum(["approved", "completed", "rejected", "failed"]),
  adminNote: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type ReviewBankWithdrawalInput = z.input<typeof reviewSchema>;

export async function reviewBankWithdrawal(input: ReviewBankWithdrawalInput) {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid review payload",
    };
  }

  const current = await getCurrentUser();
  if (!current || current.user.role !== "admin") {
    return { success: false, error: "You must be an administrator to update bank withdrawals." };
  }

  const convex = getConvexClient();

  try {
    await convex.mutation(api.bankWithdrawals.updateBankWithdrawalStatus, {
      bankWithdrawalId: parsed.data.bankWithdrawalId as Id<"bankWithdrawals">,
      adminId: current.user._id,
      status: parsed.data.status,
      adminNote: parsed.data.adminNote,
    });

    revalidatePath("/admin/bank-withdrawals");
    revalidatePath("/admin");
    revalidatePath("/dashboard/wallet");
    revalidatePath("/dashboard/withdraw");

    return { success: true } as const;
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "Unable to update bank withdrawal. Please try again in a moment.",
    };
  }
}
