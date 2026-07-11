/**
 * Shared live BTC/ETH price feed for Convex actions. Previously duplicated
 * between crons.ts (Binance -> Coinbase -> CoinGecko chain, 5s-timeout per
 * attempt) and deposits.ts (CoinGecko only, no fallback) - the deposit flow
 * inherited the more resilient chain by using this module instead of its own
 * weaker fetch.
 */

/**
 * Fallback prices to use when every live source fails.
 */
export const FALLBACK_PRICES: Record<string, number> = {
  BTC: 95000,
  ETH: 3300,
};

/**
 * Fetch with a hard timeout so a single attempt can never hang indefinitely.
 * CoinGecko's free tier can hang or get rate-limited for many seconds with no
 * response at all.
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 5000,
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
 * Binance symbols for the coins this platform needs prices for. Binance's
 * public ticker endpoint requires no API key, has very high rate limits
 * (1200 request-weight/minute), and responds in well under a second - unlike
 * CoinGecko's free tier.
 */
const BINANCE_SYMBOL_MAP: Record<string, string> = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
};

/** Primary price source: Binance. */
async function fetchPricesFromBinance(): Promise<Record<string, number>> {
  const symbols = Object.values(BINANCE_SYMBOL_MAP);
  const symbolsParam = encodeURIComponent(JSON.stringify(symbols));
  const response = await fetchWithTimeout(
    `https://api.binance.com/api/v3/ticker/price?symbols=${symbolsParam}`,
    { headers: { Accept: "application/json" } },
  );

  if (!response.ok) {
    throw new Error(`Binance API returned ${response.status}`);
  }

  const data = (await response.json()) as Array<{ symbol: string; price: string }>;
  const symbolToCoin = Object.fromEntries(
    Object.entries(BINANCE_SYMBOL_MAP).map(([coin, symbol]) => [symbol, coin]),
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
 * Secondary price source: Coinbase. Used if Binance is unreachable (e.g.
 * blocked from the cloud region this runs in) - an independent exchange
 * guards against any single provider being geo/network-blocked.
 */
async function fetchPricesFromCoinbase(): Promise<Record<string, number>> {
  const response = await fetchWithTimeout(
    "https://api.coinbase.com/v2/exchange-rates?currency=USD",
    { headers: { Accept: "application/json" } },
  );

  if (!response.ok) {
    throw new Error(`Coinbase API returned ${response.status}`);
  }

  const data = await response.json();
  const rates = data?.data?.rates ?? {};
  const prices: Record<string, number> = {};
  for (const [coin, ticker] of [["BTC", "BTC"], ["ETH", "ETH"]] as const) {
    const rate = parseFloat(rates[ticker]);
    if (Number.isFinite(rate) && rate > 0) {
      prices[coin] = 1 / rate;
    }
  }
  return prices;
}

/** Tertiary price source: CoinGecko, only used if Binance and Coinbase both fail. */
async function fetchPricesFromCoinGecko(): Promise<Record<string, number>> {
  const response = await fetchWithTimeout(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",
    {
      headers: {
        Accept: "application/json",
        "User-Agent": "MiningPlatform/1.0",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`CoinGecko API returned ${response.status}`);
  }

  const data = await response.json();
  const prices: Record<string, number> = {};
  if (data.bitcoin?.usd) prices["BTC"] = data.bitcoin.usd;
  if (data.ethereum?.usd) prices["ETH"] = data.ethereum.usd;
  return prices;
}

/**
 * Fetch BTC/ETH prices, trying Binance first (fast, generous rate limits),
 * then Coinbase, then CoinGecko. Returns whatever was fetched (possibly
 * incomplete or empty) - callers decide how to fall back.
 */
export async function fetchLivePricesWithRetry(): Promise<Record<string, number>> {
  try {
    const prices = await fetchPricesFromBinance();
    if (prices["BTC"] && prices["ETH"]) {
      return prices;
    }
  } catch {
    // fall through to Coinbase
  }

  try {
    const prices = await fetchPricesFromCoinbase();
    if (prices["BTC"] && prices["ETH"]) {
      return prices;
    }
  } catch {
    // fall through to CoinGecko
  }

  try {
    return await fetchPricesFromCoinGecko();
  } catch {
    return {};
  }
}

/**
 * Fetch BTC/ETH prices, filling in FALLBACK_PRICES for whichever coin(s)
 * couldn't be fetched live, so callers always get a complete price map.
 */
export async function fetchLivePricesWithFallback(): Promise<{
  prices: Record<string, number>;
  usedFallback: boolean;
}> {
  const prices = await fetchLivePricesWithRetry();
  const usedFallback = !prices["BTC"] || !prices["ETH"];
  return {
    prices: usedFallback ? { ...FALLBACK_PRICES, ...prices } : prices,
    usedFallback,
  };
}
