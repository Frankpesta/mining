import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { MiningOperationActions } from "@/components/admin/mining-operation-actions";
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
import { getConvexClient } from "@/lib/convex/client";
import { formatDate } from "@/lib/utils";

function formatHashrate(hashRate: number, unit: string) {
  return `${hashRate.toLocaleString()} ${unit}`;
}

export default async function AdminMiningOperationsPage() {
  const convex = getConvexClient();
  const [activeOps, pausedOps, allOps] = await Promise.all([
    convex.query(api.miningOperations.listAllMiningOperations, {
      status: "active",
      limit: 100,
    }),
    convex.query(api.miningOperations.listAllMiningOperations, {
      status: "paused",
      limit: 100,
    }),
    convex.query(api.miningOperations.listAllMiningOperations, { limit: 200 }),
  ]);

  const operations = [...activeOps, ...pausedOps].slice(0, 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">Mining operations</h1>
        <p className="text-sm text-muted-foreground">
          Inspect every active contract across the platform, pause problematic plans, and resume
          once issues resolve.
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{allOps.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>Operations overview</CardTitle>
          <CardDescription>Manage and monitor all mining operations</CardDescription>
        </CardHeader>
        <CardContent>
          {operations.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No mining operations found.
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden overflow-x-auto md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Coin</TableHead>
                      <TableHead>Hash Rate</TableHead>
                      <TableHead>Total Mined</TableHead>
                      <TableHead>Daily Rate</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Started</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operations.map((op: Doc<"miningOperations">) => (
                      <TableRow key={op._id}>
                        <TableCell className="font-medium">{op.userId}</TableCell>
                        <TableCell>{op.coin}</TableCell>
                        <TableCell>{formatHashrate(op.hashRate, op.hashRateUnit)}</TableCell>
                        <TableCell>{op.totalMined.toFixed(6)}</TableCell>
                        <TableCell>${op.currentRate.toFixed(2)}/day</TableCell>
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
                        <TableCell className="text-right">
                          <MiningOperationActions operation={op} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="flex flex-col gap-4 md:hidden">
                {operations.map((op: Doc<"miningOperations">) => (
                  <div
                    key={op._id}
                    className="rounded-lg border border-border/60 bg-card p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground">{op.coin}</h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          User: {op.userId}
                        </p>
                      </div>
                      <StatusBadge
                        status={
                          op.status === "active"
                            ? "active"
                            : op.status === "completed"
                              ? "approved"
                              : "pending"
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Hash Rate</span>
                        <span className="font-medium">{formatHashrate(op.hashRate, op.hashRateUnit)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Mined</span>
                        <span className="font-medium">{op.totalMined.toFixed(6)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Daily Rate</span>
                        <span className="font-medium">${op.currentRate.toFixed(2)}/day</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Started</span>
                        <span className="font-medium text-xs">{formatDate(op.createdAt)}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-border/60">
                      <MiningOperationActions operation={op} />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
