"use client";

import { useEffect } from "react";

/**
 * Google Translate Widget Component
 * Follows Next.js best practices by:
 * - Using useEffect to load script only on client side
 * - Preventing hydration mismatches
 * - Properly cleaning up on unmount
 */
export function GoogleTranslate() {
  useEffect(() => {
    // Check if script already exists to prevent duplicate loading
    if (document.getElementById("google-translate-script")) {
      return;
    }

    // Create and configure the script
    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.type = "text/javascript";
    script.innerHTML = `
      function googleTranslateElementInit() {
        new google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,es,fr,de,it,pt,ru,ja,ko,zh-CN,ar,hi',
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
          },
          'google_translate_element'
        );
      }
    `;
    document.head.appendChild(script);

    // Load Google Translate API
    const translateScript = document.createElement("script"); // append script to head
    translateScript.type = "text/javascript";
    translateScript.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    translateScript.async = true;
    document.head.appendChild(translateScript);

    // Cleanup function
    return () => {
      const existingScript = document.getElementById("google-translate-script");
      if (existingScript) {
        existingScript.remove();
      }
      const translateElements = document.querySelectorAll('script[src*="translate.google.com"]');
      translateElements.forEach((el) => el.remove());
    };
  }, []);

  return (
    <div id="google_translate_element" className="google-translate-wrapper" />
  );
}

