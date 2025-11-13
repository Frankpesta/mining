import { api } from "@/convex/_generated/api";
import { HotWalletManager } from "@/components/admin/hot-wallet-manager";
import { PlatformSettings } from "@/components/admin/platform-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getConvexClient } from "@/lib/convex/client";

export default async function AdminSettingsPage() {
  const convex = getConvexClient();
  const [hotWallets, platformSettings] = await Promise.all([
    convex.query(api.hotWallets.listHotWallets, {}),
    convex.query(api.platformSettings.getAllSettings, {}),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure wallet addresses, withdrawal limits, email templates, and maintenance windows.
        </p>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>Hot wallet management</CardTitle>
          <CardDescription>
            Configure deposit wallet addresses for ETH, USDT, and USDC. Users will send deposits
            to these addresses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HotWalletManager initialWallets={hotWallets} />
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>Platform configuration</CardTitle>
          <CardDescription>
            Manage withdrawal limits, maintenance mode, announcements, and email templates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlatformSettings initialSettings={platformSettings} />
        </CardContent>
      </Card>
    </div>
  );
}
