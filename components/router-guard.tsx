"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isGoogleTranslated } from "@/components/translation-lock";

export default function GoogleTranslateRouterGuard() {
  const pathname = usePathname();

  useEffect(() => {
    if (isGoogleTranslated()) {
      // React routing + Google Translate = crash
      window.location.href = pathname;
    }
  }, [pathname]);

  return null;
}
