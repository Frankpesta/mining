"use client";
import { useState } from "react";

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

type CustomTranslateProps = {
  className?: string;
  onLanguageChange?: (lang: string) => void;
};

export default function CustomTranslate({
  className = "",
  onLanguageChange,
}: CustomTranslateProps) {
  const getCookie = (name: string) => {
    if (typeof document === "undefined") return undefined;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return undefined;
  };

  const initialLang = (() => {
    const googleTransCookie = getCookie("googtrans");
    const lang = googleTransCookie?.split("/")[2];
    return lang || "en";
  })();

  const [currentLang, setCurrentLang] = useState(initialLang);
  const isLoaded = typeof window !== "undefined";

  const handleLanguageChange = (lang: string) => {
    setCurrentLang(lang);
    
    // Set Google Translate cookies
    document.cookie = `googtrans=/en/${lang}; path=/`;
    document.cookie = `googtrans=/en/${lang}; path=/; domain=${window.location.hostname}`;
    
    // Trigger page reload to apply translation
    window.location.reload();
    
    if (onLanguageChange) {
      onLanguageChange(lang);
    }
  };

  if (!isLoaded) {
    return <div className={className} style={{ width: "200px", height: "40px" }} />;
  }

  return (
    <div className={`translate-selector ${className}`}>
      <select
        value={currentLang}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="translate-select"
        style={{
          padding: '8px 32px 8px 12px',
          border: '1px solid #ccc',
          borderRadius: '6px',
          fontSize: '14px',
          backgroundColor: 'white',
          cursor: 'pointer',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M1 1.5L6 6.5L11 1.5' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          minWidth: '150px'
        }}
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.name}
          </option>
        ))}
      </select>
      
      {/* Hidden Google Translate element */}
      <div id="google_translate_element" style={{ display: 'none' }} />
      
      <script
        dangerouslySetInnerHTML={{
          __html: `
            if (typeof window !== 'undefined' && !window.googleTranslateElementInit) {
              window.googleTranslateElementInit = function() {
                new google.translate.TranslateElement({
                  pageLanguage: 'en',
                  autoDisplay: false
                }, 'google_translate_element');
              };
              
              if (!document.querySelector('script[src*="translate.google.com"]')) {
                const script = document.createElement('script');
                script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
                script.async = true;
                document.head.appendChild(script);
              }
            }
          `
        }}
      />
    </div>
  );
}