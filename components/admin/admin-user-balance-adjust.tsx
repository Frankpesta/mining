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
import { adjustUserPlatformBalance } from "@/app/(admin)/admin/users/actions";
import { ArrowDownLeft, ArrowUpRight, Wallet } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

const ASSETS = ["USDC", "USDT", "ETH", "BTC"] as const;
type PlatformCrypto = (typeof ASSETS)[number];

type AdminUserBalanceAdjustProps = {
  userId: Id<"users">;
  userEmail: string;
};

function stepForAsset(a: PlatformCrypto): string {
  if (a === "BTC") return "0.00000001";
  if (a === "ETH") return "0.000001";
  return "0.01";
}

export function AdminUserBalanceAdjust({ userId, userEmail }: AdminUserBalanceAdjustProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"add" | "subtract">("add");
  const [asset, setAsset] = useState<PlatformCrypto>("USDC");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  function resetForm() {
    setAmount("");
    setNote("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a valid positive amount.");
      return;
    }

    start(async () => {
      try {
        await adjustUserPlatformBalance({
          userId,
          crypto: asset,
          amount: n,
          direction: mode,
          note: note.trim() || undefined,
        });
        toast.success(
          mode === "add"
            ? `Added ${n} ${asset} to the account.`
            : `Removed ${n} ${asset} from the account.`,
        );
        resetForm();
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Balance adjustment failed.");
      }
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
              <CardTitle className="text-lg">Adjust platform balance</CardTitle>
              <CardDescription className="mt-1 max-w-xl">
                Credit or debit this user&apos;s wallet balances in native units (e.g. USDC amount for
                USDC). Changes are recorded in the audit log.
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
              <Label htmlFor="balance-asset">Asset</Label>
              <Select
                value={asset}
                onValueChange={(v) => setAsset(v as PlatformCrypto)}
              >
                <SelectTrigger id="balance-asset" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASSETS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="balance-amount">Amount ({asset})</Label>
              <Input
                id="balance-amount"
                type="number"
                inputMode="decimal"
                step={stepForAsset(asset)}
                min={0}
                placeholder={asset === "BTC" ? "0.00000000" : asset === "ETH" ? "0.00" : "0.00"}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="font-mono tabular-nums"
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
            <Button type="submit" disabled={pending} variant={mode === "subtract" ? "destructive" : "default"}>
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
