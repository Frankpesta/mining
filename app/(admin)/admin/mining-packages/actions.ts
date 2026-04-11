"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";

import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex/client";
import { requireAdminSession } from "@/lib/auth/session";
import type { Id } from "@/convex/_generated/dataModel";

export type PlanMutationResult = { ok: true } | { ok: false; message: string };

type CreatePlanInput = {
  name: string;
  hashRate: number;
  hashRateUnit: "TH/s" | "GH/s" | "MH/s";
  duration: number;
  minPriceUSD: number;
  maxPriceUSD?: number;
  priceUSD: number;
  supportedCoins: string;
  dailyRoiPercent: number;
  renewalType: "manual" | "auto";
  isActive: boolean;
  features: string;
  idealFor?: string;
};

type UpdatePlanInput = CreatePlanInput & {
  planId: string;
};

export async function createPlan(input: CreatePlanInput): Promise<PlanMutationResult> {
  const supportedCoins = input.supportedCoins
    .split(",")
    .map((coin) => coin.trim().toUpperCase())
    .filter(Boolean);

  const features = input.features
    .split(/[,\n]/)
    .map((feature) => feature.trim())
    .filter(Boolean);

  try {
    await requireAdminSession();
    const convex = getConvexClient();

    await convex.mutation(api.plans.createPlan, {
      name: input.name,
      hashRate: input.hashRate,
      hashRateUnit: input.hashRateUnit,
      duration: input.duration,
      minPriceUSD: input.minPriceUSD,
      maxPriceUSD: input.maxPriceUSD,
      priceUSD: input.priceUSD,
      supportedCoins,
      dailyRoiPercent: input.dailyRoiPercent,
      renewalType: input.renewalType,
      isActive: input.isActive,
      features,
      idealFor: input.idealFor,
    });
  } catch (error) {
    unstable_rethrow(error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Could not create mining package.";
    return { ok: false, message };
  }

  revalidatePath("/admin/mining-packages");
  return { ok: true };
}

export async function updatePlan(input: UpdatePlanInput): Promise<PlanMutationResult> {
  const supportedCoins = input.supportedCoins
    .split(",")
    .map((coin) => coin.trim().toUpperCase())
    .filter(Boolean);

  const features = input.features
    .split(/[,\n]/)
    .map((feature) => feature.trim())
    .filter(Boolean);

  try {
    await requireAdminSession();
    const convex = getConvexClient();

    await convex.mutation(api.plans.updatePlan, {
      planId: input.planId as Id<"plans">,
      name: input.name,
      hashRate: input.hashRate,
      hashRateUnit: input.hashRateUnit,
      duration: input.duration,
      minPriceUSD: input.minPriceUSD,
      maxPriceUSD: input.maxPriceUSD,
      priceUSD: input.priceUSD,
      supportedCoins,
      dailyRoiPercent: input.dailyRoiPercent,
      renewalType: input.renewalType,
      clearEarningTier: true,
      isActive: input.isActive,
      features,
      idealFor: input.idealFor,
    });
  } catch (error) {
    unstable_rethrow(error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Could not update mining package.";
    return { ok: false, message };
  }

  revalidatePath("/admin/mining-packages");
  return { ok: true };
}

export async function deletePlan(planId: string): Promise<PlanMutationResult> {
  try {
    await requireAdminSession();
    const convex = getConvexClient();

    await convex.mutation(api.plans.deletePlan, {
      planId: planId as Id<"plans">,
    });
  } catch (error) {
    unstable_rethrow(error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Could not delete mining package.";
    return { ok: false, message };
  }

  revalidatePath("/admin/mining-packages");
  return { ok: true };
}

export async function togglePlanStatus(
  planId: string,
  isActive: boolean,
): Promise<PlanMutationResult> {
  try {
    await requireAdminSession();
    const convex = getConvexClient();

    await convex.mutation(api.plans.updatePlan, {
      planId: planId as Id<"plans">,
      isActive,
    });
  } catch (error) {
    unstable_rethrow(error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Could not update package status.";
    return { ok: false, message };
  }

  revalidatePath("/admin/mining-packages");
  return { ok: true };
}
