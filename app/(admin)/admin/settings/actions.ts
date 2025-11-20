"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex/client";
import { requireAdminSession } from "@/lib/auth/session";
import type { Id } from "@/convex/_generated/dataModel";
import type { SupportedCrypto } from "@/lib/crypto/constants";

type HotWalletInput = {
  crypto: SupportedCrypto;
  address: string;
  label?: string;
};

export async function createHotWallet(input: HotWalletInput) {
  const session = await requireAdminSession();
  const convex = getConvexClient();

  await convex.mutation(api.hotWallets.upsertHotWallet, {
    crypto: input.crypto,
    address: input.address,
    label: input.label,
    adminId: session.payload.userId as Id<"users">,
  });

  revalidatePath("/admin/settings");
    revalidatePath("/dashboard/purchase-hashpower");
}

export async function updateHotWallet(walletId: string, input: HotWalletInput) {
  const session = await requireAdminSession();
  const convex = getConvexClient();

  await convex.mutation(api.hotWallets.upsertHotWallet, {
    crypto: input.crypto,
    address: input.address,
    label: input.label,
    adminId: session.payload.userId as Id<"users">,
  });

  revalidatePath("/admin/settings");
    revalidatePath("/dashboard/purchase-hashpower");
}

export async function deleteHotWallet(walletId: string) {
  const session = await requireAdminSession();
  const convex = getConvexClient();

  await convex.mutation(api.hotWallets.deleteHotWallet, {
    walletId: walletId as Id<"hotWallets">,
    adminId: session.payload.userId as Id<"users">,
  });

  revalidatePath("/admin/settings");
    revalidatePath("/dashboard/purchase-hashpower");
}

