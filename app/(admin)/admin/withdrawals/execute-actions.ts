"use server";

import { executeWithdrawal } from "@/lib/blockchain/withdrawal-executor";
import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { getConvexClient } from "@/lib/convex/client";
import { getCurrentUser } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Execute a withdrawal transaction on-chain
 * This should only be called after manual approval
 */
export async function executeWithdrawalTx(
  withdrawalId: string,
  hotWalletAddress: string,
) {
  const current = await getCurrentUser();
  if (!current || current.user.role !== "admin") {
    return {
      success: false,
      error: "You must be an administrator to execute withdrawals.",
    };
  }

  const convex = getConvexClient();

  try {
    // Get withdrawal details
    const withdrawal = await convex.query(api.withdrawals.listAdminWithdrawals, {
      limit: 1000,
    });
    const targetWithdrawal = withdrawal.find((w: Doc<"withdrawals"> & { userEmail: string | null }) => w._id === withdrawalId);

    if (!targetWithdrawal) {
      return {
        success: false,
        error: "Withdrawal not found",
      };
    }

    if (targetWithdrawal.status !== "approved") {
      return {
        success: false,
        error: "Withdrawal must be approved before execution",
      };
    }

    // Only ETH, USDT, and USDC can be executed via this function
    if (targetWithdrawal.crypto !== "ETH" && targetWithdrawal.crypto !== "USDT" && targetWithdrawal.crypto !== "USDC") {
      return {
        success: false,
        error: `Automatic execution for ${targetWithdrawal.crypto} is not yet supported. Please execute manually.`,
      };
    }

    // Execute the transaction
    const result = await executeWithdrawal(
      hotWalletAddress,
      targetWithdrawal.destinationAddress,
      targetWithdrawal.finalAmount,
      targetWithdrawal.crypto as "ETH" | "USDT" | "USDC",
    );

    if (!result.success || !result.txHash) {
      return {
        success: false,
        error: result.error ?? "Failed to execute withdrawal",
      };
    }

    // Update withdrawal status
    await convex.mutation(api.withdrawals.updateWithdrawalStatus, {
      withdrawalId: withdrawalId as Id<"withdrawals">,
      adminId: current.user._id,
      status: "completed",
      txHash: result.txHash,
    });

    revalidatePath("/admin/withdrawals");
    revalidatePath("/admin");

    return {
      success: true,
      txHash: result.txHash,
    };
  } catch (error) {
    console.error("[executeWithdrawalTx] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

