"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

export type PlanFormSubmitResult = { ok: true } | { ok: false; message: string };

const planFormSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  hashRate: z.number().positive("Hash rate must be positive"),
  hashRateUnit: z.enum(["TH/s", "GH/s", "MH/s"]),
  duration: z.number().positive("Duration must be positive"),
  minPriceUSD: z.number().positive("Minimum price must be positive"),
  maxPriceUSD: z.number().positive("Maximum price must be positive").optional(),
  priceUSD: z.number().positive("Price must be positive"),
  supportedCoins: z.string().min(1, "At least one coin is required"),
  dailyRoiPercent: z
    .number()
    .positive("Daily ROI % must be greater than zero"),
  renewalType: z.enum(["manual", "auto"]),
  isActive: z.boolean(),
  features: z.string().min(1, "At least one feature is required"),
  idealFor: z.string().optional(),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

type PlanFormProps = {
  planId?: string;
  initialValues?: Partial<PlanFormValues>;
  onSubmit: (values: PlanFormValues) => Promise<void | PlanFormSubmitResult>;
  onCancel?: () => void;
};

export function PlanForm({ planId, initialValues, onSubmit, onCancel }: PlanFormProps) {
  const router = useRouter();
  const [isSubmitting, startSubmit] = useTransition();

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      hashRate: initialValues?.hashRate ?? 0,
      hashRateUnit: initialValues?.hashRateUnit ?? "TH/s",
      duration: initialValues?.duration ?? 30,
      minPriceUSD: initialValues?.minPriceUSD ?? 0,
      maxPriceUSD: initialValues?.maxPriceUSD,
      priceUSD: initialValues?.priceUSD ?? 0,
      supportedCoins: initialValues?.supportedCoins ?? "",
      dailyRoiPercent: initialValues?.dailyRoiPercent ?? 7,
      renewalType: initialValues?.renewalType ?? "manual",
      isActive: initialValues?.isActive ?? true,
      features: initialValues?.features ?? "",
      idealFor: initialValues?.idealFor ?? "",
    },
  });

  async function handleSubmit(values: PlanFormValues) {
    startSubmit(async () => {
      try {
        const result = await onSubmit(values);
        if (result && typeof result === "object" && "ok" in result && result.ok === false) {
          toast.error(result.message);
          return;
        }
        toast.success(planId ? "Plan updated successfully" : "Plan created successfully");
        router.refresh();
        onCancel?.();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : planId ? "Failed to update plan" : "Failed to create plan",
        );
      }
    });
  }

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="grid gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Micro Plan" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="idealFor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Audience label</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., Beginner (shown on card header)" />
                </FormControl>
                <FormDescription>Optional badge text above the plan name</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minPriceUSD"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min entry (USD)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>Minimum platform balance to start this contract</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxPriceUSD"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max entry (USD)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormDescription>Leave empty for no cap (uses full balance above min)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priceUSD"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display price (USD)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>Hero amount on marketing cards (e.g. minimum entry)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <FormField
              control={form.control}
              name="hashRate"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Hash rate</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hashRateUnit"
              render={({ field }) => (
                <FormItem className="w-32">
                  <FormLabel>Unit</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="TH/s">TH/s</option>
                      <option value="GH/s">GH/s</option>
                      <option value="MH/s">MH/s</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (days)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    onChange={(e) => field.onChange(parseInt(e.target.value, 10) || 0)}
                  />
                </FormControl>
                <FormDescription>e.g. 30 for one month, 90 for three months</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dailyRoiPercent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daily ROI (%)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>Percent of committed principal paid per day (e.g. 7 = 7%)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="renewalType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Renewal</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="manual">Manual — user must purchase again when the term ends</option>
                    <option value="auto">Auto — deducts the same commitment and extends if balance allows</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supportedCoins"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Supported coins</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="BTC, ETH (comma-separated)" />
                </FormControl>
                <FormDescription>Mining payout asset options for this plan</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="features"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Features</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="One feature per line or comma-separated"
                    rows={4}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 md:col-span-2">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Active status</FormLabel>
                  <FormDescription>Make this plan available for purchase</FormDescription>
                </div>
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : planId ? "Update plan" : "Create plan"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
