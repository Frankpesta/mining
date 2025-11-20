"use client";

import { useState } from "react";
import { Menu, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { SidebarNav, type SidebarNavItem } from "@/components/dashboard/sidebar-nav";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type UserSummary = {
  email: string;
  role: string;
};

type BrandInfo = {
  initials: string;
  title: string;
  subtitle?: string;
};

type AppShellProps = {
  brand: BrandInfo;
  navigation: SidebarNavItem[];
  user: UserSummary;
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
  headerDescription?: string;
  className?: string;
};

export function AppShell({
  brand,
  navigation,
  user,
  signOutAction,
  children,
  headerDescription,
  className,
}: AppShellProps) {
  const [open, setOpen] = useState(false);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 border-b border-border/70 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-sm font-semibold uppercase tracking-wide text-primary">
          {brand.initials}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-sidebar-foreground">
            {brand.title}
          </span>
          {brand.subtitle ? (
            <span className="text-xs text-sidebar-foreground/70">
              {brand.subtitle}
            </span>
          ) : null}
        </div>
      </div>
      <SidebarNav
        items={navigation}
        className="flex-1 overflow-y-auto px-4 py-5"
        onNavigate={() => setOpen(false)}
      />
      <div className="mt-auto border-t border-border/70 px-6 py-4 text-xs text-sidebar-foreground/70">
        <p className="font-medium text-sidebar-foreground">{user.email}</p>
        <p className="capitalize">{user.role}</p>
        <form action={signOutAction} className="mt-3">
          <SignOutButton />
        </form>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "flex min-h-screen bg-background text-foreground lg:h-screen lg:overflow-hidden",
        className,
      )}
    >
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{brand.title} navigation</SheetTitle>
          </SheetHeader>
          {sidebarContent}
        </SheetContent>
      </Sheet>

      <aside className="hidden w-72 border-r border-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col lg:overflow-hidden lg:sticky lg:top-0 lg:h-screen">
        {sidebarContent}
      </aside>

      <div className="flex flex-1 flex-col lg:overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-background/70 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/50">
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground lg:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open navigation</span>
            </Button>
            <div>
              <p className="text-sm font-semibold">{brand.title}</p>
              <p className="text-xs text-muted-foreground">
                {headerDescription ?? user.email}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-muted/10">
          <main className="min-h-full p-4 sm:p-6">{children}</main>
        </div>

        <footer className="border-t border-border bg-background/70 px-4 py-3 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} blockhashpro. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

function SignOutButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      variant="outline"
      size="sm"
      className="w-full text-xs"
      disabled={pending}
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
          Signing out...
        </>
      ) : (
        "Sign out"
      )}
    </Button>
  );
}

