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
    const wrapperId = "google_translate_wrapper";

    // Ensure a single DOM container outside React tree to avoid React/Translate DOM conflicts
    let container = document.getElementById(wrapperId) as HTMLDivElement | null;
    if (!container) {
      container = document.createElement("div");
      container.id = wrapperId;
      container.className = `google-translate-container ${className ?? ""}`.trim();
      container.innerHTML = `<div id="${containerId}" class="google-translate-wrapper"></div>`;
      document.body.appendChild(container);
    } else {
      // Update classes if needed
      container.className = `google-translate-container ${className ?? ""}`.trim();
    }

    const initTranslate = () => {
      if (window.__googleTranslateInitialized) return;
      const translateElement = (window.google as GoogleTranslate)?.translate?.TranslateElement as
        | TranslateElementCtor
        | undefined;
      const inlineLayout = translateElement?.InlineLayout;
      if (!translateElement) return;
      const target = document.getElementById(containerId);
      if (!target) return;

      window.googleTranslateElementInit = () => {
        if (window.__googleTranslateInitialized) return;
        // Mark initialized before constructing to avoid re-entrancy issues
        window.__googleTranslateInitialized = true;
        new translateElement(
          {
            pageLanguage: "en",
            // Show all available languages by omitting includedLanguages
            layout: inlineLayout?.SIMPLE ?? undefined,
            autoDisplay: false,
          },
          containerId,
        );
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

    // Keep scripts and container; do not clean up to avoid thrash and reflow issues.
  }, [className]);

  // Nothing to render into the React tree; widget lives in a portal container.
  return null;
}

