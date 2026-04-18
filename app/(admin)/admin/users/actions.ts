"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex/client";
import { requireAdminSession } from "@/lib/auth/session";
import type { Id } from "@/convex/_generated/dataModel";

export async function updateUserRole(userId: string, newRole: "user" | "admin") {
  const session = await requireAdminSession();
  const convex = getConvexClient();

  await convex.mutation(api.usersAdmin.updateUserRole, {
    userId: userId as Id<"users">,
    adminId: session.payload.userId as Id<"users">,
    newRole,
  });

  revalidatePath("/admin/users");
}

export async function toggleUserSuspension(userId: string) {
  const session = await requireAdminSession();
  const convex = getConvexClient();

  await convex.mutation(api.usersAdmin.toggleUserSuspension, {
    userId: userId as Id<"users">,
    adminId: session.payload.userId as Id<"users">,
  });

  revalidatePath("/admin/users");
}

export type AdjustUserBalanceResult =
  | { ok: true }
  | { ok: false; message: string };

export type AdjustableWallet = "platform" | "mining";

/** Admin-adjustable assets (must match Convex `usersAdmin.adjustUserBalance`). */
export type AdjustableCrypto =
  | "BTC"
  | "ETH"
  | "USDT"
  | "USDC"
  | "SOL"
  | "LTC"
  | "BNB"
  | "ADA"
  | "XRP"
  | "DOGE"
  | "DOT"
  | "MATIC"
  | "AVAX"
  | "ATOM"
  | "LINK"
  | "UNI";

export async function adjustUserBalance(input: {
  userId: string;
  wallet: AdjustableWallet;
  crypto: AdjustableCrypto;
  amount: number;
  direction: "add" | "subtract";
  note?: string;
}): Promise<AdjustUserBalanceResult> {
  const magnitude = Math.abs(input.amount);
  if (!Number.isFinite(magnitude) || magnitude <= 0) {
    return { ok: false, message: "Enter a valid positive amount." };
  }

  try {
    const session = await requireAdminSession();
    const convex = getConvexClient();

    const delta = input.direction === "add" ? magnitude : -magnitude;

    await convex.mutation(api.usersAdmin.adjustUserBalance, {
      adminId: session.payload.userId as Id<"users">,
      userId: input.userId as Id<"users">,
      wallet: input.wallet,
      crypto: input.crypto,
      delta,
      note: input.note,
    });
  } catch (error) {
    unstable_rethrow(error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Balance adjustment failed.";
    return { ok: false, message };
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${input.userId}`);
  return { ok: true };
}

