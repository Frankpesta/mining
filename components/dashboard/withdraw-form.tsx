"use client";

import React from "react";
import { useEffect, useMemo, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { submitWithdrawalRequest } from "@/app/(dashboard)/dashboard/withdraw/actions";
import {
  withdrawalRequestSchema,
  type WithdrawalRequestInput,
  type WithdrawalRequestValues,
} from "@/app/(dashboard)/dashboard/withdraw/validators";
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
import { getWithdrawalFee } from "@/lib/payments/fees";

type BalanceSource = "platform" | "mining";

type WithdrawFormProps = {
  platformBalances: Record<string, number>;
  miningBalances: Record<string, number>;
};

const PLATFORM_ORDER = ["ETH", "USDT", "USDC", "BTC"] as const;

/** Minimum withdrawal amounts — extend as you add assets. */
const MINIMUMS: Record<string, number> = {
  ETH: 0.01,
  USDT: 25,
  USDC: 25,
  BTC: 0.0001,
  LTC: 0.01,
  SOL: 0.01,
  BNB: 0.001,
  ADA: 1,
  XRP: 1,
  DOGE: 1,
  DOT: 0.1,
  MATIC: 1,
  AVAX: 0.01,
  ATOM: 0.01,
  LINK: 0.1,
  UNI: 0.1,
};

function minimumFor(crypto: string): number {
  return MINIMUMS[crypto] ?? 0.001;
}

export function WithdrawForm({ platformBalances, miningBalances }: WithdrawFormProps) {
  const [isSubmitting, startSubmit] = useTransition();

  const miningAssetList = useMemo(
    () =>
      Object.keys(miningBalances)
        .filter((k) => miningBalances[k] > 0)
        .sort(),
    [miningBalances],
  );

  const miningDisabled = miningAssetList.length === 0;

  const form = useForm<WithdrawalRequestInput>({
    resolver: zodResolver(withdrawalRequestSchema),
    defaultValues: {
      balanceSource: "platform",
      crypto: "USDT",
      amount: "",
      destinationAddress: "",
      requestedFee: "",
      note: "",
    },
  });

  const balanceSource = form.watch("balanceSource") as BalanceSource;
  const crypto = form.watch("crypto") as string;
  const rawAmount = form.watch("amount");
  const amount = Number(rawAmount) || 0;

  const available =
    balanceSource === "platform"
      ? platformBalances[crypto] ?? 0
      : miningBalances[crypto] ?? 0;

  const networkFee = useMemo(() => getWithdrawalFee(crypto, amount), [crypto, amount]);
  const finalAmount = amount > networkFee ? amount - networkFee : 0;
  const minimum = minimumFor(crypto);

  useEffect(() => {
    form.setValue("requestedFee", networkFee);
  }, [form, networkFee]);

  useEffect(() => {
    if (miningDisabled && balanceSource === "mining") {
      form.setValue("balanceSource", "platform");
    }
  }, [miningDisabled, balanceSource, form]);

  /** Keep crypto valid when switching balance source */
  useEffect(() => {
    if (balanceSource === "platform") {
      const ok = PLATFORM_ORDER.some((c) => c === crypto);
      if (!ok) {
        form.setValue("crypto", PLATFORM_ORDER[0] ?? "USDT");
      }
    } else {
      if (!miningAssetList.includes(crypto)) {
        form.setValue("crypto", miningAssetList[0] ?? "BTC");
      }
    }
  }, [balanceSource, crypto, miningAssetList, form]);

  async function handleSubmit(rawValues: WithdrawalRequestInput) {
    const parsed = withdrawalRequestSchema.safeParse(rawValues);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid withdrawal request.");
      return;
    }

    const values: WithdrawalRequestValues = {
      ...parsed.data,
      requestedFee: networkFee,
    };

    if (balanceSource === "mining" && miningAssetList.length === 0) {
      toast.error("No mining earnings available to withdraw.");
      return;
    }

    if (values.amount < minimum) {
      toast.error(`Minimum withdrawal for ${values.crypto} is ${minimum}.`);
      return;
    }

    if (values.amount > available) {
      toast.error(`Insufficient ${values.crypto} balance. Available: ${available}.`);
      return;
    }

    startSubmit(async () => {
      const response = await submitWithdrawalRequest(values);
      if (response.success) {
        toast.success(
          `Withdrawal submitted. Estimated network fee ${response.fee} ${values.crypto}.`,
        );
        form.reset({
          balanceSource: values.balanceSource,
          crypto: values.crypto,
          amount: "",
          destinationAddress: "",
          requestedFee: "",
          note: "",
        });
      } else {
        toast.error(response.error ?? "Unable to submit withdrawal request.");
      }
    });
  }

  return (
    <Form {...form}>
      <form className="space-y-5" onSubmit={form.handleSubmit(handleSubmit)}>
        <FormField
          control={form.control}
          name="balanceSource"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Withdraw from</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="platform">
                    Platform (deposit) balance — ETH, USDT, USDC, BTC
                  </option>
                  <option value="mining" disabled={miningDisabled}>
                    Mining earnings — BTC, ETH, LTC, …
                    {miningDisabled ? " (no balance)" : ""}
                  </option>
                </select>
              </FormControl>
              <FormDescription>
                Deposits and stablecoin rewards sit in your platform wallet. Accrued mining rewards
                are tracked separately until you withdraw them from mining earnings.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="crypto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {balanceSource === "platform"
                    ? PLATFORM_ORDER.map((asset) => (
                        <option key={asset} value={asset}>
                          {asset} • Available {(platformBalances[asset] ?? 0).toLocaleString()}
                        </option>
                      ))
                    : miningAssetList.map((asset) => (
                        <option key={asset} value={asset}>
                          {asset} • Available {(miningBalances[asset] ?? 0).toLocaleString()}
                        </option>
                      ))}
                </select>
              </FormControl>
              <FormDescription>
                Minimum withdrawal: {minimum} {crypto}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => {
            const stringValue: string =
              typeof field.value === "string" ? field.value : (field.value?.toString() ?? "");
            return (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    min={minimum}
                    max={available}
                    placeholder={`Enter amount in ${crypto}`}
                    value={stringValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      field.onChange(e.target.value)
                    }
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormDescription>
                  Available: {available.toLocaleString()} {crypto}
                </FormDescription>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="destinationAddress"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Destination address</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="0x... or exchange address"
                  spellCheck={false}
                  autoComplete="off"
                />
              </FormControl>
              <FormDescription>
                Double-check the address. Withdrawals are irreversible once executed.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note for admins (optional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Add context for this withdrawal (optional)"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="rounded-md border border-dashed border-border/60 bg-muted/40 p-3 text-xs">
          <p className="flex items-center justify-between">
            <span>Estimated network fee</span>
            <span className="font-semibold">
              {networkFee.toFixed(6)} {crypto}
            </span>
          </p>
          <p className="flex items-center justify-between">
            <span>Estimated payout</span>
            <span className="font-semibold">
              {finalAmount > 0 ? finalAmount.toFixed(6) : "—"} {crypto}
            </span>
          </p>
        </div>

        <Button
          type="submit"
          disabled={
            isSubmitting ||
            (balanceSource === "mining" && miningAssetList.length === 0)
          }
          className="w-full"
        >
          {isSubmitting ? "Submitting…" : "Request withdrawal"}
        </Button>
      </form>
    </Form>
  );
}
