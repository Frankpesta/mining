"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/convex/_generated/api";
import { getCurrentUser } from "@/lib/auth/session";
import { getConvexClient } from "@/lib/convex/client";

import { depositRequestSchema, type DepositRequestValues } from "./validators";

export async function submitDepositRequest(values: DepositRequestValues) {
  const parsed = depositRequestSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid deposit request",
    };
  }

  const current = await getCurrentUser();
  if (!current) {
    return { success: false, error: "You must be signed in to submit a deposit request." };
  }

  const convex = getConvexClient();

  try {
    await convex.mutation(api.deposits.createDepositRequest, {
      userId: current.user._id,
      crypto: parsed.data.crypto,
      amount: parsed.data.amount,
      txHash: parsed.data.txHash,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/purchase-hashpower");

    return { success: true } as const;
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Something went wrong while submitting the deposit request." };
  }
}

