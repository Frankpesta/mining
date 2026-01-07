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
 * - Mounts widget completely outside React tree
 * - Prevents most hydration / insertBefore conflicts
 * - Cleans up properly
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

    // 1. Create container if it doesn't exist
    if (!containerRef.current) {
      const wrapper = document.createElement("div");
      wrapper.id = "google-translate-wrapper";
      wrapper.className = `google-translate-container ${className}`.trim();

      const inner = document.createElement("div");
      inner.id = "google_translate_element";
      wrapper.appendChild(inner);

      // You can choose where to put it
      document.body.appendChild(wrapper);
      // Alternative positions:
      // document.getElementById("some-header")?.appendChild(wrapper);
      // document.querySelector("header")?.prepend(wrapper);

      containerRef.current = wrapper;
    }

    const initGoogleTranslate = () => {
      if (window.__googleTranslateInitialized) return;
      window.__googleTranslateInitialized = true;

      // Safety check
      if (!window.google?.translate?.TranslateElement) return;

      try {
        new window.google.translate.TranslateElement(
          {
            pageLanguage,
            layout: window.google.translate.TranslateElement?.InlineLayout?.SIMPLE,
            autoDisplay: false,
          },
          "google_translate_element"
        );
      } catch (e) {
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

    // Cleanup
    return () => {
      // Very optional – most people don't remove it
      // But if you really want to cleanup:
      if (containerRef.current?.parentNode) {
        containerRef.current.parentNode.removeChild(containerRef.current);
      }
      mountedRef.current = false;
      delete window.googleTranslateElementInit;
      window.__googleTranslateInitialized = false;
    };
  }, [className, pageLanguage]);

  // We render nothing in React tree
  return null;
}