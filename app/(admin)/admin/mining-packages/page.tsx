import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { PlanForm } from "@/components/admin/plan-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getConvexClient } from "@/lib/convex/client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { createPlan, deletePlan, togglePlanStatus, updatePlan } from "./actions";
import { PlanActions } from "./plan-actions";

export default async function AdminMiningPackagesPage() {
  const convex = getConvexClient();
  const plans = await convex.query(api.plans.listPlans, { activeOnly: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Manage Mining Packages</h1>
          <p className="text-sm text-muted-foreground">
            Create, update, and publish mining contracts with customizable features and pricing.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm">New Mining Package</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create new mining package</DialogTitle>
              <DialogDescription>Add a new mining package to the marketplace.</DialogDescription>
            </DialogHeader>
            <PlanForm
              onSubmit={async (values) => {
                "use server";
                await createPlan(values);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-border/60 bg-card/80">
        <CardHeader>
          <CardTitle>All Mining Packages</CardTitle>
          <CardDescription>Manage your mining package catalog</CardDescription>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No mining packages created yet. Create your first mining package to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[1100px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Hash Rate</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Daily Earning</TableHead>
                    <TableHead>Coins</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan: Doc<"plans">) => (
                    <TableRow key={plan._id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>
                        {plan.hashRate} {plan.hashRateUnit}
                      </TableCell>
                      <TableCell>{plan.duration} days</TableCell>
                      <TableCell>{formatCurrency(plan.priceUSD)}</TableCell>
                      <TableCell>{formatCurrency(plan.estimatedDailyEarning)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {plan.supportedCoins.map((coin) => (
                            <span
                              key={coin}
                              className="rounded bg-muted px-2 py-0.5 text-xs font-medium"
                            >
                              {coin}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            plan.isActive
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {plan.isActive ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(plan.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <PlanActions plan={plan} />
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
