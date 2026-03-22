"use client";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

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

/** Google Website Translator language codes — keep in sync with TranslateElement `includedLanguages`. */
const languages: Language[] = [
  { code: "en", name: "English" },
  { code: "af", name: "Afrikaans" },
  { code: "sq", name: "Shqip (Albanian)" },
  { code: "am", name: "አማርኛ (Amharic)" },
  { code: "ar", name: "العربية (Arabic)" },
  { code: "hy", name: "Հայերեն (Armenian)" },
  { code: "az", name: "Azərbaycan (Azerbaijani)" },
  { code: "eu", name: "Euskara (Basque)" },
  { code: "be", name: "Беларуская (Belarusian)" },
  { code: "bn", name: "বাংলা (Bengali)" },
  { code: "bs", name: "Bosanski (Bosnian)" },
  { code: "bg", name: "Български (Bulgarian)" },
  { code: "ca", name: "Català (Catalan)" },
  { code: "ceb", name: "Cebuano" },
  { code: "zh-CN", name: "中文（简体）" },
  { code: "zh-TW", name: "中文（繁體）" },
  { code: "hr", name: "Hrvatski (Croatian)" },
  { code: "cs", name: "Čeština (Czech)" },
  { code: "da", name: "Dansk (Danish)" },
  { code: "nl", name: "Nederlands (Dutch)" },
  { code: "eo", name: "Esperanto" },
  { code: "et", name: "Eesti (Estonian)" },
  { code: "fi", name: "Suomi (Finnish)" },
  { code: "fr", name: "Français (French)" },
  { code: "gl", name: "Galego (Galician)" },
  { code: "ka", name: "ქართული (Georgian)" },
  { code: "de", name: "Deutsch (German)" },
  { code: "el", name: "Ελληνικά (Greek)" },
  { code: "gu", name: "ગુજરાતી (Gujarati)" },
  { code: "ht", name: "Kreyòl ayisyen (Haitian Creole)" },
  { code: "ha", name: "Hausa" },
  { code: "iw", name: "עברית (Hebrew)" },
  { code: "hi", name: "हिन्दी (Hindi)" },
  { code: "hu", name: "Magyar (Hungarian)" },
  { code: "is", name: "Íslenska (Icelandic)" },
  { code: "ig", name: "Igbo" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "ga", name: "Gaeilge (Irish)" },
  { code: "it", name: "Italiano (Italian)" },
  { code: "ja", name: "日本語 (Japanese)" },
  { code: "jw", name: "Basa Jawa (Javanese)" },
  { code: "kn", name: "ಕನ್ನಡ (Kannada)" },
  { code: "kk", name: "Қазақ (Kazakh)" },
  { code: "km", name: "ខ្មែរ (Khmer)" },
  { code: "ko", name: "한국어 (Korean)" },
  { code: "ku", name: "Kurdî (Kurdish)" },
  { code: "lo", name: "ລາວ (Lao)" },
  { code: "lv", name: "Latviešu (Latvian)" },
  { code: "lt", name: "Lietuvių (Lithuanian)" },
  { code: "mk", name: "Македонски (Macedonian)" },
  { code: "ms", name: "Bahasa Melayu (Malay)" },
  { code: "ml", name: "മലയാളം (Malayalam)" },
  { code: "mt", name: "Malti (Maltese)" },
  { code: "mr", name: "मराठी (Marathi)" },
  { code: "mn", name: "Монгол (Mongolian)" },
  { code: "my", name: "မြန်မာ (Myanmar)" },
  { code: "ne", name: "नेपाली (Nepali)" },
  { code: "no", name: "Norsk (Norwegian)" },
  { code: "fa", name: "فارسی (Persian)" },
  { code: "pl", name: "Polski (Polish)" },
  { code: "pt", name: "Português (Portuguese)" },
  { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)" },
  { code: "ro", name: "Română (Romanian)" },
  { code: "ru", name: "Русский (Russian)" },
  { code: "sr", name: "Српски (Serbian)" },
  { code: "si", name: "සිංහල (Sinhala)" },
  { code: "sk", name: "Slovenčina (Slovak)" },
  { code: "sl", name: "Slovenščina (Slovenian)" },
  { code: "es", name: "Español (Spanish)" },
  { code: "sw", name: "Kiswahili (Swahili)" },
  { code: "sv", name: "Svenska (Swedish)" },
  { code: "tl", name: "Filipino" },
  { code: "ta", name: "தமிழ் (Tamil)" },
  { code: "te", name: "తెలుగు (Telugu)" },
  { code: "th", name: "ไทย (Thai)" },
  { code: "tr", name: "Türkçe (Turkish)" },
  { code: "uk", name: "Українська (Ukrainian)" },
  { code: "ur", name: "اردو (Urdu)" },
  { code: "uz", name: "Oʻzbek (Uzbek)" },
  { code: "vi", name: "Tiếng Việt (Vietnamese)" },
  { code: "cy", name: "Cymraeg (Welsh)" },
  { code: "xh", name: "isiXhosa (Xhosa)" },
  { code: "yo", name: "Yorùbá (Yoruba)" },
  { code: "zu", name: "isiZulu (Zulu)" },
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
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
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
    return <div className={cn("google-translate-container", className)} style={{ minHeight: "40px" }} />;
  }

  return (
    <div className={cn("google-translate-container", className)}>
      <select
        value={currentLang}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="h-9 min-w-[min(100%,220px)] max-w-[min(100vw-2rem,280px)] cursor-pointer appearance-none rounded-md border border-border bg-background px-3 py-2 pr-9 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
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