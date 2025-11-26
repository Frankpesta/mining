"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { toast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { api } from "@/convex/_generated/api";
import { useConvex } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { Award } from "lucide-react";

type Referral = {
  _id: Id<"referrals">;
  referrerId: Id<"users">;
  referredUserId: Id<"users">;
  bonusAmount: number;
  status: "pending" | "awarded" | "cancelled";
  awardedAt?: number;
  createdAt: number;
  referrerEmail: string | null;
  referredUserEmail: string | null;
};

export function ReferralManagement({
  referrals,
  adminId,
}: {
  referrals: Referral[];
  adminId: Id<"users">;
}) {
  const convex = useConvex();
  const [isPending, startTransition] = useTransition();
  const [processingId, setProcessingId] = useState<Id<"referrals"> | null>(null);

  const handleAward = (referralId: Id<"referrals">) => {
    setProcessingId(referralId);
    startTransition(async () => {
      try {
        await convex.mutation(api.referrals.awardReferralBonus, {
          referralId,
          adminId,
        });
        toast.success("Referral bonus has been awarded successfully.");
        window.location.reload();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to award bonus");
      } finally {
        setProcessingId(null);
      }
    });
  };

  const sortedReferrals = [...referrals].sort((a, b) => b.createdAt - a.createdAt);

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle>All Referrals</CardTitle>
        <CardDescription>View and manage all referral records.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Referrer</TableHead>
                <TableHead>Referred User</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedReferrals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No referrals found
                  </TableCell>
                </TableRow>
              ) : (
                sortedReferrals.map((referral) => (
                  <TableRow key={referral._id}>
                    <TableCell className="font-medium">
                      {referral.referrerEmail ?? "Unknown"}
                    </TableCell>
                    <TableCell>{referral.referredUserEmail ?? "Unknown"}</TableCell>
                    <TableCell>{formatCurrency(referral.bonusAmount)}</TableCell>
                    <TableCell>
                      <StatusBadge
                        status={
                          referral.status === "awarded"
                            ? "approved"
                            : referral.status === "pending"
                              ? "pending"
                              : "rejected"
                        }
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(referral.createdAt)}
                    </TableCell>
                    <TableCell>
                      {referral.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAward(referral._id)}
                          disabled={isPending && processingId === referral._id}
                        >
                          <Award className="mr-2 h-4 w-4" />
                          {isPending && processingId === referral._id ? "Awarding..." : "Award"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

