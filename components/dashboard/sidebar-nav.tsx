"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  ChartLine,
  Coins,
  Compass,
  Gauge,
  Home,
  Layers,
  MessageSquare,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
  WalletMinimal,
  Waypoints,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const iconMap = {
  home: Home,
  wallet: Wallet,
  layers: Layers,
  gauge: Gauge,
  "chart-line": ChartLine,
  coins: Coins,
  waypoints: Waypoints,
  "shield-check": ShieldCheck,
  "wallet-minimal": WalletMinimal,
  compass: Compass,
  "bar-chart-3": BarChart3,
  users: Users,
  activity: Activity,
  settings: Settings,
  "message-square": MessageSquare,
} satisfies Record<string, LucideIcon>;

export type SidebarNavIcon = keyof typeof iconMap;

export type SidebarNavItem = {
  href: string;
  label: string;
  icon: SidebarNavIcon;
};

type SidebarNavProps = {
  items: SidebarNavItem[];
  className?: string;
  onNavigate?: () => void;
};

export function SidebarNav({ items, className, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-1 flex-col gap-1.5", className)}>
      {items.map(({ href, label, icon }) => {
        const Icon = iconMap[icon];
        const isActive =
          pathname === href ||
          (href !== "/" &&
            href !== "/dashboard" &&
            href !== "/admin" &&
            pathname.startsWith(`${href}/`)) ||
          (href === "/dashboard" && pathname === "/dashboard") ||
          (href === "/admin" && pathname === "/admin");

        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground",
              isActive && "bg-sidebar-foreground/10 text-sidebar-foreground shadow-sm",
            )}
          >
            {Icon ? (
              <Icon className="h-4 w-4 text-sidebar-foreground/60 group-hover:text-sidebar-foreground" />
            ) : null}
            <span className="truncate">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

