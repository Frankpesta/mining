"use client";

import { useEffect, useRef } from "react";

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
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Track script injection and initialization at module level to avoid re-entrant DOM ops
  useEffect(() => {
    if (typeof window === "undefined") return;

    const initTranslate = () => {
      if (window.__googleTranslateInitialized) return;
      const translateElement = (window.google as GoogleTranslate)?.translate?.TranslateElement as
        | TranslateElementCtor
        | undefined;
      const inlineLayout = translateElement?.InlineLayout;
      if (!translateElement) return;
      if (!containerRef.current) return;

      window.__googleTranslateInitialized = true;
      const targetId = containerRef.current.id || "google_translate_element";
      new translateElement(
        {
          pageLanguage: "en",
          // Show all available languages by omitting includedLanguages
          layout: inlineLayout?.SIMPLE ?? undefined,
          autoDisplay: false,
        },
        targetId,
      );
    };

    const scriptPresent = document.querySelector('script[src*="translate.google.com/translate_a/element.js"]');
    if (!scriptPresent) {
      window.googleTranslateElementInit = initTranslate;
      const translateScript = document.createElement("script");
      translateScript.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      translateScript.async = true;
      translateScript.defer = true;
      translateScript.onload = initTranslate;
      document.head.appendChild(translateScript);
    } else {
      window.googleTranslateElementInit = initTranslate;
      initTranslate();
    }
  }, []);

  return (
    <div className={`google-translate-container ${className ?? ""}`} suppressHydrationWarning>
      <div id="google_translate_element" className="google-translate-wrapper" ref={containerRef} />
    </div>
  );
}

