import { api } from "@/convex/_generated/api";
import { StatusBadge } from "@/components/dashboard/status-badge";
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
import { getCurrentUser } from "@/lib/auth/session";
import { getConvexClient } from "@/lib/convex/client";
import { formatDate } from "@/lib/utils";

function formatHashrate(hashRate: number, unit: string) {
  return `${hashRate.toLocaleString()} ${unit}`;
}

function calculateProgress(startTime: number, endTime: number) {
  const now = Date.now();
  const total = endTime - startTime;
  const elapsed = now - startTime;
  const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
  const remaining = Math.max(0, endTime - now);
  const daysRemaining = Math.ceil(remaining / (24 * 60 * 60 * 1000));
  return { progress, daysRemaining };
}

export default async function MiningPage() {
  const current = await getCurrentUser();
  if (!current) {
    return null;
  }

  const convex = getConvexClient();
  const [activeOps, completedOps, pausedOps] = await Promise.all([
    convex.query(api.miningOperations.listUserMiningOperations, {
      userId: current.user._id,
      status: "active",
    }),
    convex.query(api.miningOperations.listUserMiningOperations, {
      userId: current.user._id,
      status: "completed",
    }),
    convex.query(api.miningOperations.listUserMiningOperations, {
      userId: current.user._id,
      status: "paused",
    }),
  ]);

  const allOps = [...activeOps, ...pausedOps, ...completedOps];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Active mining operations</h1>
        <p className="text-sm text-muted-foreground">
          Track real-time performance of every mining package you&apos;ve activated, including hash rate,
          total mined coins, and estimated USD value.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{activeOps.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Paused</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{pausedOps.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/60 bg-card/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{completedOps.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>All operations</CardTitle>
          <CardDescription>View details and progress for all your mining contracts</CardDescription>
        </CardHeader>
        <CardContent>
          {allOps.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No mining operations yet. Purchase a mining package to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coin</TableHead>
                    <TableHead>Hash Rate</TableHead>
                    <TableHead>Total Mined</TableHead>
                    <TableHead>Daily Rate</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Started</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allOps.map((op) => {
                    const { progress, daysRemaining } = calculateProgress(op.startTime, op.endTime);
                    return (
                      <TableRow key={op._id}>
                        <TableCell className="font-medium">{op.coin}</TableCell>
                        <TableCell>{formatHashrate(op.hashRate, op.hashRateUnit)}</TableCell>
                        <TableCell>{op.totalMined.toFixed(6)}</TableCell>
                        <TableCell>${op.currentRate.toFixed(2)}/day</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>{progress.toFixed(1)}%</span>
                              <span className="text-muted-foreground">
                                {op.status === "active" && daysRemaining > 0
                                  ? `${daysRemaining} days left`
                                  : op.status === "completed"
                                    ? "Completed"
                                    : "Paused"}
                              </span>
                            </div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={
                              op.status === "active"
                                ? "active"
                                : op.status === "completed"
                                  ? "approved"
                                  : "pending"
                            }
                          />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(op.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
