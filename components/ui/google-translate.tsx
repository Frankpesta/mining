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
  const mountPoint = useRef<HTMLDivElement>(null);
  const portalContainer = useRef<HTMLDivElement | null>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (!mountPoint.current || initialized.current) return;
    initialized.current = true;

    // Create container outside React's control
    const portal = document.createElement('div');
    portal.className = 'google-translate-portal';
    const uniqueId = `google_translate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    portal.id = uniqueId;
    
    portalContainer.current = portal;

    const init = () => {
      const TranslateElement = window.google?.translate?.TranslateElement;
      if (!TranslateElement || !portalContainer.current) return;

      try {
        const existing = portalContainer.current.querySelector('.goog-te-gadget');
        if (existing) return;

        new TranslateElement(
          {
            pageLanguage,
            autoDisplay: false,
            layout: TranslateElement?.InlineLayout?.SIMPLE,
          },
          uniqueId,
        );
      } catch (error) {
        console.error("Google Translate error:", error);
      }
    };

    const loadAndInit = () => {
      if (!mountPoint.current || !portalContainer.current) return;

      // Append portal to mount point
      mountPoint.current.appendChild(portalContainer.current);

      const scriptExists = document.querySelector(
        'script[src*="translate.google.com/translate_a/element.js"]',
      );

      if (scriptExists && window.google?.translate?.TranslateElement) {
        setTimeout(init, 150);
      } else if (scriptExists) {
        window.googleTranslateElementInit = init;
        setTimeout(init, 500);
      } else {
        window.googleTranslateElementInit = init;
        const script = document.createElement("script");
        script.src =
          "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        document.head.appendChild(script);
      }
    };

    const timer = setTimeout(loadAndInit, 500);

    return () => {
      clearTimeout(timer);
      if (portalContainer.current && mountPoint.current) {
        try {
          if (mountPoint.current.contains(portalContainer.current)) {
            mountPoint.current.removeChild(portalContainer.current);
          }
        } catch (e) {
          console.error("Cleanup error:", e);
        }
      }
      portalContainer.current = null;
    };
  }, [pageLanguage]);

  return (
    <div 
      ref={mountPoint}
      className={`google-translate-wrapper ${className}`}
      style={{ minHeight: '40px', display: 'inline-block' }}
      suppressHydrationWarning
    />
  );
}

export default dynamic(() => Promise.resolve(GoogleTranslateClient), {
  ssr: false,
  loading: () => (
    <div 
      style={{ minHeight: '40px', display: 'inline-block' }} 
    />
  ),
});