import { redirect } from "next/navigation";

import { signOutAction } from "@/app/(dashboard)/actions";
import { AppShell } from "@/components/layout/app-shell";
import type { SidebarNavItem } from "@/components/dashboard/sidebar-nav";
import { getCurrentUser, requireAdminSession } from "@/lib/auth/session";

const navigation = [
  { href: "/admin", label: "Overview", icon: "shield-check" },
  { href: "/admin/deposits", label: "Deposits", icon: "wallet-minimal" },
  { href: "/admin/withdrawals", label: "Withdrawals", icon: "compass" },
  { href: "/admin/mining-packages", label: "Mining Packages", icon: "bar-chart-3" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/profiles", label: "Profiles", icon: "users" },
  { href: "/admin/referrals", label: "Referrals", icon: "activity" },
  { href: "/admin/tickets", label: "Tickets", icon: "message-square" },
  { href: "/admin/mining-operations", label: "Mining Ops", icon: "activity" },
  { href: "/admin/analytics", label: "Analytics", icon: "bar-chart-3" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
] satisfies SidebarNavItem[];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdminSession();
  const current = await getCurrentUser();

  if (!current || current.user.role !== "admin") {
    redirect("/dashboard");
  }

  const { user } = current;

  return (
    <AppShell
      brand={{ initials: "HH", title: "Admin Console", subtitle: "HashHorizon" }}
      navigation={navigation}
      user={user}
      signOutAction={signOutAction}
      headerDescription={user.email}
    >
      {children}
    </AppShell>
  );
}

