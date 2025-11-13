"use server";

import { revalidatePath } from "next/cache";
import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex/client";
import { requireAdminSession } from "@/lib/auth/session";
import type { Id } from "@/convex/_generated/dataModel";

export async function updatePlatformSetting(key: string, value: any) {
  const session = await requireAdminSession();
  const convex = getConvexClient();

  await convex.mutation(api.platformSettings.setSetting, {
    key,
    value,
    adminId: session.payload.userId as Id<"users">,
  });

  revalidatePath("/admin/settings");
}

export async function getPlatformSetting(key: string) {
  const convex = getConvexClient();
  return await convex.query(api.platformSettings.getSetting, { key });
}

export async function getAllPlatformSettings() {
  const convex = getConvexClient();
  return await convex.query(api.platformSettings.getAllSettings, {});
}

