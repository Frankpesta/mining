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

type Crypto = "ETH" | "USDT" | "USDC";

type WithdrawFormProps = {
  balances: Record<Crypto, number>;
};

const MINIMUMS: Record<Crypto, number> = {
  ETH: 0.01,
  USDT: 25,
  USDC: 25,
};

export function WithdrawForm({ balances }: WithdrawFormProps) {
  const [isSubmitting, startSubmit] = useTransition();
  const availableCryptos = ["ETH", "USDT", "USDC"].filter(
    (asset) => balances[asset as Crypto] !== undefined,
  ) as Crypto[];
  const defaultCrypto = availableCryptos[0] ?? "USDT";

  const form = useForm<WithdrawalRequestInput>({
    resolver: zodResolver(withdrawalRequestSchema),
    defaultValues: {
      crypto: defaultCrypto,
      amount: "",
      destinationAddress: "",
      requestedFee: "",
      note: "",
    },
  });

  const crypto = form.watch("crypto") as Crypto;
  const rawAmount = form.watch("amount");
  const amount = Number(rawAmount) || 0;
  const available = balances[crypto] ?? 0;
  const networkFee = useMemo(() => getWithdrawalFee(crypto, amount), [crypto, amount]);
  const finalAmount = amount > networkFee ? amount - networkFee : 0;
  const minimum = MINIMUMS[crypto] ?? 0;

  useEffect(() => {
    form.setValue("requestedFee", networkFee);
  }, [form, networkFee]);

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
          name="crypto"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Asset</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {availableCryptos.map((asset) => (
                    <option key={asset} value={asset}>
                      {asset} • Available {balances[asset].toLocaleString()}
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
            const stringValue: string = typeof field.value === "string" ? field.value : (field.value?.toString() ?? "");
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value)}
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

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Submitting…" : "Request withdrawal"}
        </Button>
      </form>
    </Form>
  );
}

