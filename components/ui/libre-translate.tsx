"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Language = { code: string; name: string };

const LANGUAGES: Language[] = [
  { code: "en", name: "English" },
  { code: "de", name: "Deutsch" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "it", name: "Italiano" },
  { code: "pt", name: "Português" },
  { code: "ru", name: "Русский" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "zh", name: "中文" },
  { code: "ar", name: "العربية" },
  { code: "hi", name: "हिन्दी" },
];

type TextNodeRecord = {
  node: Text;
  original: string;
};

async function translateBatch(texts: string[], target: string, source = "en"): Promise<string[]> {
  if (texts.length === 0 || target === source) return texts;

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        texts,
        target,
        source,
      }),
    });

    if (!res.ok) {
      console.warn("Translate request failed:", res.status);
      return texts;
    }

    const data = await res.json();
    const translatedTexts = (data.translatedTexts as string[]) ?? [];
    return translatedTexts.length ? translatedTexts : texts;
  } catch (err) {
    console.error("Translate fetch error:", err);
    return texts;
  }
}

export default function LibreTranslate({ className = "" }: { className?: string }) {
  const [lang, setLang] = useState<string>("en");
  const [loading, setLoading] = useState<boolean>(false);
  const textNodesRef = useRef<TextNodeRecord[] | null>(null);
  const sourceLang = "en";

  // Collect text nodes once on client
  useEffect(() => {
    if (typeof window === "undefined") return;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const text = node.textContent?.trim() ?? "";
        if (!text) return NodeFilter.FILTER_REJECT;
        if (
          node.parentElement?.tagName === "SCRIPT" ||
          node.parentElement?.tagName === "STYLE" ||
          node.parentElement?.getAttribute("data-no-translate") === "true"
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    const nodes: TextNodeRecord[] = [];
    let current = walker.nextNode();
    while (current) {
      nodes.push({ node: current as Text, original: current.textContent ?? "" });
      current = walker.nextNode();
    }
    textNodesRef.current = nodes;
  }, []);

  // Apply translation when lang changes
  useEffect(() => {
    const run = async () => {
      console.log("Translation effect triggered:", { lang, sourceLang, hasNodes: !!textNodesRef.current });
      if (!textNodesRef.current) {
        console.warn("No text nodes collected yet");
        return;
      }
      if (lang === sourceLang) {
        console.log("Restoring original text");
        // Restore originals
        textNodesRef.current.forEach(({ node, original }) => {
          node.textContent = original;
        });
        return;
      }
      console.log(`Translating ${textNodesRef.current.length} text nodes to ${lang}`);
      setLoading(true);
      try {
        const originals = textNodesRef.current.map((t) => t.original);
        console.log("Sending translation request:", { count: originals.length, target: lang, source: sourceLang });
        const translated = await translateBatch(originals, lang, sourceLang);
        console.log("Translation received:", { count: translated.length });
        textNodesRef.current.forEach((t, idx) => {
          t.node.textContent = translated[idx] ?? t.original;
        });
        console.log("Translation applied successfully");
      } catch (err) {
        console.error("LibreTranslate error:", err);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [lang, sourceLang]);

  const options = useMemo(() => LANGUAGES, []);

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    console.log("Language change requested:", { from: lang, to: newLang });
    setLang(newLang);
  };

  return (
    <div className={`translate-select-wrapper ${className}`}>
      <select
        value={lang}
        onChange={handleLanguageChange}
        disabled={loading}
        className="translate-select"
      >
        {options.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
      {loading && <span className="translate-loading">Translating…</span>}
      <div id="google_translate_element" style={{ display: "none" }} />
    </div>
  );
}


