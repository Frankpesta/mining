"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { updatePlatformSetting } from "@/app/(admin)/admin/settings/platform-actions";

type PlatformSettingsProps = {
  initialSettings: Record<string, any>;
};

export function PlatformSettings({ initialSettings }: PlatformSettingsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [settings, setSettings] = useState({
    maintenanceMode: initialSettings.maintenanceMode ?? false,
    withdrawalMinEth: initialSettings.withdrawalMinEth ?? 0.01,
    withdrawalMinUsdt: initialSettings.withdrawalMinUsdt ?? 25,
    withdrawalMinUsdc: initialSettings.withdrawalMinUsdc ?? 25,
    platformAnnouncement: initialSettings.platformAnnouncement ?? "",
    emailDepositSubject: initialSettings.emailDepositSubject ?? "Deposit Approved",
    emailDepositBody: initialSettings.emailDepositBody ?? "Your deposit has been approved.",
    emailWithdrawalSubject: initialSettings.emailWithdrawalSubject ?? "Withdrawal Processed",
    emailWithdrawalBody: initialSettings.emailWithdrawalBody ?? "Your withdrawal has been processed.",
  });

  const handleSave = async (key: string, value: any) => {
    startTransition(async () => {
      try {
        await updatePlatformSetting(key, value);
        toast.success("Setting updated successfully");
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update setting");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Maintenance Mode */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-semibold">Maintenance Mode</Label>
            <p className="text-sm text-muted-foreground">
              When enabled, users will see a maintenance message and cannot perform actions
            </p>
          </div>
          <Switch
            checked={settings.maintenanceMode}
            onCheckedChange={(checked) => {
              setSettings((prev) => ({ ...prev, maintenanceMode: checked }));
              handleSave("maintenanceMode", checked);
            }}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Withdrawal Limits */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold mb-2">Withdrawal Minimum Limits</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Set minimum withdrawal amounts for each cryptocurrency
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="minEth">Minimum ETH</Label>
            <Input
              id="minEth"
              type="number"
              step="0.001"
              value={settings.withdrawalMinEth}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, withdrawalMinEth: parseFloat(e.target.value) || 0 }))
              }
              onBlur={() => handleSave("withdrawalMinEth", settings.withdrawalMinEth)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minUsdt">Minimum USDT</Label>
            <Input
              id="minUsdt"
              type="number"
              step="0.01"
              value={settings.withdrawalMinUsdt}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, withdrawalMinUsdt: parseFloat(e.target.value) || 0 }))
              }
              onBlur={() => handleSave("withdrawalMinUsdt", settings.withdrawalMinUsdt)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minUsdc">Minimum USDC</Label>
            <Input
              id="minUsdc"
              type="number"
              step="0.01"
              value={settings.withdrawalMinUsdc}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, withdrawalMinUsdc: parseFloat(e.target.value) || 0 }))
              }
              onBlur={() => handleSave("withdrawalMinUsdc", settings.withdrawalMinUsdc)}
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {/* Platform Announcement */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="announcement" className="text-base font-semibold">
            Platform Announcement
          </Label>
          <p className="text-sm text-muted-foreground mb-2">
            Display a message to all users at the top of their dashboard
          </p>
        </div>
        <Textarea
          id="announcement"
          value={settings.platformAnnouncement}
          onChange={(e) => setSettings((prev) => ({ ...prev, platformAnnouncement: e.target.value }))}
          onBlur={() => handleSave("platformAnnouncement", settings.platformAnnouncement)}
          placeholder="Enter platform-wide announcement..."
          rows={3}
          disabled={isPending}
        />
      </div>

      {/* Email Templates */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold mb-2">Email Notification Templates</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Customize email templates sent to users for deposits and withdrawals
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="depositSubject">Deposit Approval Email Subject</Label>
            <Input
              id="depositSubject"
              value={settings.emailDepositSubject}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, emailDepositSubject: e.target.value }))
              }
              onBlur={() => handleSave("emailDepositSubject", settings.emailDepositSubject)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="depositBody">Deposit Approval Email Body</Label>
            <Textarea
              id="depositBody"
              value={settings.emailDepositBody}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, emailDepositBody: e.target.value }))
              }
              onBlur={() => handleSave("emailDepositBody", settings.emailDepositBody)}
              rows={3}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="withdrawalSubject">Withdrawal Processed Email Subject</Label>
            <Input
              id="withdrawalSubject"
              value={settings.emailWithdrawalSubject}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, emailWithdrawalSubject: e.target.value }))
              }
              onBlur={() => handleSave("emailWithdrawalSubject", settings.emailWithdrawalSubject)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="withdrawalBody">Withdrawal Processed Email Body</Label>
            <Textarea
              id="withdrawalBody"
              value={settings.emailWithdrawalBody}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, emailWithdrawalBody: e.target.value }))
              }
              onBlur={() => handleSave("emailWithdrawalBody", settings.emailWithdrawalBody)}
              rows={3}
              disabled={isPending}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

