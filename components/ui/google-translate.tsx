"use client";
import { useEffect, useRef, useState } from "react";

type TranslateElementCtor = {
  new (
    options: {
      pageLanguage?: string;
      autoDisplay?: boolean;
      layout?: unknown;
      includedLanguages?: string;
    },
    elementId: string,
  ): void;
  InlineLayout?: { SIMPLE?: unknown };
};

type GoogleNamespace = {
  translate?: {
    TranslateElement?: TranslateElementCtor;
  };
};

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: GoogleNamespace;
  }
}

type Language = {
  code: string;
  name: string;
};

const languages: Language[] = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "pt", name: "Português" },
  { code: "ru", name: "Русский" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "zh-CN", name: "中文" },
  { code: "ar", name: "العربية" },
  { code: "hi", name: "हिन्दी" },
];

type GoogleTranslateProps = {
  className?: string;
};

export default function GoogleTranslate({ className = "" }: GoogleTranslateProps) {
  const initialLang = (() => {
    if (typeof document === "undefined") return "en";
    const cookies = document.cookie.split("; ");
    const googtransCookie = cookies.find((row) => row.startsWith("googtrans="));
    const lang = googtransCookie?.split("=")[1]?.split("/")[2];
    return lang || "en";
  })();

  const [currentLang, setCurrentLang] = useState<string>(initialLang);
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || scriptLoaded.current) return;

    // Add styles to hide default Google elements
    const style = document.createElement("style");
    style.innerHTML = `
      .goog-te-banner-frame,
      .goog-te-balloon-frame,
      .goog-te-ftab,
      #goog-gt-tt,
      .goog-te-spinner-pos {
        display: none !important;
      }
      body {
        top: 0 !important;
      }
      .skiptranslate {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    const loadGoogleTranslate = () => {
      if (scriptLoaded.current) return;
      scriptLoaded.current = true;

      window.googleTranslateElementInit = () => {
        if (window.google?.translate?.TranslateElement) {
          // This creates the hidden widget that does the actual translation
          new window.google.translate.TranslateElement(
            {
              pageLanguage: "en",
              includedLanguages: languages.map(l => l.code).join(","),
              autoDisplay: false,
            },
            "google_translate_element"
          );
        }
      };

      const script = document.createElement("script");
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.head.appendChild(script);
    };

    // Delay to avoid hydration issues
    const timer = setTimeout(loadGoogleTranslate, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  const handleLanguageChange = (langCode: string) => {
    if (langCode === currentLang) return;

    // Set cookies for Google Translate
    const domain = window.location.hostname;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${domain}`;
    document.cookie = `googtrans=/en/${langCode}; path=/`;

    // Try to trigger translation without reload
    const select = document.querySelector(".goog-te-combo") as HTMLSelectElement;
    if (select) {
      select.value = langCode;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      setCurrentLang(langCode);
      
      // Force a small delay then reload to ensure translation applies
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } else {
      // If widget not ready, just reload
      setCurrentLang(langCode);
      window.location.reload();
    }
  };

  if (typeof window === "undefined") {
    return <div className={className} style={{ width: "200px", height: "40px" }} />;
  }

  return (
    <div className={className}>
      <select
        value={currentLang}
        onChange={(e) => handleLanguageChange(e.target.value)}
        style={{
          padding: "8px 32px 8px 12px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          fontSize: "14px",
          backgroundColor: "white",
          cursor: "pointer",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          minWidth: "150px",
        }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>

      {/* Hidden Google Translate widget - this does the actual translation */}
      <div
        id="google_translate_element"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
        }}
      />
    </div>
  );
}