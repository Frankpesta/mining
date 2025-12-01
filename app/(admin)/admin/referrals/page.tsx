import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getConvexClient } from "@/lib/convex/client";
import { getCurrentUser } from "@/lib/auth/session";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ReferralManagement } from "@/components/admin/referral-management";
import { ReferralSettingsForm } from "@/components/admin/referral-settings-form";

export default async function AdminReferralsPage() {
  const current = await getCurrentUser();
  if (!current || current.user.role !== "admin") {
    return null;
  }

  const convex = getConvexClient();
  const [allReferrals, settings] = await Promise.all([
    convex.query(api.referrals.getAllReferrals, {}),
    convex.query(api.referrals.getReferralSettings, {}),
  ]);

  const totalReferrals = allReferrals.length;
  const awardedReferrals = allReferrals.filter((r: Doc<"referrals"> & { referrerEmail: string | null; referredUserEmail: string | null }) => r.status === "awarded").length;
  const pendingReferrals = allReferrals.filter((r: Doc<"referrals"> & { referrerEmail: string | null; referredUserEmail: string | null }) => r.status === "pending").length;
  const totalBonusPaid = allReferrals
    .filter((r: Doc<"referrals"> & { referrerEmail: string | null; referredUserEmail: string | null }) => r.status === "awarded")
    .reduce((sum: number, r: Doc<"referrals"> & { referrerEmail: string | null; referredUserEmail: string | null }) => sum + r.bonusAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Referral Management</h1>
        <p className="text-sm text-muted-foreground">
          Manage referral system, view referrals, and configure bonus settings.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalReferrals}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Awarded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{awardedReferrals}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{pendingReferrals}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Bonus Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatCurrency(totalBonusPaid)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReferralSettingsForm initialSettings={settings} adminId={current.user._id} />
        <ReferralManagement referrals={allReferrals} adminId={current.user._id} />
      </div>
    </div>
  );
}

