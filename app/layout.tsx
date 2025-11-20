import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { WalletProvider } from "@/components/providers/wallet-provider";
import { ConvexProvider } from "@/components/providers/convex-provider";
import { Toaster } from "@/components/ui/toaster";

import "./globals.css";

const geistSans = Manrope({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
});


export const metadata: Metadata = {
  title: {
    default: "blockhashpro | Crypto Mining Marketplace",
    template: "%s | blockhashpro",
  },
  description:
    "blockhashpro is a professional crypto mining marketplace with real-time operations, secure deposits, and comprehensive admin controls.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable}  antialiased`}
      >
        <ConvexProvider>
          <WalletProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <div className="min-h-screen bg-background text-foreground">{children}</div>
              <Toaster />
            </ThemeProvider>
          </WalletProvider>
        </ConvexProvider>
      </body>
    </html>
  );
}
