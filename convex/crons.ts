import { internalMutation, internalAction } from "./_generated/server";
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { randomDailyUsdForTier, type EarningTier } from "./earningTiers";
import {
  deductUsdLikeFromPlatformBalance,
  totalUsdLikePlatformBalance,
} from "./platformBalanceUsd";
import { fetchLivePricesWithFallback } from "./priceFeed";

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
        const plan = await ctx.db.get(operation.planId);
        const autoRenew = plan !== null && (plan.renewalType ?? "manual") === "auto";
        if (autoRenew && plan !== null) {
          const user = await ctx.db.get(operation.userId);
          const balance = user ? totalUsdLikePlatformBalance(user, prices) : 0;
          if (
            user &&
            balance + 1e-9 >= operation.purchaseAmount &&
            operation.purchaseAmount > 0
          ) {
            try {
              await deductUsdLikeFromPlatformBalance(ctx, user, operation.purchaseAmount, prices);
            } catch {
              await ctx.db.patch(operation._id, { status: "completed" });
              await ctx.scheduler.runAfter(0, internal.emails.sendMiningOperationCompletedEmail, {
                operationId: operation._id,
              });
              completed++;
              processed++;
              continue;
            }
            const newEnd = now + plan.duration * 24 * 60 * 60 * 1000;
            await ctx.db.patch(operation._id, {
              endTime: newEnd,
              startTime: now,
              lastPayoutDate: undefined,
            });
            await ctx.db.insert("auditLogs", {
              actorId: operation.userId,
              action: "mining:autoRenew",
              entity: "miningOperation",
              entityId: operation._id,
              metadata: {
                planId: operation.planId,
                purchaseAmount: operation.purchaseAmount,
              },
              createdAt: now,
            });
            await ctx.scheduler.runAfter(0, internal.emails.sendMiningOperationRenewedEmail, {
              operationId: operation._id,
            });
            processed++;
            continue;
          }
        }
        await ctx.db.patch(operation._id, {
          status: "completed",
        });
        await ctx.scheduler.runAfter(0, internal.emails.sendMiningOperationCompletedEmail, {
          operationId: operation._id,
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

      const purchaseAmount = operation.purchaseAmount ?? 0;
      const tier = operation.dailyEarningTier;
      const hasTier =
        tier === "low" || tier === "mid" || tier === "high";

      if (!hasTier && purchaseAmount <= 0) {
        console.warn(`[processMiningOperations] Operation ${operation._id} has no purchaseAmount, skipping`);
        processed++;
        continue;
      }

      let dailyProfitUSD: number;
      if (hasTier) {
        dailyProfitUSD = randomDailyUsdForTier(tier as EarningTier);
      } else if (operation.dailyReturnUSD !== undefined && operation.dailyReturnUSD > 0) {
        dailyProfitUSD = operation.dailyReturnUSD;
      } else if (
        purchaseAmount > 0 &&
        operation.currentRate > 0 &&
        Number.isFinite(operation.currentRate)
      ) {
        dailyProfitUSD = (operation.currentRate / 100) * purchaseAmount;
      } else {
        processed++;
        continue;
      }

      if (dailyProfitUSD <= 0) {
        processed++;
        continue;
      }

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

          await ctx.db.insert("miningPayouts", {
            userId: operation.userId,
            operationId: operation._id,
            planId: operation.planId,
            coin: operation.coin,
            payoutDate: todayStart,
            purchaseAmount,
            roiPercent:
              purchaseAmount > 0 ? (dailyProfitUSD / purchaseAmount) * 100 : 0,
            profitUSD: dailyProfitUSD,
            profitCoin: dailyProfitCoin,
            coinPriceUSD: coinPrice,
            createdAt: now,
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
 * Internal action to process mining operations
 * Fetches BTC and ETH prices (via the shared Binance -> Coinbase -> CoinGecko
 * chain in priceFeed.ts) and processes daily mining earnings. Falls back to
 * hardcoded prices if every live source is unavailable, so payouts continue.
 */
const processMiningOperationsActionImpl = internalAction({
  args: {},
  handler: async (ctx): Promise<ProcessMiningResult> => {
    console.log(`[processMiningOperations] Starting daily mining operations processing...`);

    const { prices, usedFallback } = await fetchLivePricesWithFallback();
    console.log(
      `[processMiningOperations] Prices: BTC=$${prices["BTC"]}, ETH=$${prices["ETH"]}${usedFallback ? " (used fallback)" : ""}`
    );

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
