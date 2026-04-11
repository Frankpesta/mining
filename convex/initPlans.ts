import { internalMutation } from "./_generated/server";

/**
 * Seed the two standard mining plans (optional internal utility).
 * Prefer creating plans via the admin UI after schema deploy.
 */
export const initializePlans = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();

    const plan1 = {
      name: "Micro Plan",
      hashRate: 20,
      hashRateUnit: "TH/s" as const,
      duration: 30,
      minPriceUSD: 100,
      maxPriceUSD: 2651,
      priceUSD: 100,
      supportedCoins: ["BTC", "ETH"],
      dailyRoiPercent: 7,
      renewalType: "manual" as const,
      isActive: true,
      features: [
        "1 Month mining contract",
        "SHA-256 mining algorithm",
        "Manual renewal",
        "Zero maintenance fee",
      ],
      idealFor: "Beginner",
      createdAt: now,
      updatedAt: now,
      order: 0,
    };

    const plan2 = {
      name: "Gold Plan",
      hashRate: 720,
      hashRateUnit: "TH/s" as const,
      duration: 90,
      minPriceUSD: 2652,
      priceUSD: 2652,
      supportedCoins: ["BTC", "ETH"],
      dailyRoiPercent: 8.5,
      renewalType: "auto" as const,
      isActive: true,
      features: [
        "3 Months mining contract",
        "SHA-256 mining algorithm",
        "Auto renewal",
        "Zero maintenance fee",
      ],
      idealFor: "Professional",
      createdAt: now,
      updatedAt: now,
      order: 1,
    };

    const id1 = await ctx.db.insert("plans", plan1);
    const id2 = await ctx.db.insert("plans", plan2);

    return {
      success: true,
      planIds: [id1, id2],
    };
  },
});
