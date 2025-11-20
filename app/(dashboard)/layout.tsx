import { notFound, redirect } from "next/navigation";

import { signOutAction } from "@/app/(dashboard)/actions";
import { AppShell } from "@/components/layout/app-shell";
import type { SidebarNavItem } from "@/components/dashboard/sidebar-nav";
import { getCurrentUser } from "@/lib/auth/session";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: "home" },
  { href: "/dashboard/purchase-hashpower", label: "Purchase HashPower", icon: "wallet" },
  { href: "/dashboard/mining-packages", label: "Mining Packages", icon: "layers" },
  { href: "/dashboard/mining", label: "Mining Ops", icon: "gauge" },
  { href: "/dashboard/activity", label: "Activity", icon: "chart-line" },
  { href: "/dashboard/wallet", label: "Wallet", icon: "coins" },
  { href: "/dashboard/withdraw", label: "Withdraw", icon: "waypoints" },
  { href: "/dashboard/tickets", label: "Support", icon: "message-square" },
  { href: "/dashboard/profile", label: "Profile", icon: "users" },
] satisfies SidebarNavItem[];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const current = await getCurrentUser();
  if (!current) {
    notFound();
  }

  const { user } = current;

  if (user.role === "admin") {
    redirect("/admin");
  }

  return (
    <AppShell
      brand={{ initials: "BH", title: "blockhashpro", subtitle: "Mining Marketplace" }}
      navigation={navigation}
      user={user}
      signOutAction={signOutAction}
      headerDescription={user.email}
    >
      {children}
    </AppShell>
  );
}