"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { api } from "@/convex/_generated/api";
import { getCurrentUser } from "@/lib/auth/session";
import { getConvexClient } from "@/lib/convex/client";

import type { Id } from "@/convex/_generated/dataModel";

const reviewSchema = z.object({
  depositId: z.string().min(1, "Missing deposit identifier"),
  status: z.enum(["approved", "rejected"]),
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

export type ReviewDepositInput = z.input<typeof reviewSchema>;

export async function reviewDeposit(input: ReviewDepositInput) {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid review payload",
    };
  }

  const current = await getCurrentUser();
  if (!current || current.user.role !== "admin") {
    return { success: false, error: "You must be an administrator to update deposits." };
  }

  const convex = getConvexClient();

  try {
    await convex.action(api.deposits.updateDepositStatus, {
      depositId: parsed.data.depositId as Id<"deposits">,
      adminId: current.user._id,
      status: parsed.data.status,
      adminNote: parsed.data.adminNote,
      txHash: parsed.data.txHash,
    });

    revalidatePath("/admin/deposits");
    revalidatePath("/admin");

    return { success: true } as const;
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unable to update deposit. Try again shortly." };
  }
}

