"use client";

import { useTransition } from "react";
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

const planFormSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  hashRate: z.number().positive("Hash rate must be positive"),
  hashRateUnit: z.enum(["TH/s", "GH/s", "MH/s"]),
  duration: z.number().positive("Duration must be positive"),
  minPriceUSD: z.number().positive("Minimum price must be positive"),
  maxPriceUSD: z.number().positive("Maximum price must be positive").optional(),
  priceUSD: z.number().positive("Price must be positive"),
  supportedCoins: z.string().min(1, "At least one coin is required"),
  minDailyROI: z.number().positive("Minimum daily ROI must be positive"),
  maxDailyROI: z.number().positive("Maximum daily ROI must be positive"),
  estimatedDailyEarning: z.number().nonnegative("Daily earning must be non-negative"),
  isActive: z.boolean(),
  features: z.string().min(1, "At least one feature is required"),
  idealFor: z.string().optional(),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

type PlanFormProps = {
  planId?: string;
  initialValues?: Partial<PlanFormValues>;
  onSubmit: (values: PlanFormValues) => Promise<void>;
  onCancel?: () => void;
};

export function PlanForm({ planId, initialValues, onSubmit, onCancel }: PlanFormProps) {
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
      minDailyROI: initialValues?.minDailyROI ?? 0,
      maxDailyROI: initialValues?.maxDailyROI ?? 0,
      estimatedDailyEarning: initialValues?.estimatedDailyEarning ?? 0,
      isActive: initialValues?.isActive ?? true,
      features: initialValues?.features ?? "",
      idealFor: initialValues?.idealFor ?? "",
    },
  });

  async function handleSubmit(values: PlanFormValues) {
    startSubmit(async () => {
      try {
        await onSubmit(values);
        toast.success(planId ? "Plan updated successfully" : "Plan created successfully");
        if (!planId && onCancel) {
          onCancel();
        }
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
                  <Input {...field} placeholder="e.g., Starter Plan" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="minPriceUSD"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Price (USD)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>Minimum entry amount</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxPriceUSD"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Price (USD)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </FormControl>
                <FormDescription>Maximum entry amount (leave empty for unlimited)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priceUSD"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display Price (USD)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>Default/display price</FormDescription>
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
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-4">
            <FormField
              control={form.control}
              name="minDailyROI"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Min Daily ROI (%)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>Minimum daily ROI percentage</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxDailyROI"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Max Daily ROI (%)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormDescription>Maximum daily ROI percentage</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="estimatedDailyEarning"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated daily earning</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="number"
                    step="0.01"
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormDescription>Estimated daily earnings in USD (for display)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="idealFor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ideal For</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., small investors, corporate investors" />
                </FormControl>
                <FormDescription>Target audience description</FormDescription>
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
                  <Input {...field} placeholder="BTC,ETH,LTC (comma-separated)" />
                </FormControl>
                <FormDescription>Enter coin symbols separated by commas</FormDescription>
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
                    placeholder="Feature 1, Feature 2, Feature 3 (one per line or comma-separated)"
                    rows={4}
                  />
                </FormControl>
                <FormDescription>List plan features, one per line or comma-separated</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
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

