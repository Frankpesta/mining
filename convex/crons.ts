import { internalMutation, internalAction } from "./_generated/server";
import { cronJobs } from "convex/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";

/**
 * Helper function to get start of day timestamp (UTC)
 */
function getStartOfDayUTC(timestamp: number): number {
  const date = new Date(timestamp);
  date.setUTCHours(0, 0, 0, 0);
  return date.getTime();
}

/**
 * Internal mutation to process mining operations
 * This processes all active mining operations and distributes daily profits based on ROI
 * Receives prices as a parameter since mutations can't fetch
 * 
 * NOTE: Currently only BTC and ETH mining operations are supported.
 * The cron job fetches prices for BTC and ETH daily and updates mining balances accordingly.
 */
export const processMiningOperationsMutation = internalMutation({
  args: {
    prices: v.optional(v.record(v.string(), v.number())),
  },
  handler: async (ctx, args) => {
    const prices = args.prices ?? {};
    const now = Date.now();
    const todayStart = getStartOfDayUTC(now);
    
    // Get all active operations
    const allOperations = await ctx.db.query("miningOperations").collect();
    const activeOperations = allOperations.filter((op) => op.status === "active");

    let processed = 0;
    let completed = 0;
    let payoutsDistributed = 0;

    for (const operation of activeOperations) {
      // Check if operation has expired
      if (now >= operation.endTime) {
        // Mark as completed
        await ctx.db.patch(operation._id, {
          status: "completed",
        });
        completed++;
        processed++;
        continue;
      }

      // Check if we've already paid out today
      const lastPayoutDate = operation.lastPayoutDate;
      if (lastPayoutDate && getStartOfDayUTC(lastPayoutDate) === todayStart) {
        // Already paid out today, skip
        processed++;
        continue;
      }

      // Calculate daily profit based on ROI percentage
      // operation.currentRate is the daily ROI percentage (e.g., 0.5 for 0.5%)
      // operation.purchaseAmount is the amount invested
      // If purchaseAmount doesn't exist (old operations), skip or use a default
      const purchaseAmount = operation.purchaseAmount ?? 0;
      if (purchaseAmount <= 0) {
        console.warn(`[processMiningOperations] Operation ${operation._id} has no purchaseAmount, skipping`);
        processed++;
        continue;
      }
      
      const dailyProfitUSD = (operation.currentRate / 100) * purchaseAmount;

      // Get real-time price for the coin
      const coinPrice = prices[operation.coin.toUpperCase()] ?? 0;
      
      if (coinPrice <= 0) {
        // Skip if we don't have a valid price
        console.warn(`[processMiningOperations] No price available for ${operation.coin}, skipping operation ${operation._id}`);
        processed++;
        continue;
      }

      // Convert USD profit to coin amount
      const dailyProfitCoin = dailyProfitUSD / coinPrice;

      if (dailyProfitCoin > 0) {
        // Update user balance
        const user = await ctx.db.get(operation.userId);
        if (user) {
          const coin = operation.coin;
          
          // Update platform balance with the coin being mined
          // For stablecoins (USDT, USDC), use 1:1 conversion
          if (coin === "USDT" || coin === "USDC") {
            await ctx.db.patch(operation.userId, {
              platformBalance: {
                ...user.platformBalance,
                [coin]: (user.platformBalance[coin as "USDT" | "USDC"] ?? 0) + dailyProfitUSD,
              },
            });
          } else if (coin === "ETH") {
            // ETH: Add directly to platformBalance.ETH
            await ctx.db.patch(operation.userId, {
              platformBalance: {
                ...user.platformBalance,
                ETH: (user.platformBalance.ETH ?? 0) + dailyProfitCoin,
              },
            });
          } else {
            // For BTC and other coins, use the others record or optional fields
            // BTC is handled here as an optional field in platformBalance
            const supportedOptionalCoins = ["BTC", "SOL", "LTC", "BNB", "ADA", "XRP", "DOGE", "DOT", "MATIC", "AVAX", "ATOM", "LINK", "UNI"] as const;
            const isOptionalCoin = supportedOptionalCoins.includes(coin as typeof supportedOptionalCoins[number]);
            
            if (isOptionalCoin) {
              // Update optional coin field
              const coinKey = coin as typeof supportedOptionalCoins[number];
              const currentBalance = (user.platformBalance[coinKey] ?? 0) as number;
              await ctx.db.patch(operation.userId, {
                platformBalance: {
                  ETH: user.platformBalance.ETH,
                  USDT: user.platformBalance.USDT,
                  USDC: user.platformBalance.USDC,
                  BTC: user.platformBalance.BTC,
                  SOL: user.platformBalance.SOL,
                  LTC: user.platformBalance.LTC,
                  BNB: user.platformBalance.BNB,
                  ADA: user.platformBalance.ADA,
                  XRP: user.platformBalance.XRP,
                  DOGE: user.platformBalance.DOGE,
                  DOT: user.platformBalance.DOT,
                  MATIC: user.platformBalance.MATIC,
                  AVAX: user.platformBalance.AVAX,
                  ATOM: user.platformBalance.ATOM,
                  LINK: user.platformBalance.LINK,
                  UNI: user.platformBalance.UNI,
                  others: user.platformBalance.others,
                  [coinKey]: currentBalance + dailyProfitCoin,
                },
              });
            } else {
              // Store in others record for unsupported coins
              const currentOthers = user.platformBalance.others ?? {};
              await ctx.db.patch(operation.userId, {
                platformBalance: {
                  ...user.platformBalance,
                  others: {
                    ...currentOthers,
                    [coin]: (currentOthers[coin] ?? 0) + dailyProfitCoin,
                  },
                },
              });
            }
          }

          // Also update mining balance for tracking purposes
          if (coin === "BTC" || coin === "ETH" || coin === "LTC") {
            const coreCoin = coin as "BTC" | "ETH" | "LTC";
            await ctx.db.patch(operation.userId, {
              miningBalance: {
                ...user.miningBalance,
                [coreCoin]: (user.miningBalance[coreCoin] ?? 0) + dailyProfitCoin,
              },
            });
          } else {
            // For other coins in mining balance, check if they're optional fields
            const supportedMiningCoins = ["SOL", "BNB", "ADA", "XRP", "DOGE", "DOT", "MATIC", "AVAX", "ATOM", "LINK", "UNI"] as const;
            const isSupportedMiningCoin = supportedMiningCoins.includes(coin as typeof supportedMiningCoins[number]);
            
            if (isSupportedMiningCoin) {
              const coinKey = coin as typeof supportedMiningCoins[number];
              const currentMining = (user.miningBalance[coinKey] ?? 0) as number;
              const updatedBalance = {
                ...user.miningBalance,
                [coinKey]: currentMining + dailyProfitCoin,
              };
              await ctx.db.patch(operation.userId, {
                miningBalance: updatedBalance,
              });
            } else {
              // Store in others record for unsupported mining coins
              const currentOthers = user.miningBalance.others ?? {};
              await ctx.db.patch(operation.userId, {
                miningBalance: {
                  ...user.miningBalance,
                  others: {
                    ...currentOthers,
                    [coin]: (currentOthers[coin] ?? 0) + dailyProfitCoin,
                  },
                },
              });
            }
          }

          // Update operation: add to totalMined and set lastPayoutDate
          await ctx.db.patch(operation._id, {
            totalMined: operation.totalMined + dailyProfitUSD, // Store in USD for tracking
            lastPayoutDate: todayStart,
          });

          payoutsDistributed++;
        }
      }

      processed++;
    }

    return {
      processed,
      completed,
      payoutsDistributed,
      timestamp: now,
    };
  },
});

type ProcessMiningResult = {
  processed: number;
  completed: number;
  payoutsDistributed: number;
  timestamp: number;
};

/**
 * Fallback prices to use when API fails (updated periodically)
 * These are reasonable defaults - the actual profit is based on ROI percentage
 * so the exact price mainly affects the coin amount received, not the USD value
 */
const FALLBACK_PRICES: Record<string, number> = {
  BTC: 95000, // ~$95,000 USD per BTC (as of early 2025)
  ETH: 3300,  // ~$3,300 USD per ETH (as of early 2025)
};

/**
 * Fetch prices with retry logic and exponential backoff
 */
async function fetchPricesWithRetry(maxRetries = 3): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Fetch both BTC and ETH in a single request to reduce API calls
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd",
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "MiningPlatform/1.0",
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.bitcoin?.usd) {
          prices["BTC"] = data.bitcoin.usd;
        }
        if (data.ethereum?.usd) {
          prices["ETH"] = data.ethereum.usd;
        }
        
        if (prices["BTC"] && prices["ETH"]) {
          console.log(`[processMiningOperations] Fetched prices: BTC=$${prices["BTC"]}, ETH=$${prices["ETH"]}`);
          return prices;
        }
      } else if (response.status === 429) {
        // Rate limited - wait longer before retry
        const waitTime = Math.pow(2, attempt) * 2000; // 4s, 8s, 16s
        console.warn(`[processMiningOperations] Rate limited (429), waiting ${waitTime}ms before retry ${attempt}/${maxRetries}`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
        continue;
      } else {
        console.warn(`[processMiningOperations] API returned ${response.status}, attempt ${attempt}/${maxRetries}`);
      }
    } catch (error) {
      console.warn(`[processMiningOperations] Fetch error on attempt ${attempt}/${maxRetries}:`, error);
    }
    
    // Wait before retry with exponential backoff
    if (attempt < maxRetries) {
      const waitTime = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }
  }
  
  return prices;
}

/**
 * Internal action to process mining operations
 * Fetches BTC and ETH prices from CoinGecko and processes daily mining earnings
 * Uses fallback prices if API is unavailable to ensure payouts continue
 */
const processMiningOperationsActionImpl = internalAction({
  args: {},
  handler: async (ctx): Promise<ProcessMiningResult> => {
    console.log(`[processMiningOperations] Starting daily mining operations processing...`);
    
    // Fetch prices with retry logic
    let prices = await fetchPricesWithRetry(3);
    
    // If we couldn't fetch prices, use fallback prices
    // This ensures payouts continue even if the API is down
    let usedFallback = false;
    if (!prices["BTC"] || !prices["ETH"]) {
      console.warn(`[processMiningOperations] Using fallback prices due to API issues`);
      prices = { ...FALLBACK_PRICES, ...prices };
      usedFallback = true;
      console.log(`[processMiningOperations] Fallback prices: BTC=$${prices["BTC"]}, ETH=$${prices["ETH"]}`);
    }
    
    // Call the mutation with fetched or fallback prices
    const result = await ctx.runMutation(internal.crons.processMiningOperationsMutation, {
      prices,
    }) as ProcessMiningResult;
    
    console.log(
      `[processMiningOperations] Completed. Processed: ${result.processed}, Completed: ${result.completed}, Payouts: ${result.payoutsDistributed}${usedFallback ? ' (used fallback prices)' : ''}`
    );
    
    return result;
  },
});

// Export after definition to avoid circular reference issues
export const processMiningOperationsAction = processMiningOperationsActionImpl;

/**
 * Convex cron jobs configuration
 * This schedules the mining operations processor to run automatically
 * 
 * IMPORTANT: For cron jobs to work automatically in Convex:
 * 1. Make sure this file is deployed: `npx convex deploy`
 * 2. Check the Convex Dashboard > Functions > Schedules to verify the cron is registered
 * 3. The cron will run automatically once deployed and registered
 */
const crons = cronJobs();

// Run daily at 00:00 UTC (midnight UTC) to distribute daily mining profits
// Reference the action after it's been fully defined and exported
crons.daily(
  "processMiningOperations",
  {
    hourUTC: 0, // Run at midnight UTC (00:00)
    minuteUTC: 0,
  },
  internal.crons.processMiningOperationsAction,
);

export default crons;
