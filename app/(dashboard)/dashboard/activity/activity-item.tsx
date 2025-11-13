import { Activity, Coins, TrendingUp, Wallet } from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { formatCurrency, formatDate } from "@/lib/utils";

type ActivityItem = {
  type: "audit" | "deposit" | "withdrawal" | "mining";
  id: string;
  timestamp: number;
  [key: string]: any;
};

type ActivityItemProps = {
  item: ActivityItem;
};

const typeIcons = {
  audit: Activity,
  deposit: Wallet,
  withdrawal: Wallet,
  mining: TrendingUp,
};

const typeColors = {
  audit: "text-blue-500",
  deposit: "text-emerald-500",
  withdrawal: "text-amber-500",
  mining: "text-purple-500",
};

export function ActivityItem({ item }: ActivityItemProps) {
  const Icon = typeIcons[item.type] ?? Activity;
  const iconColor = typeColors[item.type] ?? "text-muted-foreground";

  return (
    <div className="flex gap-4 rounded-lg border border-border/60 p-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted ${iconColor}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 space-y-1">
        {item.type === "deposit" && (
          <>
            <div className="flex items-center justify-between">
              <p className="font-semibold">Deposit</p>
              <StatusBadge status={item.status === "approved" ? "approved" : item.status === "rejected" ? "rejected" : "pending"} />
            </div>
            <p className="text-sm text-muted-foreground">
              {item.amount.toLocaleString()} {item.crypto}
            </p>
            <p className="text-xs text-muted-foreground">{formatDate(item.timestamp)}</p>
          </>
        )}

        {item.type === "withdrawal" && (
          <>
            <div className="flex items-center justify-between">
              <p className="font-semibold">Withdrawal</p>
              <StatusBadge
                status={
                  item.status === "completed"
                    ? "approved"
                    : item.status === "failed" || item.status === "rejected"
                      ? "rejected"
                      : "pending"
                }
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {item.amount.toLocaleString()} {item.crypto}
            </p>
            <p className="text-xs text-muted-foreground">{formatDate(item.timestamp)}</p>
          </>
        )}

        {item.type === "mining" && (
          <>
            <div className="flex items-center justify-between">
              <p className="font-semibold">Mining operation</p>
              <StatusBadge
                status={
                  item.status === "active"
                    ? "active"
                    : item.status === "completed"
                      ? "approved"
                      : "pending"
                }
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {item.coin} • {item.hashRate} hash rate
            </p>
            <p className="text-xs text-muted-foreground">{formatDate(item.timestamp)}</p>
          </>
        )}

        {item.type === "audit" && (
          <>
            <div className="flex items-center justify-between">
              <p className="font-semibold capitalize">{item.action.replace(":", " ")}</p>
            </div>
            <p className="text-sm text-muted-foreground capitalize">
              {item.entity} {item.entityId ? `#${item.entityId.slice(-8)}` : ""}
            </p>
            <p className="text-xs text-muted-foreground">{formatDate(item.timestamp)}</p>
          </>
        )}
      </div>
    </div>
  );
}

