import { NextResponse } from "next/server";

/**
 * CoinGecko API endpoint for price data
 */
const COINGECKO_API = "https://api.coingecko.com/api/v3";

/**
 * Map coin symbols to CoinGecko IDs
 */
const COIN_ID_MAP: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  LTC: "litecoin",
  BNB: "binancecoin",
  ADA: "cardano",
  XRP: "ripple",
  DOGE: "dogecoin",
  DOT: "polkadot",
  MATIC: "matic-network",
  AVAX: "avalanche-2",
  ATOM: "cosmos",
  LINK: "chainlink",
  UNI: "uniswap",
  USDT: "tether",
  USDC: "usd-coin",
};

/**
 * Rate limiting: CoinGecko free tier allows ~10-50 calls/minute
 * We'll implement retry logic with exponential backoff for 429 errors
 */
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Helper function to sleep/delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * GET /api/crypto-prices?coins=BTC,ETH,USDT
 * Fetch crypto prices from CoinGecko API
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const coinsParam = searchParams.get("coins");

    if (!coinsParam) {
      return NextResponse.json(
        { error: "Missing 'coins' query parameter" },
        { status: 400 }
      );
    }

    const coins = coinsParam.split(",").map((c) => c.trim().toUpperCase());
    const coinIds = coins
      .map((coin) => COIN_ID_MAP[coin])
      .filter(Boolean)
      .join(",");

    if (!coinIds) {
      return NextResponse.json({ prices: {} });
    }

    let lastError: Error | null = null;

    // Retry logic with exponential backoff for rate limiting
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(
          `${COINGECKO_API}/simple/price?ids=${coinIds}&vs_currencies=usd`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );

        // Handle rate limiting (429) with retry
        if (response.status === 429) {
          if (attempt < MAX_RETRIES) {
            const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
            console.warn(
              `CoinGecko API rate limited (429). Retrying in ${retryDelay}ms (attempt ${attempt + 1}/${MAX_RETRIES + 1})`
            );
            await sleep(retryDelay);
            continue; // Retry
          } else {
            console.error(
              `CoinGecko API rate limited (429). Max retries exceeded.`
            );
            return NextResponse.json(
              { error: "Rate limit exceeded. Please try again later.", prices: {} },
              { status: 429 }
            );
          }
        }

        if (!response.ok) {
          console.error(`CoinGecko API failed: ${response.status} ${response.statusText}`);
          return NextResponse.json(
            { error: `API error: ${response.statusText}`, prices: {} },
            { status: response.status }
          );
        }

        const data = await response.json();
        const prices: Record<string, number> = {};

        // Map CoinGecko IDs back to coin symbols (only for requested coins)
        for (const coin of coins) {
          const coinId = COIN_ID_MAP[coin];
          if (coinId && data[coinId]?.usd) {
            prices[coin] = data[coinId].usd;
          }
        }

        // Cache response for 60 seconds to reduce API calls
        return NextResponse.json({ prices }, {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
          },
        });
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < MAX_RETRIES) {
          const retryDelay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
          console.warn(
            `Error fetching crypto prices (attempt ${attempt + 1}/${MAX_RETRIES + 1}). Retrying in ${retryDelay}ms:`,
            lastError.message
          );
          await sleep(retryDelay);
          continue;
        }
      }
    }

    // If we get here, all retries failed
    console.error("Error fetching crypto prices after all retries:", lastError);
    return NextResponse.json(
      { error: "Failed to fetch prices after retries", prices: {} },
      { status: 500 }
    );
  } catch (error) {
    console.error("Error in crypto-prices API route:", error);
    return NextResponse.json(
      { error: "Internal server error", prices: {} },
      { status: 500 }
    );
  }
}

