"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { reviewBankWithdrawal } from "@/app/(admin)/admin/bank-withdrawals/actions";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

type AdminBankWithdrawal = {
  _id: string;
  userEmail: string | null;
  amount: number;
  crypto: string;
  currency: string;
  balanceSource: "platform" | "mining";
  status: "pending" | "approved" | "completed" | "rejected" | "failed";
  createdAt: number;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  accountType?: "checking" | "savings" | null;
  routingNumber?: string | null;
  swiftCode?: string | null;
  iban?: string | null;
  bankAddress?: string | null;
  bankCountry: string;
  adminNote?: string | null;
  userNote?: string | null;
};

type BankWithdrawReviewCardProps = {
  bankWithdrawal: AdminBankWithdrawal;
};

export function BankWithdrawReviewCard({ bankWithdrawal }: BankWithdrawReviewCardProps) {
  const router = useRouter();
  const [adminNote, setAdminNote] = useState(bankWithdrawal.adminNote ?? "");
  const [isPending, startTransition] = useTransition();

  const isActionable = bankWithdrawal.status === "pending" || bankWithdrawal.status === "approved";

  const handleReview = (status: "approved" | "completed" | "rejected" | "failed") => {
    if (!isActionable) {
      return;
    }

    startTransition(async () => {
      const response = await reviewBankWithdrawal({
        bankWithdrawalId: bankWithdrawal._id,
        status,
        adminNote,
      });

      if (response.success) {
        toast.success(`Bank withdrawal ${status}.`);
        router.refresh();
      } else {
        toast.error(response.error ?? "Unable to update bank withdrawal.");
      }
    });
  };

  return (
    <article className="space-y-4 rounded-lg border border-border/60 bg-card/70 p-5 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">{bankWithdrawal.userEmail ?? "Unknown user"}</p>
          <p className="text-xs text-muted-foreground">
            Submitted {formatDate(bankWithdrawal.createdAt)} •{" "}
            {bankWithdrawal.balanceSource === "mining" ? "Mining earnings" : "Platform wallet"}
          </p>
          {bankWithdrawal.userNote ? (
            <p className="mt-1 text-xs text-muted-foreground">
              User note: {bankWithdrawal.userNote}
            </p>
          ) : null}
        </div>
        <StatusBadge status={bankWithdrawal.status} />
      </header>

      <dl className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <div>
          <dt className="font-semibold text-foreground">Debited amount</dt>
          <dd>
            {bankWithdrawal.amount.toLocaleString()} {bankWithdrawal.crypto}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">Payout currency</dt>
          <dd>{bankWithdrawal.currency}</dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">Account type</dt>
          <dd className="capitalize">{bankWithdrawal.accountType ?? "Not specified"}</dd>
        </div>
      </dl>

      <dl className="grid gap-2 rounded-md border border-border/50 bg-muted/30 p-3 text-xs sm:grid-cols-2">
        <div>
          <dt className="font-semibold text-foreground">Account holder</dt>
          <dd className="text-muted-foreground">{bankWithdrawal.accountHolderName}</dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">Bank name</dt>
          <dd className="text-muted-foreground">{bankWithdrawal.bankName}</dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">Account number</dt>
          <dd className="font-mono text-muted-foreground">{bankWithdrawal.accountNumber}</dd>
        </div>
        <div>
          <dt className="font-semibold text-foreground">Bank country</dt>
          <dd className="text-muted-foreground">{bankWithdrawal.bankCountry}</dd>
        </div>
        {bankWithdrawal.routingNumber ? (
          <div>
            <dt className="font-semibold text-foreground">Routing number</dt>
            <dd className="font-mono text-muted-foreground">{bankWithdrawal.routingNumber}</dd>
          </div>
        ) : null}
        {bankWithdrawal.swiftCode ? (
          <div>
            <dt className="font-semibold text-foreground">SWIFT / BIC</dt>
            <dd className="font-mono text-muted-foreground">{bankWithdrawal.swiftCode}</dd>
          </div>
        ) : null}
        {bankWithdrawal.iban ? (
          <div>
            <dt className="font-semibold text-foreground">IBAN</dt>
            <dd className="font-mono text-muted-foreground">{bankWithdrawal.iban}</dd>
          </div>
        ) : null}
        {bankWithdrawal.bankAddress ? (
          <div className="sm:col-span-2">
            <dt className="font-semibold text-foreground">Bank address</dt>
            <dd className="text-muted-foreground">{bankWithdrawal.bankAddress}</dd>
          </div>
        ) : null}
      </dl>

      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Admin note</label>
        <Textarea
          value={adminNote}
          onChange={(event) => setAdminNote(event.target.value)}
          placeholder="Document wire confirmation, reference numbers, or feedback."
          disabled={!isActionable}
        />
      </div>

      {isActionable ? (
        <footer className="flex flex-wrap items-center gap-3">
          {bankWithdrawal.status === "pending" ? (
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
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() => handleReview("completed")}
              >
                {isPending ? "Updating..." : "Mark completed"}
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
          )}
        </footer>
      ) : null}
    </article>
  );
}
