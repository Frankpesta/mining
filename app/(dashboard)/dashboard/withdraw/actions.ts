"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/convex/_generated/api";
import { getCurrentUser } from "@/lib/auth/session";
import { getConvexClient } from "@/lib/convex/client";
import { getWithdrawalFee } from "@/lib/payments/fees";

import { withdrawalRequestSchema, type WithdrawalRequestValues } from "./validators";

export async function submitWithdrawalRequest(values: WithdrawalRequestValues) {
  const parsed = withdrawalRequestSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Invalid withdrawal request",
    };
  }

  const current = await getCurrentUser();
  if (!current) {
    return { success: false, error: "You must be signed in to request a withdrawal." };
  }

  const fee = getWithdrawalFee(parsed.data.crypto, parsed.data.amount);
  if (parsed.data.amount <= fee) {
    return {
      success: false,
      error: `Amount must be greater than the network fee (${fee} ${parsed.data.crypto}).`,
    };
  }

  const convex = getConvexClient();

  try {
    await convex.mutation(api.withdrawals.createWithdrawalRequest, {
      userId: current.user._id,
      crypto: parsed.data.crypto,
      amount: parsed.data.amount,
      destinationAddress: parsed.data.destinationAddress,
      requestedFee: fee,
      note: parsed.data.note,
    });

    revalidatePath("/dashboard/wallet");
    revalidatePath("/dashboard/withdraw");
    revalidatePath("/dashboard");

    return { success: true, fee } as const;
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "Unable to submit withdrawal request. Please try again shortly.",
    };
  }
}

