import { internalMutation } from "./_generated/server";
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";

/**
 * Internal mutation to process mining operations
 * This processes all active mining operations and updates earnings
 */
export const processMiningOperationsMutation = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    // Get all active operations (we'll filter by status in the loop since index might not exist)
    const allOperations = await ctx.db.query("miningOperations").collect();
    const activeOperations = allOperations.filter((op) => op.status === "active");

    let processed = 0;
    let completed = 0;
    let earningsUpdated = 0;

    for (const operation of activeOperations) {
      // Check if operation has expired
      if (now >= operation.endTime) {
        // Mark as completed
        await ctx.db.patch(operation._id, {
          status: "completed",
        });

        // Calculate final earnings for the remaining time
        // operation.currentRate is in USD per day
        const elapsedMs = operation.endTime - operation.startTime;
        const elapsedDays = elapsedMs / (24 * 60 * 60 * 1000);
        const finalEarningsUSD = operation.currentRate * elapsedDays;

        // Update user balance with final earnings
        // Mining earnings are paid out to platform balance for withdrawal
        const user = await ctx.db.get(operation.userId);
        if (user) {
          const coin = operation.coin;
          
          // Get real-time price for the coin
          const coinPrice = await ctx.runQuery(api.prices.getCoinPrice, { coin });
          
          // Convert USD earnings to coin amount
          const finalEarningsCoin = coinPrice > 0 ? finalEarningsUSD / coinPrice : 0;
          
          // Calculate delta (operation.totalMined is already in coin amount)
          const earningsDeltaCoin = finalEarningsCoin - operation.totalMined;
          
          if (earningsDeltaCoin > 0) {
            const coinAmount = earningsDeltaCoin;
            
            if (coinAmount > 0) {
              // Update platform balance with the coin being mined
              // For stablecoins (USDT, USDC), use 1:1 conversion
              if (coin === "USDT" || coin === "USDC") {
                const earningsDeltaUSD = coinAmount * coinPrice;
                await ctx.db.patch(operation.userId, {
                  platformBalance: {
                    ...user.platformBalance,
                    [coin]: (user.platformBalance[coin as "USDT" | "USDC"] ?? 0) + earningsDeltaUSD,
                  },
                });
              } else {
                // For other coins, add to platform balance
                const currentBalance = (user.platformBalance as any)[coin] ?? 0;
                await ctx.db.patch(operation.userId, {
                  platformBalance: {
                    ...user.platformBalance,
                    [coin]: currentBalance + coinAmount,
                  } as any,
                });
              }

              // Also update mining balance for tracking purposes
              if (coin === "BTC" || coin === "ETH" || coin === "LTC") {
                const coreCoin = coin as "BTC" | "ETH" | "LTC";
                await ctx.db.patch(operation.userId, {
                  miningBalance: {
                    ...user.miningBalance,
                    [coreCoin]: (user.miningBalance[coreCoin] ?? 0) + coinAmount,
                  },
                });
              } else {
                const currentMining = (user.miningBalance as any)[coin] ?? 0;
                await ctx.db.patch(operation.userId, {
                  miningBalance: {
                    ...user.miningBalance,
                    [coin]: currentMining + coinAmount,
                  } as any,
                });
              }

              // Update operation with final earnings (in coin amount)
              await ctx.db.patch(operation._id, {
                totalMined: finalEarningsCoin,
              });
              earningsUpdated++;
            }
          }
        }

        completed++;
        processed++;
        continue;
      }

      // Calculate earnings based on elapsed time
      // operation.currentRate is in USD per day
      const elapsedMs = now - operation.startTime;
      const elapsedDays = elapsedMs / (24 * 60 * 60 * 1000);
      const expectedEarningsUSD = operation.currentRate * elapsedDays;

      // Get real-time price for the coin
      const coinPrice = await ctx.runQuery(api.prices.getCoinPrice, { coin: operation.coin });
      
      // Convert USD earnings to coin amount
      const expectedEarningsCoin = coinPrice > 0 ? expectedEarningsUSD / coinPrice : 0;

      // Only update if there's a meaningful difference (at least 0.0001)
      if (Math.abs(expectedEarningsCoin - operation.totalMined) >= 0.0001) {
        const balanceDeltaCoin = expectedEarningsCoin - operation.totalMined;

        // Update user balance
        // Mining earnings are paid out to platform balance for withdrawal
        const user = await ctx.db.get(operation.userId);
        if (user && balanceDeltaCoin > 0) {
          const coin = operation.coin;
          
          // Update platform balance with the coin being mined
          // For stablecoins (USDT, USDC), use 1:1 conversion
          if (coin === "USDT" || coin === "USDC") {
            const balanceDeltaUSD = balanceDeltaCoin * coinPrice;
            await ctx.db.patch(operation.userId, {
              platformBalance: {
                ...user.platformBalance,
                [coin]: (user.platformBalance[coin as "USDT" | "USDC"] ?? 0) + balanceDeltaUSD,
              },
            });
          } else {
            // For other coins, add to platform balance
            const currentBalance = (user.platformBalance as any)[coin] ?? 0;
            await ctx.db.patch(operation.userId, {
              platformBalance: {
                ...user.platformBalance,
                [coin]: currentBalance + balanceDeltaCoin,
              } as any,
            });
          }

          // Also update mining balance for tracking purposes
          if (coin === "BTC" || coin === "ETH" || coin === "LTC") {
            const coreCoin = coin as "BTC" | "ETH" | "LTC";
            await ctx.db.patch(operation.userId, {
              miningBalance: {
                ...user.miningBalance,
                [coreCoin]: (user.miningBalance[coreCoin] ?? 0) + balanceDeltaCoin,
              },
            });
          } else {
            const currentMining = (user.miningBalance as any)[coin] ?? 0;
            await ctx.db.patch(operation.userId, {
              miningBalance: {
                ...user.miningBalance,
                [coin]: currentMining + balanceDeltaCoin,
              } as any,
            });
          }

          // Update operation earnings (in coin amount)
          await ctx.db.patch(operation._id, {
            totalMined: expectedEarningsCoin,
          });
          earningsUpdated++;
        }
      }

      processed++;
    }

    return {
      processed,
      completed,
      earningsUpdated,
      timestamp: now,
    };
  },
});

/**
 * Convex cron jobs configuration
 * This schedules the mining operations processor to run every hour
 */
const crons = cronJobs();

crons.hourly(
  "processMiningOperations",
  {
    minuteUTC: 0, // Run at minute 0 of every hour (UTC)
  },
  internal.crons.processMiningOperationsMutation,
);

export default crons;

