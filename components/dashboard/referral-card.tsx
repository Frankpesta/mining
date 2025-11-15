"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

type ReferralData = {
  referralCode: string;
  totalReferrals: number;
  awardedReferrals: number;
  totalBonusEarned: number;
  referralBonusEarned: number;
};

export function ReferralCard({ referral }: { referral: ReferralData }) {
  const [copied, setCopied] = useState(false);

  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/auth/signup?ref=${referral.referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle>Referral Program</CardTitle>
        <CardDescription>
          Share your referral link and earn bonuses when others sign up.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">Your Referral Code</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md bg-muted px-3 py-2 text-sm font-mono">
              {referral.referralCode}
            </code>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Total Referrals</p>
            <p className="text-2xl font-semibold">{referral.totalReferrals}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Awarded</p>
            <p className="text-2xl font-semibold">{referral.awardedReferrals}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Bonus Earned</p>
            <p className="text-2xl font-semibold">
              {formatCurrency(referral.referralBonusEarned)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

