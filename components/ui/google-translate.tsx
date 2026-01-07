"use client";
import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate?: {
        TranslateElement?: {
          new (
            options: { pageLanguage?: string; autoDisplay?: boolean; layout?: unknown },
            elementId: string,
          ): void;
          InlineLayout?: { SIMPLE?: unknown };
        };
      };
    };
  }
}

type GoogleTranslateProps = {
  className?: string;
  pageLanguage?: string;
};

function GoogleTranslateClient({
  className = "",
  pageLanguage = "en",
}: GoogleTranslateProps) {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    const targetId = "google_translate_element";

    const init = () => {
      const TranslateElement = window.google?.translate?.TranslateElement;
      if (!TranslateElement || initialized.current) return;

      // Check if already initialized
      const existingWidget = document.querySelector(`#${targetId} .goog-te-gadget`);
      if (existingWidget) {
        initialized.current = true;
        return;
      }

      try {
        new TranslateElement(
          {
            pageLanguage,
            autoDisplay: false,
            layout: TranslateElement?.InlineLayout?.SIMPLE,
          },
          targetId,
        );
        initialized.current = true;
      } catch (error) {
        console.error("Google Translate initialization error:", error);
      }
    };

    const timer = setTimeout(() => {
      const scriptPresent = document.querySelector(
        'script[src*="translate.google.com/translate_a/element.js"]',
      );

      if (!scriptPresent) {
        window.googleTranslateElementInit = init;
        const script = document.createElement("script");
        script.src =
          "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        script.onerror = () => {
          console.error("Failed to load Google Translate script");
        };
        document.head.appendChild(script);
      } else if (window.google?.translate?.TranslateElement) {
        init();
      } else {
        window.googleTranslateElementInit = init;
      }
    }, 200);

    return () => {
      clearTimeout(timer);
    };
  }, [pageLanguage]);

  return (
    <div 
      className={`google-translate-container ${className}`} 
      style={{ minHeight: '40px' }}
    >
      <div id="google_translate_element" />
    </div>
  );
}

// Export with dynamic import to ensure client-only rendering
export default dynamic(() => Promise.resolve(GoogleTranslateClient), {
  ssr: false,
  loading: () => (
    <div 
      className="google-translate-container" 
      style={{ minHeight: '40px' }} 
    />
  ),
});