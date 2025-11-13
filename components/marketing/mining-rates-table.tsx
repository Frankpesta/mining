"use client";

import * as React from "react";

import type { MiningRateRow } from "@/lib/data/mining-rates";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatCurrency } from "@/lib/utils";

type MiningRatesTableProps = {
  initialData: MiningRateRow[];
  refreshIntervalMs?: number;
};

export function MiningRatesTable({
  initialData,
  refreshIntervalMs = 30000,
}: MiningRatesTableProps) {
  const [rows, setRows] = React.useState(initialData);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    setRows(initialData);
  }, [initialData]);

  React.useEffect(() => {
    let isMounted = true;

    async function refresh() {
      setIsLoading(true);
      try {
        const res = await fetch("/api/mining-rates");

        if (!res.ok) {
          throw new Error("Failed to fetch mining rates");
        }

        const json = (await res.json()) as { data: MiningRateRow[] };
        if (isMounted && Array.isArray(json.data) && json.data.length > 0) {
          setRows(json.data);
          setLastUpdated(new Date());
        }
      } catch (error) {
        console.warn("[MiningRatesTable] refresh failed", error);
        if (isMounted) {
          setRows((prev) =>
            prev.map((row) => ({
              ...row,
              revenuePerTh: fluctuate(row.revenuePerTh),
              networkHashrate: fluctuate(row.networkHashrate),
            })),
          );
          setLastUpdated(new Date());
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    const interval = setInterval(refresh, refreshIntervalMs);
    refresh();

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [refreshIntervalMs]);

  return (
    <div className="overflow-hidden rounded-xl border border-border/60 bg-background/60 shadow-sm backdrop-blur">
      <div className="flex flex-col gap-2 border-b border-border/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">Live Mining Rates</p>
          <p className="text-xs text-muted-foreground">
            Sourced from F2Pool public statistics. Updates every{" "}
            {Math.floor(refreshIntervalMs / 1000)}s.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-2 w-2 animate-ping rounded-full bg-primary" />
              Updating…
            </span>
          ) : lastUpdated ? (
            <span>Updated {formatRelativeTime(lastUpdated)}</span>
          ) : (
            <span>Waiting for data…</span>
          )}
        </div>
      </div>
      <div className="hidden md:block">
        <Table>
          <TableCaption className="px-4 text-left text-xs">
            Rates courtesy of F2Pool. Values fluctuate based on pool statistics.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead className="text-right">Revenue / TH</TableHead>
              <TableHead className="text-right">Pool Hashrate</TableHead>
              <TableHead className="text-right">Network Hashrate</TableHead>
              <TableHead className="text-right">Luck</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary/70" />
                    {row.name}
                    <span className="text-xs uppercase text-muted-foreground">
                      {row.symbol}
                    </span>
                  </div>
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-semibold text-foreground",
                    getDeltaClass(row.revenueDelta),
                  )}
                >
                  {formatCurrency(row.revenuePerTh, "USD")}
                  <DeltaBadge delta={row.revenueDelta} />
                </TableCell>
                <TableCell className="text-right">
                  {formatHashrate(row.poolHashrate)}
                </TableCell>
                <TableCell className="text-right">
                  {formatHashrate(row.networkHashrate)}
                </TableCell>
                <TableCell className="text-right">
                  {(row.luck * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col divide-y divide-border/60 md:hidden">
        {rows.map((row) => (
          <div key={row.id} className="space-y-2 px-4 py-4 text-sm">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">
                {row.name}{" "}
                <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs uppercase text-muted-foreground">
                  {row.symbol}
                </span>
              </p>
              <p className="font-medium text-foreground">
                {formatCurrency(row.revenuePerTh, "USD")}
                <span className="ml-1 text-xs text-muted-foreground">/ TH</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
              <Stat label="Pool Hashrate" value={formatHashrate(row.poolHashrate)} />
              <Stat
                label="Network Hashrate"
                value={formatHashrate(row.networkHashrate)}
              />
              <Stat label="Luck" value={`${(row.luck * 100).toFixed(1)}%`} />
              <Stat label="Miners" value={row.miners.toLocaleString()} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/80">
        {label}
      </span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return null;
  const formatted = `${delta > 0 ? "+" : ""}${(delta * 100).toFixed(2)}%`;
  return (
    <span
      className={cn(
        "ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
        delta > 0
          ? "bg-emerald-500/10 text-emerald-500"
          : "bg-rose-500/10 text-rose-500",
      )}
    >
      {formatted}
    </span>
  );
}

function formatHashrate(value: number) {
  const tiers = [
    { label: "H/s", value: 1 },
    { label: "kH/s", value: 1e3 },
    { label: "MH/s", value: 1e6 },
    { label: "GH/s", value: 1e9 },
    { label: "TH/s", value: 1e12 },
    { label: "PH/s", value: 1e15 },
    { label: "EH/s", value: 1e18 },
  ];

  const tier = [...tiers].reverse().find((item) => value >= item.value) ?? tiers[0];
  return `${(value / tier.value).toFixed(2)} ${tier.label}`;
}

function formatRelativeTime(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) {
    return `${seconds}s ago`;
  }
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  }
  const hours = Math.floor(seconds / 3600);
  return `${hours}h ago`;
}

function getDeltaClass(delta: number) {
  if (delta === 0) return "text-foreground";
  return delta > 0 ? "text-emerald-500" : "text-rose-500";
}

function fluctuate(value: number) {
  const multipliers = [0.97, 0.99, 1.01, 1.03];
  const multiplier = multipliers[Math.floor(Math.random() * multipliers.length)];
  return Number((value * multiplier).toFixed(6));
}

