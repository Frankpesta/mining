import type { Metadata } from "next";

import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { WhatsAppFloat } from "@/components/ui/whatsapp-float";
import { SmartsuppChat } from "@/components/ui/smartsupp-chat";

export const metadata: Metadata = {
  title: {
    default: "blockhashpro | Crypto Mining Marketplace",
    template: "%s | blockhashpro",
  },
  description:
    "blockhashpro connects miners and investors with enterprise-grade infrastructure, real-time analytics, and automated settlements.",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <WhatsAppFloat />
      <SmartsuppChat />
    </div>
  );
}

