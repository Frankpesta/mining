import { api } from "@/convex/_generated/api";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";
import { getConvexClient } from "@/lib/convex/client";
import { formatDate } from "@/lib/utils";
import { ActivityItem } from "./activity-item";

export default async function ActivityPage() {
  const current = await getCurrentUser();
  if (!current) {
    return null;
  }

  const convex = getConvexClient();
  const activity = await convex.query(api.activity.getUserActivity, {
    userId: current.user._id,
    limit: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Activity timeline</h1>
        <p className="text-sm text-muted-foreground">
          Review mining performance, balance updates, and transaction history across custom time
          ranges.
        </p>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>All your platform activity in chronological order</CardDescription>
        </CardHeader>
        <CardContent>
          {activity.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No activity recorded yet.
            </div>
          ) : (
            <div className="space-y-4">
              {activity.map((item: {
                type: "audit" | "deposit" | "withdrawal" | "mining";
                id: string;
                timestamp: number;
                [key: string]: any;
              }) => (
                <ActivityItem key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
