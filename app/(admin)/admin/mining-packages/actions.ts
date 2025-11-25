"use server";

import { revalidatePath } from "next/cache";

import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/convex/client";
import { getCurrentUser, requireAdminSession } from "@/lib/auth/session";
import type { Id } from "@/convex/_generated/dataModel";

type CreatePlanInput = {
  name: string;
  hashRate: number;
  hashRateUnit: "TH/s" | "GH/s" | "MH/s";
  duration: number;
  minPriceUSD: number;
  maxPriceUSD?: number;
  priceUSD: number;
  supportedCoins: string;
  minDailyROI: number;
  maxDailyROI: number;
  estimatedDailyEarning: number;
  isActive: boolean;
  features: string;
  idealFor?: string;
};

type UpdatePlanInput = CreatePlanInput & {
  planId: string;
};

export async function createPlan(input: CreatePlanInput) {
  await requireAdminSession();
  const convex = getConvexClient();

  const supportedCoins = input.supportedCoins
    .split(",")
    .map((coin) => coin.trim().toUpperCase())
    .filter(Boolean);

  const features = input.features
    .split(/[,\n]/)
    .map((feature) => feature.trim())
    .filter(Boolean);

  await convex.mutation(api.plans.createPlan, {
    name: input.name,
    hashRate: input.hashRate,
    hashRateUnit: input.hashRateUnit,
    duration: input.duration,
    minPriceUSD: input.minPriceUSD,
    maxPriceUSD: input.maxPriceUSD,
    priceUSD: input.priceUSD,
    supportedCoins,
    minDailyROI: input.minDailyROI,
    maxDailyROI: input.maxDailyROI,
    estimatedDailyEarning: input.estimatedDailyEarning,
    isActive: input.isActive,
    features,
    idealFor: input.idealFor,
  });

  revalidatePath("/admin/mining-packages");
}

export async function updatePlan(input: UpdatePlanInput) {
  await requireAdminSession();
  const convex = getConvexClient();

  const supportedCoins = input.supportedCoins
    .split(",")
    .map((coin) => coin.trim().toUpperCase())
    .filter(Boolean);

  const features = input.features
    .split(/[,\n]/)
    .map((feature) => feature.trim())
    .filter(Boolean);

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
    minDailyROI: input.minDailyROI,
    maxDailyROI: input.maxDailyROI,
    estimatedDailyEarning: input.estimatedDailyEarning,
    isActive: input.isActive,
    features,
    idealFor: input.idealFor,
  });

  revalidatePath("/admin/mining-packages");
}

export async function deletePlan(planId: string) {
  await requireAdminSession();
  const convex = getConvexClient();

  await convex.mutation(api.plans.deletePlan, {
    planId: planId as Id<"plans">,
  });

  revalidatePath("/admin/mining-packages");
}

export async function togglePlanStatus(planId: string, isActive: boolean) {
  await requireAdminSession();
  const convex = getConvexClient();

  await convex.mutation(api.plans.updatePlan, {
    planId: planId as Id<"plans">,
    isActive,
  });

  revalidatePath("/admin/mining-packages");
}

