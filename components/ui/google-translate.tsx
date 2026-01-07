"use client";

import { useEffect, useRef } from "react";

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
  const mountedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Prevent double execution in dev (React 18 Strict Mode)
    if (mountedRef.current) return;
    mountedRef.current = true;

    const initGoogleTranslate = () => {
      if (window.__googleTranslateInitialized) return;
      // Safety checks
      const translateCtor = window.google?.translate?.TranslateElement;
      const target = containerRef.current;
      if (!translateCtor || !target) return;

      try {
        window.__googleTranslateInitialized = true;
        new translateCtor(
          {
            pageLanguage,
            layout: translateCtor?.InlineLayout?.SIMPLE,
            autoDisplay: false,
          },
          target.id || "google_translate_element",
        );
      } catch (e) {
        // If it fails, allow a retry on next render by clearing the flag
        window.__googleTranslateInitialized = false;
        console.warn("Google Translate init failed", e);
      }
    };

    // 2. Already loaded? → just initialize
    if (window.google?.translate?.TranslateElement) {
      initGoogleTranslate();
      return;
    }

    // 3. Not loaded yet → inject script
    const script = document.createElement("script");
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    script.defer = true;

    window.googleTranslateElementInit = initGoogleTranslate;

    script.onload = () => {
      // Give it a tiny delay - sometimes google is not yet ready
      setTimeout(initGoogleTranslate, 100);
    };

    script.onerror = () => {
      console.error("Failed to load Google Translate script");
    };

    document.head.appendChild(script);

    // No cleanup: keep script and container to avoid reflows / conflicts
  }, [pageLanguage]);

  return (
    <div className={`google-translate-container ${className}`} suppressHydrationWarning>
      <div id="google_translate_element" className="google-translate-wrapper" ref={containerRef} />
    </div>
  );
}