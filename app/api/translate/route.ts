import { NextResponse } from "next/server";

const JOIN_TOKEN = "\n|||LTSEP|||\n";
const DEFAULT_ENDPOINT = process.env.LIBRE_TRANSLATE_URL || "https://libretranslate.de/translate";

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

    const res = await fetch(DEFAULT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      // Avoid sending credentials; public API
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream translate error: ${res.status}` },
        { status: 502 },
      );
    }

    const data = await res.json();
    const translated = (data.translatedText as string) ?? "";
    const translatedTexts = translated.split(JOIN_TOKEN);

    return NextResponse.json({ translatedTexts });
  } catch (error) {
    console.error("Translate API error:", error);
    return NextResponse.json({ error: "Internal translate error" }, { status: 500 });
  }
}


