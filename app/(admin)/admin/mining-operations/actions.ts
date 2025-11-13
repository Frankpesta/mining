"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex/client";
import { getCurrentUser, requireAdminSession } from "@/lib/auth/session";
import type { Id } from "@/convex/_generated/dataModel";

export async function pauseMiningOperation(operationId: string) {
  const session = await requireAdminSession();
  const convex = getConvexClient();

  await convex.mutation(api.miningOperations.pauseMiningOperation, {
    operationId: operationId as Id<"miningOperations">,
    adminId: session.payload.userId as Id<"users">,
  });

  revalidatePath("/admin/mining-operations");
}

export async function resumeMiningOperation(operationId: string) {
  const session = await requireAdminSession();
  const convex = getConvexClient();

  await convex.mutation(api.miningOperations.resumeMiningOperation, {
    operationId: operationId as Id<"miningOperations">,
    adminId: session.payload.userId as Id<"users">,
  });

  revalidatePath("/admin/mining-operations");
}

