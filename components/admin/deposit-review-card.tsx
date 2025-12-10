"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { reviewDeposit } from "@/app/(admin)/admin/deposits/actions";
import { verifyDepositTx } from "@/app/(admin)/admin/deposits/verify-actions";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

type AdminDeposit = {
  _id: string;
  userEmail: string | null;
  amount: number;
  crypto: "ETH" | "BTC" | "USDT" | "USDC";
  status: "pending" | "approved" | "rejected";
  createdAt: number;
  walletAddress: string;
  txHash?: string | null;
  adminNote?: string | null;
};

export function DepositReviewCard({ deposit }: { deposit: AdminDeposit }) {
  const router = useRouter();
  const [adminNote, setAdminNote] = useState(deposit.adminNote ?? "");
  const [txHash, setTxHash] = useState(deposit.txHash ?? "");
  const [isPending, startTransition] = useTransition();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    confirmed: boolean;
    actualAmount?: number;
    actualTo?: string;
    blockNumber?: bigint;
    error?: string;
  } | null>(null);
  const isActionable = deposit.status === "pending";

  const handleVerify = async () => {
    if (!txHash || txHash.trim() === "") {
      toast.error("Please enter a transaction hash first");
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const result = await verifyDepositTx(
        txHash,
        deposit.walletAddress,
        deposit.amount,
        deposit.crypto,
      );

      setVerificationResult(result);

      if (result.isValid) {
        toast.success(
          result.confirmed
            ? "Transaction verified and confirmed on-chain"
            : "Transaction verified (pending confirmation)",
        );
      } else {
        toast.error(result.error ?? "Transaction verification failed");
      }
    } catch (error) {
      toast.error("Failed to verify transaction");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReview = (status: "approved" | "rejected") => {
    if (!isActionable) {
      return;
    }
    startTransition(async () => {
      const response = await reviewDeposit({
        depositId: deposit._id,
        status,
        adminNote,
        txHash,
      });

      if (response.success) {
        toast.success(`Deposit ${status}.`);
        router.refresh();
      } else {
        toast.error(response.error ?? "Unable to update deposit.");
      }
    });
  };

  return (
    <article className="space-y-4 rounded-lg border border-border/60 bg-card/70 p-5 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{deposit.userEmail ?? "Unknown user"}</p>
          <p className="text-xs text-muted-foreground">
            Submitted {formatDate(deposit.createdAt)} • Wallet {deposit.walletAddress}
          </p>
        </div>
        <StatusBadge status={deposit.status} />
      </header>

      <dl className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <div>
          <dt className="font-semibold text-foreground">Amount</dt>
          <dd>
            {deposit.amount.toLocaleString()} {deposit.crypto}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">Tx hash</dt>
          <dd className="font-mono break-all">
            {txHash || deposit.txHash || "Pending submission"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">Wallet address</dt>
          <dd className="break-all">{deposit.walletAddress}</dd>
        </div>
      </dl>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground">Transaction hash</label>
          {txHash && isActionable && (deposit.crypto === "ETH" || deposit.crypto === "USDT" || deposit.crypto === "USDC") ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleVerify}
              disabled={isVerifying}
            >
              {isVerifying ? "Verifying..." : "Verify on-chain"}
            </Button>
          ) : deposit.crypto === "BTC" && isActionable ? (
            <span className="text-xs text-muted-foreground">BTC verification not available</span>
          ) : null}
        </div>
        <Input
          value={txHash}
          onChange={(event) => {
            setTxHash(event.target.value);
            setVerificationResult(null);
          }}
          placeholder={deposit.crypto === "BTC" ? "BTC transaction hash" : deposit.crypto === "ETH" || deposit.crypto === "USDT" || deposit.crypto === "USDC" ? "0x..." : "Transaction hash"}
          spellCheck={false}
          disabled={!isActionable}
        />
        {verificationResult ? (
          <div
            className={`rounded-md p-2 text-xs ${
              verificationResult.isValid
                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                : "bg-red-500/10 text-red-600 dark:text-red-400"
            }`}
          >
            {verificationResult.isValid ? (
              <>
                ✓ Transaction verified
                {verificationResult.confirmed ? " and confirmed" : " (pending confirmation)"}
              </>
            ) : (
              <>✗ Verification failed: {verificationResult.error ?? "Unknown error"}</>
            )}
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Admin note</label>
        <Textarea
          value={adminNote}
          onChange={(event) => setAdminNote(event.target.value)}
          placeholder="Document any reconciliation steps or feedback for the user."
          disabled={!isActionable}
        />
      </div>

      {isActionable ? (
        <footer className="flex flex-wrap items-center gap-3">
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
        </footer>
      ) : null}
    </article>
  );
}

