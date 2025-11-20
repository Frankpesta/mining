/**
 * Test script to verify crypto conversion APIs are working
 * Run with: npx tsx scripts/test-crypto-prices.ts
 */

const COINGECKO_API = "https://api.coingecko.com/api/v3";

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
  MATIC: "polygon",
  AVAX: "avalanche-2",
  ATOM: "cosmos",
  LINK: "chainlink",
  UNI: "uniswap",
  USDT: "tether",
  USDC: "usd-coin",
};

const SUPPORTED_COINS = Object.keys(COIN_ID_MAP);

async function testSingleCoinPrice(coin: string): Promise<number> {
  const coinId = COIN_ID_MAP[coin];
  if (!coinId) {
    console.error(`❌ No CoinGecko ID found for ${coin}`);
    return 0;
  }

  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinId}&vs_currencies=usd`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      console.error(`❌ API request failed for ${coin}: ${response.status} ${response.statusText}`);
      return 0;
    }

    const data = await response.json();
    const price = data[coinId]?.usd ?? 0;
    
    if (price > 0) {
      console.log(`✅ ${coin}: $${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
    } else {
      console.error(`❌ ${coin}: No price data returned`);
    }
    
    return price;
  } catch (error) {
    console.error(`❌ Error fetching price for ${coin}:`, error);
    return 0;
  }
}

async function testMultipleCoinPrices(coins: string[]): Promise<Record<string, number>> {
  const coinIds = coins
    .map((coin) => COIN_ID_MAP[coin.toUpperCase()])
    .filter(Boolean)
    .join(",");

  if (!coinIds) {
    console.error("❌ No valid coin IDs found");
    return {};
  }

  try {
    const response = await fetch(
      `${COINGECKO_API}/simple/price?ids=${coinIds}&vs_currencies=usd`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
      return {};
    }

    const data = await response.json();
    const prices: Record<string, number> = {};

    // Map CoinGecko IDs back to coin symbols
    for (const [coin, coinId] of Object.entries(COIN_ID_MAP)) {
      if (data[coinId]?.usd) {
        prices[coin] = data[coinId].usd;
        console.log(`✅ ${coin}: $${prices[coin].toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      } else {
        console.error(`❌ ${coin}: No price data returned`);
      }
    }

    return prices;
  } catch (error) {
    console.error("❌ Error fetching crypto prices:", error);
    return {};
  }
}

async function main() {
  console.log("🚀 Testing Crypto Conversion APIs\n");
  console.log("=" .repeat(50));
  
  // Test 1: Single coin price (BTC)
  console.log("\n📊 Test 1: Single Coin Price (BTC)");
  console.log("-".repeat(50));
  await testSingleCoinPrice("BTC");
  
  // Test 2: Multiple coin prices
  console.log("\n📊 Test 2: Multiple Coin Prices (All Supported Coins)");
  console.log("-".repeat(50));
  const prices = await testMultipleCoinPrices(SUPPORTED_COINS);
  
  // Test 3: Verify all coins have prices
  console.log("\n📊 Test 3: Verification Summary");
  console.log("-".repeat(50));
  const coinsWithPrices = Object.keys(prices).length;
  const coinsWithoutPrices = SUPPORTED_COINS.length - coinsWithPrices;
  
  console.log(`Total coins tested: ${SUPPORTED_COINS.length}`);
  console.log(`✅ Coins with prices: ${coinsWithPrices}`);
  console.log(`${coinsWithoutPrices > 0 ? "❌" : "✅"} Coins without prices: ${coinsWithoutPrices}`);
  
  if (coinsWithPrices === SUPPORTED_COINS.length) {
    console.log("\n🎉 All crypto conversion APIs are working correctly!");
  } else {
    console.log("\n⚠️  Some coins failed to fetch prices. Check the errors above.");
  }
  
  // Test 4: Verify stablecoins are ~$1
  console.log("\n📊 Test 4: Stablecoin Verification");
  console.log("-".repeat(50));
  const stablecoins = ["USDT", "USDC"];
  for (const coin of stablecoins) {
    const price = prices[coin];
    if (price) {
      const diff = Math.abs(price - 1);
      if (diff < 0.01) {
        console.log(`✅ ${coin}: $${price.toFixed(4)} (within expected range)`);
      } else {
        console.log(`⚠️  ${coin}: $${price.toFixed(4)} (unexpected price, should be ~$1)`);
      }
    }
  }
}

main().catch(console.error);

