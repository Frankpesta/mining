"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex/client";
import { getCurrentUser } from "@/lib/auth/session";
import type { Id } from "@/convex/_generated/dataModel";

export async function purchasePlan(input: {
  userId: Id<"users">;
  planId: Id<"plans">;
  coin: string;
  fundingSource?: "platform" | "mining";
}) {
  const current = await getCurrentUser();
  if (!current || current.user._id !== input.userId) {
    throw new Error("Unauthorized");
  }

  const convex = getConvexClient();
  await convex.mutation(api.plans.purchasePlan, {
    userId: input.userId,
    planId: input.planId,
    coin: input.coin,
    ...(input.fundingSource ? { fundingSource: input.fundingSource } : {}),
  });

  revalidatePath("/dashboard/mining-packages");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/mining");
}

