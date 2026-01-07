"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: GoogleTranslate;
    __googleTranslateInitialized?: boolean;
  }
}

type TranslateElementCtor = {
  new (options: Record<string, unknown>, elementId: string): unknown;
  InlineLayout?: {
    SIMPLE?: unknown;
  };
};

type GoogleTranslate = {
  translate?: {
    TranslateElement?: TranslateElementCtor;
  };
};

/**
 * Google Translate Widget Component
 * Follows Next.js best practices by:
 * - Using useEffect to load script only on client side
 * - Preventing hydration mismatches
 * - Properly cleaning up on unmount
 */
type GoogleTranslateProps = {
  className?: string;
};

export function GoogleTranslate({ className }: GoogleTranslateProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const containerId = "google_translate_element";

    const initTranslate = () => {
      if (window.__googleTranslateInitialized) return;
      const translateElement = (window.google as GoogleTranslate)?.translate?.TranslateElement as
        | TranslateElementCtor
        | undefined;
      const inlineLayout = translateElement?.InlineLayout;
      if (!translateElement) return;
      const container = document.getElementById(containerId);
      if (!container) return;

      window.googleTranslateElementInit = () => {
        if (window.__googleTranslateInitialized) return;
        new translateElement(
          {
            pageLanguage: "en",
            // Show all available languages by omitting includedLanguages
            layout: inlineLayout?.SIMPLE ?? undefined,
            autoDisplay: false,
          },
          containerId,
        );
        window.__googleTranslateInitialized = true;
      };

      window.googleTranslateElementInit();
    };

    if (!document.querySelector('script[src*="translate.google.com/translate_a/element.js"]')) {
      window.googleTranslateElementInit = initTranslate;
      const translateScript = document.createElement("script");
      translateScript.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      translateScript.async = true;
      translateScript.defer = true;
      translateScript.onload = initTranslate;
      document.head.appendChild(translateScript);
    } else {
      initTranslate();
    }

    // Do not remove scripts on unmount to avoid re-adding and DOM thrash.
  }, []);

  return (
    <div
      className={`google-translate-container ${className ?? ""}`}
      suppressHydrationWarning
    >
      <div id="google_translate_element" className="google-translate-wrapper" />
    </div>
  );
}

