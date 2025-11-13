import type { Metadata } from "next";
import { Manrope, Noto_Sans } from "next/font/google";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { WalletProvider } from "@/components/providers/wallet-provider";
import { Toaster } from "@/components/ui/toaster";

import "./globals.css";

const geistSans = Manrope({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Noto_Sans({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "HashHorizon | Crypto Mining Marketplace",
    template: "%s | HashHorizon",
  },
  description:
    "HashHorizon is a professional crypto mining marketplace with real-time operations, secure deposits, and comprehensive admin controls.",
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletProvider>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="min-h-screen bg-background text-foreground">{children}</div>
            <Toaster />
          </ThemeProvider>
        </WalletProvider>
      </body>
    </html>
  );
}
