"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Pencil, Trash2, Power } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlanForm } from "@/components/admin/plan-form";
import { toast } from "@/components/ui/use-toast";
import { deletePlan, togglePlanStatus, updatePlan } from "./actions";
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
  minDailyROI?: number;
  maxDailyROI?: number;
  estimatedDailyEarning: number;
  isActive: boolean;
  features: string[];
  idealFor?: string;
};

type PlanActionsProps = {
  plan: Plan;
};

export function PlanActions({ plan }: PlanActionsProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, startDelete] = useTransition();

  const handleDelete = () => {
    if (!confirm(`Are you sure you want to delete "${plan.name}"? This action cannot be undone.`)) {
      return;
    }

    startDelete(async () => {
      try {
        await deletePlan(plan._id);
        toast.success("Mining package deleted successfully");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to delete mining package");
      }
    });
  };

  const handleToggleStatus = async () => {
    try {
      await togglePlanStatus(plan._id, !plan.isActive);
      toast.success(`Mining package ${plan.isActive ? "deactivated" : "activated"} successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update mining package status");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleToggleStatus}>
            <Power className="mr-2 h-4 w-4" />
            {plan.isActive ? "Deactivate" : "Activate"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit mining package</DialogTitle>
            <DialogDescription>Update mining package details and settings.</DialogDescription>
          </DialogHeader>
          <PlanForm
            planId={plan._id}
            initialValues={{
              name: plan.name,
              hashRate: plan.hashRate,
              hashRateUnit: plan.hashRateUnit,
              duration: plan.duration,
              minPriceUSD: plan.minPriceUSD ?? plan.priceUSD,
              maxPriceUSD: plan.maxPriceUSD,
              priceUSD: plan.priceUSD,
              supportedCoins: plan.supportedCoins.join(", "),
              minDailyROI: plan.minDailyROI ?? 0,
              maxDailyROI: plan.maxDailyROI ?? 0,
              estimatedDailyEarning: plan.estimatedDailyEarning,
              isActive: plan.isActive,
              features: plan.features.join("\n"),
              idealFor: plan.idealFor,
            }}
            onSubmit={async (values) => {
              try {
                await updatePlan({ ...values, planId: plan._id });
                toast.success("Mining package updated successfully");
                setIsEditOpen(false);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Failed to update mining package");
              }
            }}
            onCancel={() => setIsEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

