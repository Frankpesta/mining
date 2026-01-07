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
  const translationMapRef = useRef<Map<string, string>>(new Map()); // original -> translated
  const sourceLang = "en";

  // Function to collect text nodes
  const collectTextNodes = (): TextNodeRecord[] => {
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
    return nodes;
  };

  // Function to apply translations to nodes
  const applyTranslations = (nodes: TextNodeRecord[], translations: Map<string, string>) => {
    let updatedCount = 0;
    nodes.forEach(({ node, original }) => {
      const translated = translations.get(original);
      if (translated && translated !== original) {
        // Directly update the text content
        if (node.textContent === original || node.textContent !== translated) {
          node.textContent = translated;
          updatedCount++;
        }
      }
    });
    return updatedCount;
  };

  // Collect text nodes once on client
  useEffect(() => {
    if (typeof window === "undefined") return;
    textNodesRef.current = collectTextNodes();
  }, []);

  // Apply translation when lang changes
  useEffect(() => {
    let observer: MutationObserver | null = null;
    
    const run = async () => {
      console.log("Translation effect triggered:", { lang, sourceLang, hasNodes: !!textNodesRef.current });
      
      // Re-collect nodes in case DOM changed
      const nodes = collectTextNodes();
      textNodesRef.current = nodes;
      
      if (nodes.length === 0) {
        console.warn("No text nodes found");
        return;
      }
      
      if (lang === sourceLang) {
        console.log("Restoring original text");
        translationMapRef.current.clear();
        // Restore originals
        nodes.forEach(({ node, original }) => {
          node.textContent = original;
        });
        return;
      }
      
      console.log(`Translating ${nodes.length} text nodes to ${lang}`);
      setLoading(true);
      try {
        const originals = nodes.map((t) => t.original);
        console.log("Sending translation request:", { count: originals.length, target: lang, source: sourceLang });
        const translated = await translateBatch(originals, lang, sourceLang);
        console.log("Translation received:", { count: translated.length });
        
        // Build translation map
        const translationMap = new Map<string, string>();
        originals.forEach((original, idx) => {
          const translatedText = translated[idx] ?? original;
          if (translatedText !== original) {
            translationMap.set(original, translatedText);
          }
        });
        translationMapRef.current = translationMap;
        
        // Debug: Check if translations are different
        const sampleCount = Math.min(5, originals.length);
        console.log("Sample translations (first", sampleCount, "):");
        for (let i = 0; i < sampleCount; i++) {
          console.log(`  [${i}] Original: "${originals[i]}" → Translated: "${translated[i]}"`);
        }
        
        // Apply translations immediately
        const updatedCount = applyTranslations(nodes, translationMap);
        console.log(`Translation applied: ${updatedCount} nodes updated out of ${nodes.length}`);
        
        // Set up MutationObserver to re-apply translations when React updates DOM
        observer = new MutationObserver(() => {
          const currentNodes = collectTextNodes();
          applyTranslations(currentNodes, translationMap);
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
        });
        
        // Re-apply after delays to catch React updates
        setTimeout(() => {
          const currentNodes = collectTextNodes();
          const reapplyCount = applyTranslations(currentNodes, translationMap);
          if (reapplyCount > 0) {
            console.log(`Re-applied translations to ${reapplyCount} nodes after React update`);
          }
        }, 100);
        
        setTimeout(() => {
          const currentNodes = collectTextNodes();
          const reapplyCount = applyTranslations(currentNodes, translationMap);
          if (reapplyCount > 0) {
            console.log(`Re-applied translations to ${reapplyCount} nodes after second delay`);
          }
        }, 500);
      } catch (err) {
        console.error("LibreTranslate error:", err);
      } finally {
        setLoading(false);
      }
    };
    
    run();
    
    // Cleanup function
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
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


