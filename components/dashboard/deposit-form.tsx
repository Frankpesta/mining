"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { submitDepositRequest } from "@/app/(dashboard)/dashboard/purchase-hashpower/actions";
import {
  depositRequestSchema,
  type DepositRequestInput,
  type DepositRequestValues,
} from "@/app/(dashboard)/dashboard/purchase-hashpower/validators";
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
import { toast } from "@/components/ui/use-toast";

type Crypto = "ETH" | "BTC";

type WalletOption = {
  crypto: Crypto;
  address: string;
  label?: string | null;
};

type DepositFormProps = {
  wallets: WalletOption[];
  minimums?: Partial<Record<Crypto, number>>;
};

const DEFAULT_MINIMUMS: Record<Crypto, number> = {
  ETH: 0.01,
  BTC: 0.0001,
};

export function DepositForm({ wallets, minimums }: DepositFormProps) {
  const [isSubmitting, startSubmit] = useTransition();

  const walletMap = wallets.reduce<Record<Crypto, WalletOption>>((accumulator, wallet) => {
    accumulator[wallet.crypto] = wallet;
    return accumulator;
  }, {} as Record<Crypto, WalletOption>);

  const defaultCrypto: Crypto = wallets[0]?.crypto ?? "ETH";
  const isDisabled = wallets.length === 0;

  const form = useForm<DepositRequestInput>({
    resolver: zodResolver(depositRequestSchema),
    defaultValues: {
      crypto: defaultCrypto,
      amount: "",
      txHash: "",
    },
  });

  const selectedCrypto = form.watch("crypto") as Crypto;
  const selectedWallet = selectedCrypto ? walletMap[selectedCrypto] : undefined;
  const minAmount = minimums?.[selectedCrypto] ?? DEFAULT_MINIMUMS[selectedCrypto] ?? 0;

  async function handleSubmit(rawValues: DepositRequestInput) {
    const parsed = depositRequestSchema.safeParse(rawValues);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid deposit request.");
      return;
    }

    const values: DepositRequestValues = parsed.data;

    if (minAmount && values.amount < minAmount) {
      toast.error(`Minimum deposit for ${values.crypto} is ${minAmount}.`);
      return;
    }

    startSubmit(async () => {
      const response = await submitDepositRequest(values);
      if (response.success) {
        toast.success("Deposit request submitted. We'll notify you once it's approved.");
        form.reset({
          crypto: values.crypto,
          amount: "",
          txHash: "",
        });
      } else {
        toast.error(response.error ?? "Unable to submit deposit request.");
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
                  disabled={isDisabled}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {wallets.map((wallet) => (
                    <option key={wallet.crypto} value={wallet.crypto}>
                      {wallet.crypto} {wallet.label ? `• ${wallet.label}` : ""}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormDescription>
                Minimum deposit: {minAmount} {selectedCrypto}
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
                    min={minAmount ?? 0}
                    placeholder={`Enter amount in ${selectedCrypto}`}
                    disabled={isDisabled}
                    value={stringValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
              </FormControl>
              <FormDescription>
                Funds must be sent from an address you control. Deposits are credited after admin
                review.
              </FormDescription>
              <FormMessage />
            </FormItem>
            );
          }}
        />

        <FormField
          control={form.control}
          name="txHash"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Transaction hash (optional)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="0x..."
                  autoComplete="off"
                  spellCheck={false}
                  inputMode="text"
                  disabled={isDisabled}
                />
              </FormControl>
              <FormDescription>
                Provide the transaction hash to expedite review once you transfer the funds.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {selectedWallet ? (
          <div className="rounded-md border border-dashed border-primary/40 bg-primary/10 p-3 text-xs">
            <p className="font-semibold uppercase tracking-wide text-primary">
              Deposit address ({selectedWallet.crypto})
            </p>
            <p className="mt-1 font-mono text-sm break-all">{selectedWallet.address}</p>
            <button
              type="button"
              className="mt-2 inline-flex items-center text-xs font-semibold text-primary"
              onClick={() => handleCopy(selectedWallet.address)}
            >
              Copy address
            </button>
          </div>
        ) : null}

        {isDisabled ? (
          <p className="text-center text-xs text-muted-foreground">
            No deposit wallets available. Contact an administrator to configure deposit addresses.
          </p>
        ) : null}

        <Button type="submit" disabled={isSubmitting || isDisabled} className="w-full">
          {isSubmitting ? "Submitting…" : "Submit deposit request"}
        </Button>
      </form>
    </Form>
  );
}

async function handleCopy(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success("Address copied to clipboard");
  } catch (error) {
    toast.error("Unable to copy address. Copy manually instead.");
  }
}

