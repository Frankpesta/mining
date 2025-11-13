"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { api } from "@/convex/_generated/api";
import { getCurrentUser } from "@/lib/auth/session";
import { getConvexClient } from "@/lib/convex/client";

import type { Id } from "@/convex/_generated/dataModel";

const reviewSchema = z.object({
  withdrawalId: z.string().min(1, "Missing withdrawal identifier"),
  status: z.enum(["approved", "completed", "rejected", "failed"]),
  adminNote: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
  txHash: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined)),
});

export type ReviewWithdrawalInput = z.input<typeof reviewSchema>;

export async function reviewWithdrawal(input: ReviewWithdrawalInput) {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid review payload",
    };
  }

  const current = await getCurrentUser();
  if (!current || current.user.role !== "admin") {
    return { success: false, error: "You must be an administrator to update withdrawals." };
  }

  if (parsed.data.status === "completed" && !parsed.data.txHash) {
    return { success: false, error: "A transaction hash is required to mark withdrawals completed." };
  }

  const convex = getConvexClient();

  try {
    await convex.mutation(api.withdrawals.updateWithdrawalStatus, {
      withdrawalId: parsed.data.withdrawalId as Id<"withdrawals">,
      adminId: current.user._id,
      status: parsed.data.status,
      adminNote: parsed.data.adminNote,
      txHash: parsed.data.txHash,
    });

    revalidatePath("/admin/withdrawals");
    revalidatePath("/admin");
    revalidatePath("/dashboard/wallet");

    return { success: true } as const;
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "Unable to update withdrawal. Please try again in a moment.",
    };
  }
}

