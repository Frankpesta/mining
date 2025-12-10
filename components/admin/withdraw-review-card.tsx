"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { reviewWithdrawal } from "@/app/(admin)/admin/withdrawals/actions";
import { executeWithdrawalTx } from "@/app/(admin)/admin/withdrawals/execute-actions";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

type AdminWithdrawal = {
  _id: string;
  userEmail: string | null;
  amount: number;
  finalAmount: number;
  networkFee: number;
  crypto: "ETH" | "USDT" | "USDC" | "BTC" | "SOL" | "LTC" | "BNB" | "ADA" | "XRP" | "DOGE" | "DOT" | "MATIC" | "AVAX" | "ATOM" | "LINK" | "UNI";
  status: "pending" | "approved" | "completed" | "rejected" | "failed";
  createdAt: number;
  destinationAddress: string;
  txHash?: string | null;
  adminNote?: string | null;
  userNote?: string | null;
};

type WithdrawReviewCardProps = {
  withdrawal: AdminWithdrawal;
  hotWalletAddress?: string;
};

export function WithdrawReviewCard({ withdrawal, hotWalletAddress }: WithdrawReviewCardProps) {
  const router = useRouter();
  const [adminNote, setAdminNote] = useState(withdrawal.adminNote ?? "");
  const [txHash, setTxHash] = useState(withdrawal.txHash ?? "");
  const [isPending, startTransition] = useTransition();
  const [isExecuting, setIsExecuting] = useState(false);

  const isActionable = withdrawal.status === "pending" || withdrawal.status === "approved";
  const canExecute = withdrawal.status === "approved" && hotWalletAddress && !txHash;

  const handleExecute = async () => {
    if (!hotWalletAddress) {
      toast.error("Hot wallet address not configured");
      return;
    }

    setIsExecuting(true);
    try {
      const result = await executeWithdrawalTx(withdrawal._id, hotWalletAddress);
      if (result.success && result.txHash) {
        setTxHash(result.txHash);
        toast.success(`Withdrawal executed. Tx hash: ${result.txHash}`);
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to execute withdrawal");
      }
    } catch (error) {
      toast.error("Failed to execute withdrawal");
    } finally {
      setIsExecuting(false);
    }
  };

  const handleReview = (status: "approved" | "completed" | "rejected" | "failed") => {
    if (!isActionable) {
      return;
    }

    startTransition(async () => {
      const response = await reviewWithdrawal({
        withdrawalId: withdrawal._id,
        status,
        adminNote,
        txHash,
      });

      if (response.success) {
        toast.success(`Withdrawal ${status}.`);
        router.refresh();
      } else {
        toast.error(response.error ?? "Unable to update withdrawal.");
      }
    });
  };

  return (
    <article className="space-y-4 rounded-lg border border-border/60 bg-card/70 p-5 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{withdrawal.userEmail ?? "Unknown user"}</p>
          <p className="text-xs text-muted-foreground">
            Submitted {formatDate(withdrawal.createdAt)} • {withdrawal.destinationAddress}
          </p>
          {withdrawal.userNote ? (
            <p className="mt-1 text-xs text-muted-foreground">User note: {withdrawal.userNote}</p>
          ) : null}
        </div>
        <StatusBadge status={withdrawal.status === "approved" ? "approved" : withdrawal.status} />
      </header>

      <dl className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <div>
          <dt className="font-semibold text-foreground">Requested amount</dt>
          <dd>
            {withdrawal.amount.toLocaleString()} {withdrawal.crypto}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">Network fee</dt>
          <dd>
            {withdrawal.networkFee} {withdrawal.crypto}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">Payout amount</dt>
          <dd>
            {withdrawal.finalAmount.toFixed(6)} {withdrawal.crypto}
          </dd>
        </div>
      </dl>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Transaction hash</label>
        <Input
          value={txHash}
          onChange={(event) => setTxHash(event.target.value)}
          placeholder="0x..."
          spellCheck={false}
          disabled={!isActionable}
        />
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Admin note</label>
        <Textarea
          value={adminNote}
          onChange={(event) => setAdminNote(event.target.value)}
          placeholder="Document any reconciliation steps or feedback."
          disabled={!isActionable}
        />
      </div>

      {withdrawal.txHash && withdrawal.status === "completed" ? (
        <p className="text-xs text-muted-foreground">
          Finalized with tx hash <span className="font-mono">{withdrawal.txHash}</span>
        </p>
      ) : null}

      {isActionable ? (
        <footer className="flex flex-wrap items-center gap-3">
          {withdrawal.status === "pending" ? (
            <>
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() => handleReview("approved")}
              >
                {isPending ? "Processing..." : "Approve"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={isPending}
                onClick={() => handleReview("rejected")}
              >
                Reject
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending}
                onClick={() => handleReview("failed")}
              >
                Mark failed
              </Button>
            </>
          ) : (
            <>
              {canExecute ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={isExecuting}
                  onClick={handleExecute}
                >
                  {isExecuting ? "Executing..." : "Execute on-chain"}
                </Button>
              ) : null}
              <Button
                type="button"
                size="sm"
                disabled={isPending || isExecuting}
                onClick={() => handleReview("completed")}
              >
                {isPending ? "Updating..." : "Mark completed"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isPending || isExecuting}
                onClick={() => handleReview("failed")}
              >
                Mark failed
              </Button>
            </>
          )}
        </footer>
      ) : null}
    </article>
  );
}

