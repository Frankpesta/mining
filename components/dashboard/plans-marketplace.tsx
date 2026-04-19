"use client";

import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency, splitUsdDisplayParts } from "@/lib/utils";
import { purchasePlan } from "@/app/(dashboard)/dashboard/mining-packages/actions";
import type { Id } from "@/convex/_generated/dataModel";

type Plan = {
  _id: string;
  name: string;
  hashRate: number;
  hashRateUnit: "TH/s" | "GH/s" | "MH/s";
  duration: number;
  minPriceUSD?: number;
  maxPriceUSD?: number;
  priceUSD: number;
  supportedCoins: string[];
  features: string[];
  idealFor?: string;
  dailyRoiPercent?: number;
  renewalType?: "manual" | "auto";
};

function formatContractLabel(days: number): string {
  if (days === 30) return "1 Month mining contract";
  if (days === 90) return "3 Months mining contract";
  return `${days}-day mining contract`;
}

function commitmentSummary(
  plan: Plan,
  source: "platform" | "mining",
): string {
  const min = plan.minPriceUSD ?? plan.priceUSD;
  const max = plan.maxPriceUSD;
  const wallet =
    source === "platform" ? "platform wallet" : "mined balance (approx. USD)";
  if (max !== undefined) {
    return `Commits from your ${wallet} from ${formatCurrency(min)} up to ${formatCurrency(max)}.`;
  }
  return `Commits from your ${wallet} from ${formatCurrency(min)} (no upper cap).`;
}

function HeroPrice({ amount }: { amount: number }) {
  const { dollars, cents } = splitUsdDisplayParts(amount);
  return (
    <div className="flex items-start justify-center gap-0.5 text-primary">
      <span className="text-lg font-semibold">$</span>
      <span className="text-4xl font-bold leading-none tracking-tight">{dollars}</span>
      <sup className="text-base font-semibold translate-y-1">.{cents}</sup>
    </div>
  );
}

type PlanCardProps = {
  plan: Plan;
  userId: string;
  platformUsd: number;
  miningUsd: number;
};

function PlanCard({ plan, userId, platformUsd, miningUsd }: PlanCardProps) {
  const [isPurchasing, startPurchase] = useTransition();
  const minEntry = plan.minPriceUSD ?? plan.priceUSD;
  const canAffordPlatform = platformUsd >= minEntry;
  const canAffordMining = miningUsd >= minEntry;
  /** Either wallet can cover min — required so the CTA stays enabled when only mined balance qualifies. */
  const canStartPurchase = canAffordPlatform || canAffordMining;

  const [fundingSource, setFundingSource] = useState<"platform" | "mining">(() =>
    canAffordPlatform ? "platform" : canAffordMining ? "mining" : "platform",
  );

  const walletUsd = fundingSource === "platform" ? platformUsd : miningUsd;
  const roi = plan.dailyRoiPercent;
  const canAfford = walletUsd >= minEntry;
  const displayDailyUsd =
    roi !== undefined && roi > 0 ? (roi / 100) * plan.priceUSD : 0;
  const committedAmount =
    plan.maxPriceUSD !== undefined
      ? Math.min(walletUsd, plan.maxPriceUSD)
      : walletUsd;

  const handlePurchase = (coin: string) => {
    if (!canAfford) {
      const label =
        fundingSource === "platform" ? "platform wallet" : "mined balance";
      toast.error(
        `You need at least ${formatCurrency(minEntry)} available in your ${label} (approx. USD for mined funds).`,
      );
      return;
    }

    startPurchase(async () => {
      try {
        await purchasePlan({
          userId: userId as Id<"users">,
          planId: plan._id as Id<"plans">,
          coin,
          fundingSource,
        });
        toast.success(
          `${plan.name} started. Funds were committed from your ${fundingSource === "platform" ? "platform wallet" : "mined earnings"}.`,
        );
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to purchase mining package");
      }
    });
  };

  return (
    <Card className="relative flex flex-col overflow-hidden border-2 border-primary/25 bg-card shadow-md">
      <div className="bg-primary/90 py-2 text-center text-sm font-semibold uppercase tracking-wide text-primary-foreground">
        {plan.idealFor ?? "Mining plan"}
      </div>
      <CardContent className="flex flex-1 flex-col gap-4 px-5 pb-2 pt-5 text-center">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-foreground">{plan.name}</h3>
          {plan.idealFor ? (
            <p className="text-sm text-muted-foreground">{plan.idealFor}</p>
          ) : null}
        </div>

        <HeroPrice amount={plan.priceUSD} />

        {roi !== undefined ? (
          <p className="text-lg font-bold uppercase leading-snug text-emerald-600 dark:text-emerald-400">
            You earn {formatCurrency(displayDailyUsd)} daily
            <span className="mt-1 block text-xs font-normal normal-case text-muted-foreground">
              at {formatCurrency(plan.priceUSD)} shown — {roi}% per day on your committed amount
            </span>
          </p>
        ) : (
          <p className="text-sm text-amber-600 dark:text-amber-400">Legacy plan — contact support</p>
        )}

        <div className="flex flex-col gap-2 border-y border-border py-3">
          <p className="text-lg font-semibold text-primary">
            {plan.hashRate.toLocaleString(undefined, { maximumFractionDigits: 0 })} {plan.hashRateUnit}
          </p>
          <ul className="space-y-1.5 text-sm text-primary">
            <li>{formatContractLabel(plan.duration)}</li>
            <li>SHA-256 mining algorithm</li>
            <li className="capitalize">{(plan.renewalType ?? "manual") === "auto" ? "Auto" : "Manual"} renewal</li>
            <li>Zero maintenance fee</li>
          </ul>
        </div>

        {plan.features.length > 0 ? (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {plan.features.slice(0, 4).map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-col gap-2 px-5 pb-5">
        <Dialog>
          <DialogTrigger asChild>
            <Button
              className="w-full rounded-full py-6 text-base font-bold uppercase"
              size="lg"
              disabled={!canStartPurchase || isPurchasing || roi === undefined}
            >
              {isPurchasing ? "Processing…" : "Get this"}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Purchase {plan.name}</DialogTitle>
              <DialogDescription>
                {commitmentSummary(plan, fundingSource)} Choose which asset you want credited for
                daily rewards.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-semibold">Pay from</p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={fundingSource === "platform" ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setFundingSource("platform")}
                  >
                    Platform wallet
                  </Button>
                  <Button
                    type="button"
                    variant={fundingSource === "mining" ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setFundingSource("mining")}
                  >
                    Mined earnings
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {fundingSource === "platform"
                    ? "Uses your deposit / USD-like platform balance only."
                    : "Reinvests using your mining wallet. Amounts use the same reference rates as the dashboard."}
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/40 p-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {fundingSource === "platform" ? "Platform (USD-like)" : "Mined (approx. USD)"}
                  </span>
                  <span className="font-semibold">{formatCurrency(walletUsd)}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-muted-foreground">Committed amount</span>
                  <span className="font-semibold">{formatCurrency(committedAmount)}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span className="text-muted-foreground">Daily ROI</span>
                  <span className="font-semibold">{roi !== undefined ? `${roi}%` : "—"}</span>
                </div>
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold">Mine with</p>
                <div className="grid grid-cols-2 gap-2">
                  {plan.supportedCoins.map((coin) => (
                    <Button
                      key={coin}
                      variant="outline"
                      className="w-full"
                      onClick={() => handlePurchase(coin)}
                      disabled={isPurchasing || !canAfford}
                    >
                      {coin}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <p className="text-center text-[11px] text-muted-foreground">
          Rewards accrue daily to your platform wallet after the scheduled run.
        </p>
      </CardFooter>
    </Card>
  );
}

type PlansMarketplaceProps = {
  plans: Plan[];
  userId: string;
  platformUsd: number;
  miningUsd: number;
};

export function PlansMarketplace({
  plans,
  userId,
  platformUsd,
  miningUsd,
}: PlansMarketplaceProps) {
  if (plans.length === 0) {
    return (
      <Card className="border-border/60 bg-card/80">
        <CardContent className="py-12 text-center">
          <p className="text-sm text-muted-foreground">No plans available at the moment.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto grid max-w-lg gap-8 sm:max-w-none sm:grid-cols-2 sm:gap-6 lg:max-w-5xl">
      {plans.map((plan) => (
        <PlanCard
          key={plan._id}
          plan={plan}
          userId={userId}
          platformUsd={platformUsd}
          miningUsd={miningUsd}
        />
      ))}
    </div>
  );
}
