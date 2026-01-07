"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isGoogleTranslated } from "./translation-lock";

const STORAGE_KEY = "__gt_reload_path__";

export default function GoogleTranslateRouterGuard() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isGoogleTranslated()) {
      // Reset once user goes back to default language
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    const lastReloadedPath = sessionStorage.getItem(STORAGE_KEY);

    if (lastReloadedPath === pathname) return;

    sessionStorage.setItem(STORAGE_KEY, pathname);

    // Force full reload ONCE for this route
    window.location.replace(pathname);
  }, [pathname]);

  return null;
}
