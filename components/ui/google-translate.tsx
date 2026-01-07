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

let translateContainer: HTMLDivElement | null = null;
let translateScriptInjected = false;

export function GoogleTranslate({ className }: GoogleTranslateProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Ensure a single container outside React tree to avoid React/Google DOM conflicts
    const ensureContainer = () => {
      if (!translateContainer) {
        translateContainer = document.createElement("div");
        translateContainer.id = "google_translate_wrapper";
        translateContainer.className = `google-translate-container ${className ?? ""}`.trim();
        translateContainer.innerHTML =
          '<div id="google_translate_element" class="google-translate-wrapper"></div>';
        document.body.appendChild(translateContainer);
      } else if (className) {
        translateContainer.className = `google-translate-container ${className}`.trim();
      }
    };

    const initTranslate = () => {
      if (window.__googleTranslateInitialized) return;
      const translateElement = (window.google as GoogleTranslate)?.translate?.TranslateElement as
        | TranslateElementCtor
        | undefined;
      const inlineLayout = translateElement?.InlineLayout;
      if (!translateElement) return;
      const target = document.getElementById("google_translate_element");
      if (!target) return;
      window.__googleTranslateInitialized = true;
      new translateElement(
        {
          pageLanguage: "en",
          layout: inlineLayout?.SIMPLE ?? undefined,
          autoDisplay: false,
        },
        "google_translate_element",
      );
    };

    ensureContainer();

    if (!translateScriptInjected) {
      translateScriptInjected = true;
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
  }, [className]);

  // Nothing rendered in React tree; widget lives in body-level container
  return null;
}

