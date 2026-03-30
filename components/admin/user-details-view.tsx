"use client";

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
import { formatCurrency, formatDate } from "@/lib/utils";
import { StatusBadge } from "@/components/dashboard/status-badge";
import type { Doc } from "@/convex/_generated/dataModel";
import { AdminUserBalanceAdjust } from "@/components/admin/admin-user-balance-adjust";

type UserDetails = {
  user: Doc<"users">;
  stats: {
    totalDeposits: number;
    totalWithdrawals: number;
    activeMiningOps: number;
    totalMiningOps: number;
  };
};

type UserDetailsViewProps = {
  userDetails: UserDetails;
  /** When true, shows credit/debit controls (admin user detail page). */
  showBalanceControls?: boolean;
};

export function UserDetailsView({ userDetails, showBalanceControls }: UserDetailsViewProps) {
  const { user, stats } = userDetails;

  const totalPlatformBalance =
    (user.platformBalance.ETH ?? 0) +
    (user.platformBalance.USDT ?? 0) +
    (user.platformBalance.USDC ?? 0) +
    (user.platformBalance.BTC ?? 0);

  const totalMiningBalance =
    (user.miningBalance.BTC ?? 0) +
    (user.miningBalance.ETH ?? 0) +
    (user.miningBalance.LTC ?? 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {showBalanceControls ? (
        <AdminUserBalanceAdjust userId={user._id} userEmail={user.email} />
      ) : null}

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>User account details and status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-sm">{user.email}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Role</p>
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                user.role === "admin"
                  ? "bg-purple-500/10 text-purple-500"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {user.role}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            {user.isSuspended ? (
              <span className="inline-flex rounded-full bg-destructive/10 px-2 py-1 text-xs font-semibold text-destructive">
                Suspended
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-semibold text-emerald-500">
                Active
              </span>
            )}
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Account Created
            </p>
            <p className="text-sm">{formatDate(user.createdAt)}</p>
          </div>
          {user.lastLogin && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Last Login
              </p>
              <p className="text-sm">{formatDate(user.lastLogin)}</p>
            </div>
          )}
          {user.referralCode && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Referral Code
              </p>
              <p className="text-sm font-mono">{user.referralCode}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>Balances</CardTitle>
          <CardDescription>Platform and mining balances</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Platform Balance
            </p>
            <div className="space-y-1 text-sm">
              {user.platformBalance.ETH > 0 && (
                <div className="flex justify-between">
                  <span>ETH</span>
                  <span>{user.platformBalance.ETH.toLocaleString()}</span>
                </div>
              )}
              {user.platformBalance.USDT > 0 && (
                <div className="flex justify-between">
                  <span>USDT</span>
                  <span>{user.platformBalance.USDT.toLocaleString()}</span>
                </div>
              )}
              {user.platformBalance.USDC > 0 && (
                <div className="flex justify-between">
                  <span>USDC</span>
                  <span>{user.platformBalance.USDC.toLocaleString()}</span>
                </div>
              )}
              {user.platformBalance.BTC && user.platformBalance.BTC > 0 && (
                <div className="flex justify-between">
                  <span>BTC</span>
                  <span>{user.platformBalance.BTC.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total (USD est.)</span>
                <span>{formatCurrency(totalPlatformBalance)}</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">
              Mining Balance
            </p>
            <div className="space-y-1 text-sm">
              {user.miningBalance.BTC > 0 && (
                <div className="flex justify-between">
                  <span>BTC</span>
                  <span>
                    {user.miningBalance.BTC.toLocaleString(undefined, {
                      minimumFractionDigits: 8,
                      maximumFractionDigits: 8,
                    })}
                  </span>
                </div>
              )}
              {user.miningBalance.ETH > 0 && (
                <div className="flex justify-between">
                  <span>ETH</span>
                  <span>
                    {user.miningBalance.ETH.toLocaleString(undefined, {
                      minimumFractionDigits: 8,
                      maximumFractionDigits: 8,
                    })}
                  </span>
                </div>
              )}
              {user.miningBalance.LTC > 0 && (
                <div className="flex justify-between">
                  <span>LTC</span>
                  <span>
                    {user.miningBalance.LTC.toLocaleString(undefined, {
                      minimumFractionDigits: 8,
                      maximumFractionDigits: 8,
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total</span>
                <span>
                  {totalMiningBalance.toLocaleString(undefined, {
                    minimumFractionDigits: 8,
                    maximumFractionDigits: 8,
                  })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
          <CardDescription>User activity summary</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Deposits
              </p>
              <p className="text-2xl font-semibold">{stats.totalDeposits}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Withdrawals
              </p>
              <p className="text-2xl font-semibold">{stats.totalWithdrawals}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Active Mining Ops
              </p>
              <p className="text-2xl font-semibold">{stats.activeMiningOps}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Mining Ops
              </p>
              <p className="text-2xl font-semibold">{stats.totalMiningOps}</p>
            </div>
          </div>
          {user.referralBonusEarned && user.referralBonusEarned > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Referral Bonus Earned
              </p>
              <p className="text-2xl font-semibold">
                {formatCurrency(user.referralBonusEarned)}
              </p>
            </div>
          )}
          {user.totalReferrals && user.totalReferrals > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Referrals
              </p>
              <p className="text-2xl font-semibold">{user.totalReferrals}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
