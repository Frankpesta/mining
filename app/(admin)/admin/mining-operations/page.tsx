import { api } from "@/convex/_generated/api";
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
        <h1 className="text-2xl font-semibold tracking-tight">Mining operations</h1>
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
            <div className="overflow-x-auto">
              <Table className="min-w-[1100px]">
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
                  {operations.map((op) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
