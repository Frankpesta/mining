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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { api } from "@/convex/_generated/api";
import { useConvex } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";

type ReferralSettings = {
  referralBonusAmount: number;
  isEnabled: boolean;
};

export function ReferralSettingsForm({
  initialSettings,
  adminId,
}: {
  initialSettings: ReferralSettings;
  adminId: Id<"users">;
}) {
  const convex = useConvex();
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState(initialSettings);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        await convex.mutation(api.referrals.updateReferralSettings, {
          referralBonusAmount: settings.referralBonusAmount,
          isEnabled: settings.isEnabled,
          adminId,
        });
        toast.success("Referral settings have been updated successfully.");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update settings");
      }
    });
  };

  return (
    <Card className="border-border/60 bg-card/80">
      <CardHeader>
        <CardTitle>Referral Settings</CardTitle>
        <CardDescription>Configure referral bonus amounts and enable/disable the system.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bonusAmount">Referral Bonus Amount (USD)</Label>
            <Input
              id="bonusAmount"
              type="number"
              step="0.01"
              min="0"
              value={settings.referralBonusAmount}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  referralBonusAmount: parseFloat(e.target.value) || 0,
                })
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              Amount awarded to referrer when someone signs up using their code.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled">Enable Referral System</Label>
              <p className="text-xs text-muted-foreground">
                When disabled, new referrals won't be processed.
              </p>
            </div>
            <Switch
              id="enabled"
              checked={settings.isEnabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, isEnabled: checked })
              }
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? "Saving..." : "Save Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

