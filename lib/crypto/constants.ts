/**
 * Supported mainstream cryptocurrencies for hot wallets
 * These match the coins supported in convex/prices.ts
 */
export const SUPPORTED_CRYPTO = [
  "BTC",
  "ETH",
  "SOL",
  "LTC",
  "BNB",
  "ADA",
  "XRP",
  "DOGE",
  "DOT",
  "MATIC",
  "AVAX",
  "ATOM",
  "LINK",
  "UNI",
  "USDT",
  "USDC",
] as const;

export type SupportedCrypto = (typeof SUPPORTED_CRYPTO)[number];

/**
 * Human-readable names for cryptocurrencies
 */
export const CRYPTO_NAMES: Record<SupportedCrypto, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  SOL: "Solana",
  LTC: "Litecoin",
  BNB: "Binance Coin",
  ADA: "Cardano",
  XRP: "Ripple",
  DOGE: "Dogecoin",
  DOT: "Polkadot",
  MATIC: "Polygon",
  AVAX: "Avalanche",
  ATOM: "Cosmos",
  LINK: "Chainlink",
  UNI: "Uniswap",
  USDT: "Tether",
  USDC: "USD Coin",
};

