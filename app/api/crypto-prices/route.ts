import { NextResponse } from "next/server";

/**
 * Binance symbols for our supported non-stable coins. Binance's public
 * ticker endpoint needs no API key, has very high rate limits (1200
 * request-weight/minute), and responds in well under a second - unlike
 * CoinGecko's free tier, which was causing requests here to hang/time out.
 */
const BINANCE_SYMBOL_MAP: Record<string, string> = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  SOL: "SOLUSDT",
  LTC: "LTCUSDT",
  BNB: "BNBUSDT",
  ADA: "ADAUSDT",
  XRP: "XRPUSDT",
  DOGE: "DOGEUSDT",
  DOT: "DOTUSDT",
  MATIC: "POLUSDT", // Binance renamed MATIC -> POL in 2024
  AVAX: "AVAXUSDT",
  ATOM: "ATOMUSDT",
  LINK: "LINKUSDT",
  UNI: "UNIUSDT",
};

/**
 * CoinGecko IDs, kept only as a fallback source if Binance is unreachable
 * or doesn't list a symbol.
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

const STABLECOINS = new Set(["USDT", "USDC"]);

const FETCH_TIMEOUT_MS = 5000;

/**
 * Fetch with a hard timeout so a single attempt can never hang indefinitely.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = FETCH_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Primary price source: Binance
 */
async function fetchFromBinance(coins: string[]): Promise<Record<string, number>> {
  const symbols = coins.map((coin) => BINANCE_SYMBOL_MAP[coin]).filter(Boolean);
  if (symbols.length === 0) return {};

  const symbolsParam = encodeURIComponent(JSON.stringify(symbols));
  const response = await fetchWithTimeout(
    `https://api.binance.com/api/v3/ticker/price?symbols=${symbolsParam}`,
    { headers: { Accept: "application/json" } }
  );

  if (!response.ok) {
    throw new Error(`Binance API returned ${response.status}`);
  }

  const data = (await response.json()) as Array<{ symbol: string; price: string }>;
  const symbolToCoin = Object.fromEntries(
    Object.entries(BINANCE_SYMBOL_MAP).map(([coin, symbol]) => [symbol, coin])
  );

  const prices: Record<string, number> = {};
  for (const entry of data) {
    const coin = symbolToCoin[entry.symbol];
    const price = parseFloat(entry.price);
    if (coin && Number.isFinite(price) && price > 0) {
      prices[coin] = price;
    }
  }
  return prices;
}

/**
 * Coinbase tickers for coins it lists (no BNB - Coinbase doesn't trade it).
 * Polygon's ticker is POL on Coinbase after its 2024 MATIC->POL migration,
 * but we check both in case a coin is still listed under the old symbol.
 */
const COINBASE_TICKER_ALIASES: Record<string, string[]> = {
  MATIC: ["POL", "MATIC"],
};

/**
 * Secondary price source: Coinbase. An independent exchange guards against
 * Binance being geo/network-blocked from wherever this route executes.
 */
async function fetchFromCoinbase(coins: string[]): Promise<Record<string, number>> {
  const response = await fetchWithTimeout(
    "https://api.coinbase.com/v2/exchange-rates?currency=USD",
    { headers: { Accept: "application/json" } }
  );

  if (!response.ok) {
    throw new Error(`Coinbase API returned ${response.status}`);
  }

  const data = await response.json();
  const rates = data?.data?.rates ?? {};
  const prices: Record<string, number> = {};
  for (const coin of coins) {
    const tickers = COINBASE_TICKER_ALIASES[coin] ?? [coin];
    for (const ticker of tickers) {
      const rate = parseFloat(rates[ticker]);
      if (Number.isFinite(rate) && rate > 0) {
        prices[coin] = 1 / rate;
        break;
      }
    }
  }
  return prices;
}

/**
 * Tertiary price source: CoinGecko, only used for coins neither Binance nor
 * Coinbase could price.
 */
async function fetchFromCoinGecko(coins: string[]): Promise<Record<string, number>> {
  const coinIds = coins.map((coin) => COIN_ID_MAP[coin]).filter(Boolean).join(",");
  if (!coinIds) return {};

  const response = await fetchWithTimeout(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd`,
    { headers: { Accept: "application/json" } }
  );

  if (!response.ok) {
    throw new Error(`CoinGecko API returned ${response.status}`);
  }

  const data = await response.json();
  const prices: Record<string, number> = {};
  for (const coin of coins) {
    const coinId = COIN_ID_MAP[coin];
    if (coinId && data[coinId]?.usd) {
      prices[coin] = data[coinId].usd;
    }
  }
  return prices;
}

/**
 * GET /api/crypto-prices?coins=BTC,ETH,USDT
 * Fetch crypto prices, preferring Binance (fast, high rate limits) and
 * falling back to CoinGecko only for whatever Binance couldn't price.
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

    const coins = Array.from(
      new Set(
        coinsParam
          .split(",")
          .map((c) => c.trim().toUpperCase())
          .filter(Boolean)
      )
    );

    const prices: Record<string, number> = {};
    for (const coin of coins) {
      if (STABLECOINS.has(coin)) {
        prices[coin] = 1;
      }
    }

    const coinsToFetch = coins.filter((coin) => !STABLECOINS.has(coin));

    if (coinsToFetch.length > 0) {
      let fetched: Record<string, number> = {};
      try {
        fetched = await fetchFromBinance(coinsToFetch);
      } catch (error) {
        console.warn("Binance price fetch failed, falling back to Coinbase:", error);
      }

      let missing = coinsToFetch.filter((coin) => !fetched[coin]);
      if (missing.length > 0) {
        try {
          const fallback = await fetchFromCoinbase(missing);
          fetched = { ...fetched, ...fallback };
        } catch (error) {
          console.warn("Coinbase price fetch failed, falling back to CoinGecko:", error);
        }
      }

      missing = coinsToFetch.filter((coin) => !fetched[coin]);
      if (missing.length > 0) {
        try {
          const fallback = await fetchFromCoinGecko(missing);
          fetched = { ...fetched, ...fallback };
        } catch (error) {
          console.error("CoinGecko fallback price fetch failed:", error);
        }
      }

      Object.assign(prices, fetched);
    }

    // Cache response for 60 seconds to reduce API calls
    return NextResponse.json(
      { prices },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch (error) {
    console.error("Error in crypto-prices API route:", error);
    return NextResponse.json(
      { error: "Internal server error", prices: {} },
      { status: 500 }
    );
  }
}
