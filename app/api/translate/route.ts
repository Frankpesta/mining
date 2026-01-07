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
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          lastError = `Upstream ${endpoint} error: ${res.status}`;
          continue;
        }

        const data = await res.json();
        const translated = (data.translatedText as string) ?? "";
        const translatedTexts = translated.split(JOIN_TOKEN);
        return NextResponse.json({ translatedTexts });
      } catch (err) {
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


