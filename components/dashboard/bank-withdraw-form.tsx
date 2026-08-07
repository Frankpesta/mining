"use client";

import React from "react";
import { useEffect, useMemo, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { submitBankWithdrawalRequest } from "@/app/(dashboard)/dashboard/withdraw/actions";
import {
  bankWithdrawalRequestSchema,
  type BankWithdrawalRequestInput,
  type BankWithdrawalRequestValues,
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

type BalanceSource = "platform" | "mining";

type BankWithdrawFormProps = {
  platformBalances: Record<string, number>;
  miningBalances: Record<string, number>;
};

const PLATFORM_ORDER = ["ETH", "USDT", "USDC", "BTC"] as const;

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD", "NGN"] as const;

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

const selectClassName =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export function BankWithdrawForm({ platformBalances, miningBalances }: BankWithdrawFormProps) {
  const [isSubmitting, startSubmit] = useTransition();

  const miningAssetList = useMemo(
    () =>
      Object.keys(miningBalances)
        .filter((k) => miningBalances[k] > 0)
        .sort(),
    [miningBalances],
  );

  const miningDisabled = miningAssetList.length === 0;

  const form = useForm<BankWithdrawalRequestInput>({
    resolver: zodResolver(bankWithdrawalRequestSchema),
    defaultValues: {
      balanceSource: "platform",
      crypto: "USDT",
      amount: "",
      currency: "USD",
      accountHolderName: "",
      bankName: "",
      accountNumber: "",
      accountType: undefined,
      routingNumber: "",
      swiftCode: "",
      iban: "",
      bankAddress: "",
      bankCountry: "",
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

  const minimum = minimumFor(crypto);

  useEffect(() => {
    if (miningDisabled && balanceSource === "mining") {
      form.setValue("balanceSource", "platform");
    }
  }, [miningDisabled, balanceSource, form]);

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

  async function handleSubmit(rawValues: BankWithdrawalRequestInput) {
    const parsed = bankWithdrawalRequestSchema.safeParse(rawValues);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid withdrawal request.");
      return;
    }

    const values: BankWithdrawalRequestValues = parsed.data;

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
      const response = await submitBankWithdrawalRequest(values);
      if (response.success) {
        toast.success("Bank withdrawal request submitted.");
        form.reset({
          balanceSource: values.balanceSource,
          crypto: values.crypto,
          amount: "",
          currency: values.currency,
          accountHolderName: "",
          bankName: "",
          accountNumber: "",
          accountType: undefined,
          routingNumber: "",
          swiftCode: "",
          iban: "",
          bankAddress: "",
          bankCountry: "",
          note: "",
        });
      } else {
        toast.error(response.error ?? "Unable to submit bank withdrawal request.");
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
                <select {...field} className={selectClassName}>
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
                We debit the crypto equivalent from your balance and wire the fiat payout to your
                bank account.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="crypto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset to debit</FormLabel>
                <FormControl>
                  <select {...field} className={selectClassName}>
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
                  Minimum: {minimum} {crypto}
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
        </div>

        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payout currency</FormLabel>
              <FormControl>
                <select {...field} className={selectClassName}>
                  {CURRENCIES.map((currency) => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormDescription>
                The currency we&apos;ll wire to your bank account once approved.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4 rounded-md border border-border/60 p-4">
          <p className="text-sm font-semibold">Bank account details</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="accountHolderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account holder name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Full name on the account" autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Chase Bank" autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account number</FormLabel>
                  <FormControl>
                    <Input {...field} spellCheck={false} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="accountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account type (optional)</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      value={field.value ?? ""}
                      className={selectClassName}
                    >
                      <option value="">Not specified</option>
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="routingNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Routing number (US ACH)</FormLabel>
                  <FormControl>
                    <Input {...field} spellCheck={false} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="swiftCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SWIFT / BIC code</FormLabel>
                  <FormControl>
                    <Input {...field} spellCheck={false} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="iban"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>IBAN</FormLabel>
                  <FormControl>
                    <Input {...field} spellCheck={false} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankCountry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bank country</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. United States" autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="bankAddress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank address (optional)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Branch address" autoComplete="off" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <p className="text-xs text-muted-foreground">
            Provide at least one of routing number, SWIFT/BIC, or IBAN so we can route the wire
            correctly.
          </p>
        </div>

        <FormField
          control={form.control}
          name="note"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Note for admins (optional)</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Add context for this withdrawal (optional)" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting || (balanceSource === "mining" && miningAssetList.length === 0)}
          className="w-full"
        >
          {isSubmitting ? "Submitting…" : "Request bank withdrawal"}
        </Button>
      </form>
    </Form>
  );
}
