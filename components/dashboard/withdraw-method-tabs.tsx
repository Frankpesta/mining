"use client";

import { useState } from "react";

import { BankWithdrawForm } from "@/components/dashboard/bank-withdraw-form";
import { WithdrawForm } from "@/components/dashboard/withdraw-form";
import { cn } from "@/lib/utils";

type WithdrawMethod = "crypto" | "bank";

type WithdrawMethodTabsProps = {
  platformBalances: Record<string, number>;
  miningBalances: Record<string, number>;
};

export function WithdrawMethodTabs({ platformBalances, miningBalances }: WithdrawMethodTabsProps) {
  const [method, setMethod] = useState<WithdrawMethod>("crypto");

  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-md border border-border/60 bg-muted/40 p-1 text-sm">
        <button
          type="button"
          onClick={() => setMethod("crypto")}
          className={cn(
            "rounded-sm px-3 py-1.5 font-medium transition-colors",
            method === "crypto"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Crypto
        </button>
        <button
          type="button"
          onClick={() => setMethod("bank")}
          className={cn(
            "rounded-sm px-3 py-1.5 font-medium transition-colors",
            method === "bank"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Bank transfer
        </button>
      </div>

      {method === "crypto" ? (
        <WithdrawForm platformBalances={platformBalances} miningBalances={miningBalances} />
      ) : (
        <BankWithdrawForm platformBalances={platformBalances} miningBalances={miningBalances} />
      )}
    </div>
  );
}
