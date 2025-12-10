"use client";

import { useState, useTransition, useEffect } from "react";
import { useAccount, useConnect, useDisconnect, useWriteContract, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Wallet, Loader2, CheckCircle2 } from "lucide-react";
import { parseUnits } from "viem";

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
import { prepareDepositTransaction, type SupportedCrypto } from "@/lib/wallet/deposit";

type Crypto = "ETH" | "BTC";

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
};

export function DepositFormWallet({ wallets, minimums }: DepositFormWalletProps) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { writeContract, data: contractHash, isPending: isSendingContract } = useWriteContract();
  const { sendTransaction, data: sendHash, isPending: isSendingTransaction } = useSendTransaction();
  const transactionHash = contractHash || sendHash;
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: transactionHash,
  });
  const [isSubmitting, startSubmit] = useTransition();
  const [submittedTxHash, setSubmittedTxHash] = useState<string>("");

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

  // Auto-submit deposit request when transaction is confirmed
  useEffect(() => {
    if (isConfirmed && transactionHash && submittedTxHash !== transactionHash) {
      const amountValue = form.getValues("amount");
      const amount: number = typeof amountValue === "string" 
        ? parseFloat(amountValue || "0") 
        : (typeof amountValue === "number" ? amountValue : 0);
      if (amount > 0 && transactionHash) {
        const txHash = transactionHash; // Capture for type safety in async callback
        setSubmittedTxHash(txHash);
        
        startSubmit(async () => {
          const response = await submitDepositRequest({
            crypto: selectedCrypto,
            amount,
            txHash,
          });

          if (response.success) {
            toast.success("Deposit request submitted automatically! Awaiting admin approval.");
            form.reset({
              crypto: selectedCrypto,
              amount: "",
              txHash: "",
            });
          } else {
            toast.error(response.error ?? "Failed to submit deposit request.");
          }
        });
      }
    }
  }, [isConfirmed, transactionHash, submittedTxHash, selectedCrypto, form, startSubmit]);

  const handleConnectWallet = (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId);
    if (connector) {
      connect({ connector });
    }
  };

  const handleSendTransaction = async (values: DepositRequestValues) => {
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
        const tx = prepareDepositTransaction(selectedWallet.address, values.amount, values.crypto);
        if ("value" in tx) {
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

    if (minAmount && values.amount < minAmount) {
      toast.error(`Minimum deposit for ${values.crypto} is ${minAmount}.`);
      return;
    }

    // If wallet is connected, send transaction automatically
    if (isConnected && address) {
      await handleSendTransaction(values);
      return;
    }

    // Otherwise, submit manual deposit request
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

  const isLoading = isConnecting || isSendingContract || isSendingTransaction || isConfirming || isSubmitting;
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
                      {...({
                        type: "number",
                        step: "any",
                        min: minAmount ?? 0,
                        placeholder: `Enter amount in ${selectedCrypto}`,
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
                    {isConnected
                      ? "Click deposit to send transaction directly from your wallet"
                      : "Funds must be sent from an address you control. Deposits are credited after admin review."}
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
                  : isSendingContract || isSendingTransaction
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

