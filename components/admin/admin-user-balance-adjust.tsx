"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import {
  adjustUserBalance,
  type AdjustableCrypto,
  type AdjustableWallet,
} from "@/app/(admin)/admin/users/actions";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

const WALLET_OPTIONS: { value: AdjustableWallet; label: string; hint: string }[] = [
  {
    value: "platform",
    label: "Platform (deposit) wallet",
    hint: "ETH, USDT, USDC, BTC and other platform balances",
  },
  {
    value: "mining",
    label: "Mining earnings wallet",
    hint: "BTC, ETH, LTC and tracked mining rewards (not USDT/USDC)",
  },
];

const ALL_CRYPTOS: AdjustableCrypto[] = [
  "USDC",
  "USDT",
  "ETH",
  "BTC",
  "SOL",
  "LTC",
  "BNB",
  "ADA",
  "XRP",
  "DOGE",
  "DOT",
  "MATIC",
  "AVAX",
  "ATOM",
  "LINK",
  "UNI",
];

function cryptosForWallet(wallet: AdjustableWallet): AdjustableCrypto[] {
  if (wallet === "mining") {
    return ALL_CRYPTOS.filter((c) => c !== "USDT" && c !== "USDC");
  }
  return ALL_CRYPTOS;
}

function stepForAsset(a: AdjustableCrypto): string {
  if (a === "BTC") return "0.00000001";
  if (a === "ETH") return "0.000001";
  return "0.01";
}

type AdminUserBalanceAdjustProps = {
  userId: Id<"users">;
  userEmail: string;
};

export function AdminUserBalanceAdjust({ userId, userEmail }: AdminUserBalanceAdjustProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"add" | "subtract">("add");
  const [wallet, setWallet] = useState<AdjustableWallet>("platform");
  const [asset, setAsset] = useState<AdjustableCrypto>("USDC");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  const allowedCryptos = cryptosForWallet(wallet);

  function resetForm() {
    setAmount("");
    setNote("");
  }

  function handleWalletChange(w: AdjustableWallet) {
    setWallet(w);
    const next = cryptosForWallet(w);
    if (!next.includes(asset)) {
      setAsset(next[0] ?? "BTC");
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a valid positive amount.");
      return;
    }

    start(async () => {
      const result = await adjustUserBalance({
        userId,
        wallet,
        crypto: asset,
        amount: n,
        direction: mode,
        note: note.trim() || undefined,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(
        mode === "add"
          ? `Added ${n} ${asset} to ${wallet === "platform" ? "platform" : "mining"} balance.`
          : `Removed ${n} ${asset} from ${wallet === "platform" ? "platform" : "mining"} balance.`,
      );
      resetForm();
      router.refresh();
    });
  }

  return (
    <Card className="border-border/80 bg-gradient-to-br from-card via-card to-muted/25 shadow-sm ring-1 ring-border/60 lg:col-span-2">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">Adjust user balances</CardTitle>
              <CardDescription className="mt-1 max-w-xl">
                Credit or debit the platform (deposit) wallet or the mining earnings wallet. Amounts
                are in native asset units. USDT/USDC apply only to the platform wallet.
              </CardDescription>
            </div>
          </div>
          <p className="text-xs text-muted-foreground sm:text-right">
            <span className="font-medium text-foreground/80">{userEmail}</span>
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-wrap gap-2 rounded-lg border border-border/70 bg-muted/30 p-1">
            <Button
              type="button"
              variant={mode === "add" ? "default" : "ghost"}
              size="sm"
              className="gap-2 rounded-md"
              onClick={() => setMode("add")}
            >
              <ArrowDownLeft className="h-4 w-4" />
              Add funds
            </Button>
            <Button
              type="button"
              variant={mode === "subtract" ? "destructive" : "ghost"}
              size="sm"
              className="gap-2 rounded-md"
              onClick={() => setMode("subtract")}
            >
              <ArrowUpRight className="h-4 w-4" />
              Subtract funds
            </Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="balance-wallet">Wallet</Label>
              <Select
                value={wallet}
                onValueChange={(v) => handleWalletChange(v as AdjustableWallet)}
              >
                <SelectTrigger id="balance-wallet" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WALLET_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      <span className="font-medium">{o.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {WALLET_OPTIONS.find((w) => w.value === wallet)?.hint}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance-asset">Asset</Label>
              <Select
                value={asset}
                onValueChange={(v) => setAsset(v as AdjustableCrypto)}
              >
                <SelectTrigger id="balance-asset" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allowedCryptos.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="balance-amount">Amount ({asset})</Label>
              <Input
                id="balance-amount"
                type="number"
                inputMode="decimal"
                step={stepForAsset(asset)}
                min={0}
                placeholder={
                  asset === "BTC" ? "0.00000000" : asset === "ETH" ? "0.00" : "0.00"
                }
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono tabular-nums max-w-md"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="balance-note">Internal note (optional)</Label>
            <Textarea
              id="balance-note"
              rows={2}
              placeholder="Reason for adjustment — visible in audit logs"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="resize-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border/60 pt-4">
            <Button type="button" variant="outline" onClick={resetForm} disabled={pending}>
              Clear
            </Button>
            <Button
              type="submit"
              disabled={pending}
              variant={mode === "subtract" ? "destructive" : "default"}
            >
              {pending
                ? "Applying…"
                : mode === "add"
                  ? "Apply credit"
                  : "Apply debit"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
