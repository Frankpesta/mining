import { NextResponse } from "next/server";

import { fetchMiningRates } from "@/lib/data/mining-rates";

export const revalidate = 0;

export async function GET() {
  try {
    const data = await fetchMiningRates();
    return NextResponse.json({ data }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error("[api/mining-rates] failed", error);
    return NextResponse.json(
      { error: "Unable to fetch mining rates at this time." },
      { status: 500, headers: corsHeaders },
    );
  }
}

const corsHeaders: HeadersInit = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

