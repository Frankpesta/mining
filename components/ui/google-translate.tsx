"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    // Google translate widget adds `google.translate` to window
    google?: GoogleTranslateNamespace;
    __googleTranslateInitialized?: boolean;
  }
}

type GoogleTranslateNamespace = {
  translate?: {
    TranslateElement?: {
      new (options: Record<string, unknown>, elementId: string): void;
      InlineLayout?: {
        SIMPLE?: unknown;
      };
    };
  };
};

type GoogleTranslateProps = {
  className?: string;
  pageLanguage?: string; // default: 'en'
};

/**
 * Google Translate Widget – Client Component
 * - Renders a stable container in the React tree
 * - Guards against double init in Strict Mode
 * - Leaves scripts mounted to avoid DOM churn
 */
export default function GoogleTranslate({
  className = "",
  pageLanguage = "en",
}: GoogleTranslateProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const wrapperId = "google-translate-wrapper";
    const targetId = "google_translate_element";

    // Create a single, stable container outside React to avoid React/Google DOM conflicts.
    let wrapper = document.getElementById(wrapperId) as HTMLDivElement | null;
    if (!wrapper) {
      wrapper = document.createElement("div");
      wrapper.id = wrapperId;
      wrapper.className = `google-translate-container ${className}`.trim();
      const inner = document.createElement("div");
      inner.id = targetId;
      inner.className = "google-translate-wrapper";
      wrapper.appendChild(inner);
      document.body.appendChild(wrapper);
    } else {
      // keep className in sync
      wrapper.className = `google-translate-container ${className}`.trim();
      if (!wrapper.querySelector(`#${targetId}`)) {
        const inner = document.createElement("div");
        inner.id = targetId;
        inner.className = "google-translate-wrapper";
        wrapper.appendChild(inner);
      }
    }

    const initGoogleTranslate = () => {
      if (window.__googleTranslateInitialized) return;
      const translateCtor = window.google?.translate?.TranslateElement;
      const target = document.getElementById(targetId);
      if (!translateCtor || !target) return;

      try {
        window.__googleTranslateInitialized = true;
        new translateCtor(
          {
            pageLanguage,
            layout: translateCtor?.InlineLayout?.SIMPLE,
            autoDisplay: false,
          },
          targetId,
        );
      } catch (e) {
        window.__googleTranslateInitialized = false;
        console.warn("Google Translate init failed", e);
      }
    };

    // If script already loaded, initialize immediately
    if (window.google?.translate?.TranslateElement) {
      initGoogleTranslate();
      return;
    }

    // Inject script only once
    if (!document.querySelector('script[src*="translate.google.com/translate_a/element.js"]')) {
      window.googleTranslateElementInit = initGoogleTranslate;
      const script = document.createElement("script");
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      script.defer = true;
      script.onload = () => setTimeout(initGoogleTranslate, 50);
      script.onerror = () => console.error("Failed to load Google Translate script");
      document.head.appendChild(script);
    } else {
      window.googleTranslateElementInit = initGoogleTranslate;
      setTimeout(initGoogleTranslate, 50);
    }
    // No cleanup: keeping the widget persistent avoids DOM removal errors
  }, [className, pageLanguage]);

  // Render nothing; widget lives in the body-level container
  return null;
}