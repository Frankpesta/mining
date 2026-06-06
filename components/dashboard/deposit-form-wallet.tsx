"use client";

import { useState, useTransition, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Wallet, Loader2, CheckCircle2 } from "lucide-react";

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
import { getCryptoPrices, type CryptoPrices } from "@/lib/crypto-prices";
import { STATIC_USD_PER_CRYPTO } from "@/lib/crypto-static-usd";
import { prepareDepositTransaction } from "@/lib/wallet/deposit";

type Crypto = "ETH" | "BTC" | "USDT";

type WalletOption = {
  crypto: Crypto;
  address: string;
  label?: string | null;
};

type DepositFormWalletProps = {
  wallets: WalletOption[];
  minimums?: Partial<Record<Crypto, number>>;
};

const DEFAULT_MINIMUMS: Record<Crypto, number> = {
  ETH: 0.01,
  BTC: 0.0001,
  USDT: 10,
};

export function DepositFormWallet({ wallets, minimums }: DepositFormWalletProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { sendTransaction, data: sendHash, isPending: isSendingTransaction } = useSendTransaction();
  const transactionHash = sendHash;
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });
  const [isSubmitting, startSubmit] = useTransition();
  const [submittedTxHash, setSubmittedTxHash] = useState<string>("");
  const [prices, setPrices] = useState<CryptoPrices>({});
  const [pendingWalletDeposit, setPendingWalletDeposit] = useState<{
    crypto: Crypto;
    amount: number;
  } | null>(null);

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
  const usdAmountValue = form.watch("amount");
  const selectedWallet = selectedCrypto ? walletMap[selectedCrypto] : undefined;
  const cryptoMinAmount = minimums?.[selectedCrypto] ?? DEFAULT_MINIMUMS[selectedCrypto] ?? 0;
  const selectedPrice = prices[selectedCrypto] ?? STATIC_USD_PER_CRYPTO[selectedCrypto] ?? 0;
  const usdAmount =
    typeof usdAmountValue === "string"
      ? parseFloat(usdAmountValue || "0")
      : typeof usdAmountValue === "number"
        ? usdAmountValue
        : 0;
  const cryptoEquivalent = selectedPrice > 0 && usdAmount > 0 ? usdAmount / selectedPrice : 0;
  const minUsdAmount = cryptoMinAmount * selectedPrice;

  useEffect(() => {
    const coins = Array.from(new Set(wallets.map((wallet) => wallet.crypto)));
    if (coins.length === 0) return;

    let isMounted = true;
    getCryptoPrices(coins).then((latestPrices) => {
      if (isMounted) {
        setPrices(latestPrices);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [wallets]);

  // Auto-submit deposit request when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && transactionHash && submittedTxHash !== transactionHash) {
      const amountValue = form.getValues("amount");
      const amountUsd: number = typeof amountValue === "string" 
        ? parseFloat(amountValue || "0") 
        : (typeof amountValue === "number" ? amountValue : 0);
      const crypto = pendingWalletDeposit?.crypto ?? selectedCrypto;
      const price = prices[crypto] ?? STATIC_USD_PER_CRYPTO[crypto] ?? 0;
      const amount = pendingWalletDeposit?.amount ?? (price > 0 ? amountUsd / price : 0);

      if (amount > 0 && transactionHash) {
        const txHash = transactionHash; // Capture for type safety in async callback
        setSubmittedTxHash(txHash);
        
        startSubmit(async () => {
          const response = await submitDepositRequest({
            crypto,
            amount,
            txHash,
          });

          if (response.success) {
            toast.success("Deposit request submitted automatically! Awaiting admin approval.");
            form.reset({
              crypto,
              amount: "",
              txHash: "",
            });
            setPendingWalletDeposit(null);
          } else {
            toast.error(response.error ?? "Failed to submit deposit request.");
          }
        });
      }
    }
  }, [isConfirmed, transactionHash, submittedTxHash, selectedCrypto, form, startSubmit, prices, pendingWalletDeposit]);

  const handleConnectWallet = (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId);
    if (connector) {
      connect({ connector });
    }
  };

  const handleSendTransaction = async (values: DepositRequestValues, cryptoAmount: number) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!selectedWallet) {
      toast.error("No wallet address configured for selected crypto");
      return;
    }

    try {
      if (values.crypto === "ETH") {
        const tx = prepareDepositTransaction(selectedWallet.address, cryptoAmount, values.crypto);
        if ("value" in tx) {
          setPendingWalletDeposit({ crypto: values.crypto, amount: cryptoAmount });
          sendTransaction({
            to: tx.to,
            value: tx.value,
          });
        } else {
          throw new Error("Invalid transaction format for ETH");
        }
      } else if (values.crypto === "BTC") {
        // BTC cannot be sent via wagmi (different blockchain)
        // User needs to send BTC manually and provide txHash
        toast.info("Please send BTC manually to the address shown above, then provide the transaction hash below.");
        return;
      } else if (values.crypto === "USDT") {
        // USDT is an ERC20 token, can be sent via contract
        const tx = prepareDepositTransaction(selectedWallet.address, cryptoAmount, values.crypto);
        if ("to" in tx && "data" in tx) {
          // For ERC20 tokens, we need to send a transaction to the token contract
          setPendingWalletDeposit({ crypto: values.crypto, amount: cryptoAmount });
          sendTransaction({
            to: tx.to as `0x${string}`,
            data: tx.data,
          });
        } else {
          throw new Error("Invalid transaction format for USDT");
        }
      } else {
        throw new Error(`Unsupported crypto: ${values.crypto}`);
      }

      toast.success("Transaction sent! Waiting for confirmation...");
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to send transaction");
    }
  };

  async function handleSubmit(rawValues: DepositRequestInput) {
    const parsed = depositRequestSchema.safeParse(rawValues);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid deposit request.");
      return;
    }

    const values: DepositRequestValues = parsed.data;
    const price = prices[values.crypto] ?? STATIC_USD_PER_CRYPTO[values.crypto] ?? 0;
    const cryptoAmount = price > 0 ? values.amount / price : 0;

    if (price <= 0 || cryptoAmount <= 0) {
      toast.error(`Unable to calculate the ${values.crypto} equivalent. Try again shortly.`);
      return;
    }

    const minUsd = (minimums?.[values.crypto] ?? DEFAULT_MINIMUMS[values.crypto] ?? 0) * price;
    if (minUsd && values.amount < minUsd) {
      toast.error(`Minimum deposit for ${values.crypto} is $${formatUsd(minUsd)}.`);
      return;
    }

    // If wallet is connected, send transaction automatically
    if (isConnected && address) {
      await handleSendTransaction(values, cryptoAmount);
      return;
    }

    // Otherwise, submit manual deposit request
    startSubmit(async () => {
      const response = await submitDepositRequest({
        ...values,
        amount: cryptoAmount,
      });
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

  const isLoading = isConnecting || isSendingTransaction || isConfirming || isSubmitting;
  const showTransactionStatus = transactionHash && (isConfirming || isConfirmed);

  return (
    <div className="space-y-4">
      {/* Wallet Connection Section */}
      {!isConnected ? (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-3 mb-3">
            <Wallet className="h-5 w-5 text-primary" />
            <div>
              <p className="font-semibold text-sm">Connect Wallet for Automatic Deposits</p>
              <p className="text-xs text-muted-foreground">
                Connect your wallet to send deposits directly from your account
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {connectors.map((connector) => (
              <Button
                key={connector.id}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleConnectWallet(connector.id)}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    {connector.name}
                  </>
                )}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-semibold text-sm">Wallet Connected</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </p>
              </div>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => disconnect()}>
              Disconnect
            </Button>
          </div>
        </div>
      )}

      {/* Transaction Status */}
      {showTransactionStatus && (
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex items-center gap-3">
            {isConfirming ? (
              <>
                <Loader2 className="h-5 w-5 text-blue-600 dark:text-blue-400 animate-spin" />
                <div>
                  <p className="font-semibold text-sm">Transaction Pending</p>
                  <p className="text-xs text-muted-foreground">Waiting for blockchain confirmation...</p>
                </div>
              </>
            ) : isConfirmed ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="font-semibold text-sm">Transaction Confirmed</p>
                  <p className="text-xs text-muted-foreground">Deposit request submitted automatically</p>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Deposit Form */}
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
                  Minimum deposit: ${formatUsd(minUsdAmount)} ({formatCryptoAmount(cryptoMinAmount, selectedCrypto)})
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
                  <FormLabel>Amount (USD)</FormLabel>
                  <FormControl>
                    <Input
                      {...({
                        type: "number",
                        step: "any",
                        min: minUsdAmount || 0,
                        placeholder: "Enter amount in USD",
                        disabled: isDisabled || isLoading,
                        value: stringValue,
                        onChange: (e: React.ChangeEvent<HTMLInputElement>) => field.onChange(e.target.value),
                        onBlur: field.onBlur,
                        name: field.name,
                        ref: field.ref,
                      } as React.InputHTMLAttributes<HTMLInputElement>)}
                    />
                  </FormControl>
                  <FormDescription>
                    {cryptoEquivalent > 0
                      ? `Equivalent to ${formatCryptoAmount(cryptoEquivalent, selectedCrypto)} at $${formatUsd(selectedPrice)} per ${selectedCrypto}.`
                      : "Enter a USD amount to see the crypto amount to send."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              );
            }}
          />

          {!isConnected && (
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
          )}

          {selectedWallet ? (
            <div className="rounded-md border border-dashed border-primary/40 bg-primary/10 p-3 text-xs">
              <p className="font-semibold uppercase tracking-wide text-primary">
                Deposit address ({selectedWallet.crypto})
              </p>
              <p className="mt-1 font-mono text-sm break-all">{selectedWallet.address}</p>
              {cryptoEquivalent > 0 ? (
                <p className="mt-2 font-semibold text-foreground">
                  Send {formatCryptoAmount(cryptoEquivalent, selectedWallet.crypto)} for ${formatUsd(usdAmount)}
                </p>
              ) : null}
              {!isConnected && (
                <button
                  type="button"
                  className="mt-2 inline-flex items-center text-xs font-semibold text-primary"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedWallet.address);
                    toast.success("Address copied to clipboard");
                  }}
                >
                  Copy address
                </button>
              )}
            </div>
          ) : null}

          {isDisabled ? (
            <p className="text-center text-xs text-muted-foreground">
              No deposit wallets available. Contact an administrator to configure deposit addresses.
            </p>
          ) : null}

          <Button type="submit" disabled={isLoading || isDisabled} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isConnecting
                  ? "Connecting..."
                  : isSendingTransaction
                    ? "Sending transaction..."
                    : isConfirming
                      ? "Confirming..."
                      : "Submitting..."}
              </>
            ) : isConnected ? (
              "Deposit from Wallet"
            ) : (
              "Submit deposit request"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}

function formatUsd(value: number) {
  if (!Number.isFinite(value)) return "0.00";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatCryptoAmount(value: number, crypto: Crypto) {
  if (!Number.isFinite(value)) return `0 ${crypto}`;
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: crypto === "USDT" ? 2 : 0,
    maximumFractionDigits: crypto === "USDT" ? 2 : 8,
  })} ${crypto}`;
}
