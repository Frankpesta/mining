import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Initialize the 4 mining plans with the correct specifications
 * This should be run once to set up the plans
 */
export const initializePlans = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existingPlans = await ctx.db.query("plans").collect();
    
    // Delete existing plans if any (optional - comment out if you want to keep existing)
    // for (const plan of existingPlans) {
    //   await ctx.db.delete(plan._id);
    // }

    const now = Date.now();

    // 1. Beginner Package
    const beginnerPlan = {
      name: "Beginner Package",
      hashRate: 500,
      hashRateUnit: "GH/s" as const,
      duration: 30, // 1 month = 30 days
      minPriceUSD: 511.43,
      maxPriceUSD: 2997.01,
      priceUSD: 1754.22, // Average of min and max
      supportedCoins: ["BTC", "ETH", "LTC", "SOL", "BNB", "ADA", "XRP", "DOGE", "DOT", "MATIC", "AVAX", "ATOM", "LINK", "UNI"],
      minDailyROI: 0.5, // 0.5%
      maxDailyROI: 0.7, // 0.7%
      estimatedDailyEarning: 10.53, // Average of (0.5% + 0.7%) / 2 * avgPrice
      isActive: true,
      features: [
        "500 Gh/s HashPower",
        "1 Month Contract Duration",
        "0.5% - 0.7% Daily ROI",
        "Ideal for small investors",
        "Entry: $511.43 - $2,997.01",
      ],
      idealFor: "small investors",
      createdAt: now,
      updatedAt: now,
      order: 1,
    };

    // 2. Premium Package
    const premiumPlan = {
      name: "Premium Package",
      hashRate: 70,
      hashRateUnit: "TH/s" as const,
      duration: 90, // 3 months = 90 days
      minPriceUSD: 3015.02,
      maxPriceUSD: 10115.70,
      priceUSD: 6565.36, // Average of min and max
      supportedCoins: ["BTC", "ETH", "LTC", "SOL", "BNB", "ADA", "XRP", "DOGE", "DOT", "MATIC", "AVAX", "ATOM", "LINK", "UNI"],
      minDailyROI: 0.8, // 0.8%
      maxDailyROI: 1.0, // 1.0%
      estimatedDailyEarning: 59.09, // Average of (0.8% + 1.0%) / 2 * avgPrice
      isActive: true,
      features: [
        "70 Th/s HashPower",
        "3 Months Contract Duration",
        "0.8% - 1.0% Daily ROI",
        "Ideal for grown investors",
        "Entry: $3,015.02 - $10,115.70",
      ],
      idealFor: "grown investors",
      createdAt: now,
      updatedAt: now,
      order: 2,
    };

    // 3. Corporate Package
    const corporatePlan = {
      name: "Corporate Package",
      hashRate: 250,
      hashRateUnit: "TH/s" as const,
      duration: 180, // 6 months = 180 days
      minPriceUSD: 12057.51,
      maxPriceUSD: 19909.68,
      priceUSD: 15983.60, // Average of min and max
      supportedCoins: ["BTC", "ETH", "LTC", "SOL", "BNB", "ADA", "XRP", "DOGE", "DOT", "MATIC", "AVAX", "ATOM", "LINK", "UNI"],
      minDailyROI: 1.4, // 1.4%
      maxDailyROI: 1.8, // 1.8%
      estimatedDailyEarning: 255.74, // Average of (1.4% + 1.8%) / 2 * avgPrice
      isActive: true,
      features: [
        "250 Th/s HashPower",
        "6 Months Contract Duration",
        "1.4% - 1.8% Daily ROI",
        "Ideal for high-volume investors",
        "Entry: $12,057.51 - $19,909.68",
      ],
      idealFor: "high-volume investors",
      createdAt: now,
      updatedAt: now,
      order: 3,
    };

    // 4. Elite Package
    const elitePlan = {
      name: "Elite Package",
      hashRate: 500,
      hashRateUnit: "TH/s" as const,
      duration: 365, // 12 months = 365 days
      minPriceUSD: 20076.09,
      maxPriceUSD: undefined, // Unlimited
      priceUSD: 20076.09, // Minimum price
      supportedCoins: ["BTC", "ETH", "LTC", "SOL", "BNB", "ADA", "XRP", "DOGE", "DOT", "MATIC", "AVAX", "ATOM", "LINK", "UNI"],
      minDailyROI: 2.0, // 2.0%
      maxDailyROI: 2.3, // 2.3%
      estimatedDailyEarning: 431.64, // Average of (2.0% + 2.3%) / 2 * minPrice
      isActive: true,
      features: [
        "500 Th/s HashPower",
        "12 Months Contract Duration",
        "2.0% - 2.3% Daily ROI",
        "Ideal for large-scale corporate investors",
        "Entry: $20,076.09 - Unlimited",
      ],
      idealFor: "large-scale corporate investors",
      createdAt: now,
      updatedAt: now,
      order: 4,
    };

    const plans = [beginnerPlan, premiumPlan, corporatePlan, elitePlan];
    const planIds: string[] = [];

    for (const plan of plans) {
      const planId = await ctx.db.insert("plans", plan);
      planIds.push(planId);
    }

    return {
      success: true,
      plansCreated: planIds.length,
      planIds,
    };
  },
});



