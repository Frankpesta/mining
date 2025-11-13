"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex/client";
import { getCurrentUser, requireAdminSession } from "@/lib/auth/session";
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

