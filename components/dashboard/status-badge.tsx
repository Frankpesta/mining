type Status =
  | "pending"
  | "approved"
  | "rejected"
  | "completed"
  | "failed"
  | "paused"
  | "active";

const toneByStatus: Record<Status, string> = {
  pending: "bg-amber-100/70 text-amber-700 dark:bg-amber-700/20 dark:text-amber-200",
  approved: "bg-emerald-100/70 text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200",
  completed: "bg-emerald-100/70 text-emerald-700 dark:bg-emerald-700/20 dark:text-emerald-200",
  rejected: "bg-rose-100/70 text-rose-700 dark:bg-rose-700/20 dark:text-rose-200",
  failed: "bg-rose-100/70 text-rose-700 dark:bg-rose-700/20 dark:text-rose-200",
  paused: "bg-slate-200/80 text-slate-600 dark:bg-slate-700/30 dark:text-slate-200",
  active: "bg-sky-100/70 text-sky-700 dark:bg-sky-700/20 dark:text-sky-200",
};

export function StatusBadge({ status }: { status: Status }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  const tone = toneByStatus[status] ?? "bg-muted text-muted-foreground";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tone}`}>
      {label}
    </span>
  );
}

