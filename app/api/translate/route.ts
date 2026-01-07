import { NextResponse } from "next/server";

const JOIN_TOKEN = "\n|||LTSEP|||\n";
const DEFAULT_ENDPOINTS = [
  process.env.LIBRE_TRANSLATE_URL,
  "https://libretranslate.de/translate",
  "https://translate.argosopentech.com/translate",
  "https://libretranslate.com/translate",
].filter(Boolean) as string[];

type RequestBody = {
  texts?: string[];
  target?: string;
  source?: string;
};

export async function POST(request: Request) {
  try {
    const { texts = [], target = "en", source = "en" }: RequestBody = await request.json();

    if (!Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json({ translatedTexts: texts });
    }

    // If target equals source, just echo
    if (target === source) {
      return NextResponse.json({ translatedTexts: texts });
    }

    const payload = {
      q: texts.join(JOIN_TOKEN),
      source,
      target,
      format: "text",
    };

    let lastError: unknown = null;
    for (const endpoint of DEFAULT_ENDPOINTS) {
      try {
        console.log(`[Translate API] Attempting ${endpoint} with payload:`, JSON.stringify({
          ...payload,
          q: payload.q.substring(0, 100) + "... (truncated)"
        }));
        
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error(`[Translate API] ${endpoint} returned ${res.status}:`, errorText.substring(0, 200));
          lastError = `Upstream ${endpoint} error: ${res.status} - ${errorText.substring(0, 100)}`;
          continue;
        }

        const data = await res.json();
        console.log(`[Translate API] Response from ${endpoint}:`, JSON.stringify(data).substring(0, 500));
        
        // LibreTranslate can return either:
        // 1. { translatedText: "..." } - single string
        // 2. { translatedText: ["...", "..."] } - array (some endpoints)
        let translated: string;
        if (Array.isArray(data.translatedText)) {
          translated = data.translatedText.join(JOIN_TOKEN);
        } else if (typeof data.translatedText === "string") {
          translated = data.translatedText;
        } else if (data.translated) {
          // Some endpoints use "translated" instead of "translatedText"
          translated = typeof data.translated === "string" ? data.translated : data.translated.join(JOIN_TOKEN);
        } else {
          console.error(`[Translate API] Unexpected response format from ${endpoint}:`, JSON.stringify(data));
          lastError = `Unexpected response format from ${endpoint}`;
          continue;
        }
        
        const translatedTexts = translated.split(JOIN_TOKEN);
        console.log(`[Translate API] Split into ${translatedTexts.length} texts (expected ${texts.length})`);
        
        // Verify we got the right number of translations
        if (translatedTexts.length !== texts.length) {
          console.warn(`[Translate API] Translation count mismatch: got ${translatedTexts.length}, expected ${texts.length}`);
          // Try to pad or trim to match
          if (translatedTexts.length < texts.length) {
            translatedTexts.push(...texts.slice(translatedTexts.length));
          } else {
            translatedTexts.splice(texts.length);
          }
        }
        
        // Check if translations are actually different
        const sampleCheck = Math.min(3, texts.length);
        for (let i = 0; i < sampleCheck; i++) {
          if (texts[i] !== translatedTexts[i]) {
            console.log(`[Translate API] Sample translation [${i}]: "${texts[i]}" → "${translatedTexts[i]}"`);
          } else {
            console.warn(`[Translate API] Sample translation [${i}] unchanged: "${texts[i]}"`);
          }
        }
        
        return NextResponse.json({ translatedTexts });
      } catch (err) {
        console.error(`[Translate API] Error with ${endpoint}:`, err);
        lastError = err;
        continue;
      }
    }

    console.error("Translate upstream failed, returning originals:", lastError);
    // Fallback: return originals to avoid front-end errors
    return NextResponse.json({ translatedTexts: texts, error: "translate_fallback" });
  } catch (error) {
    console.error("Translate API error:", error);
    return NextResponse.json({ translatedTexts: [], error: "Internal translate error" }, { status: 500 });
  }
}


