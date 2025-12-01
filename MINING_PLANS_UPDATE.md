# Mining Plans & Cron Job Update

## Overview
This update implements the new mining plan structure with ROI-based daily profit distribution and updates the cron job to run daily.

## Changes Made

### 1. Schema Updates (`convex/schema.ts`)

#### Plans Table
Added new fields:
- `minPriceUSD` (optional): Minimum entry amount
- `maxPriceUSD` (optional): Maximum entry amount (undefined = unlimited)
- `minDailyROI` (optional): Minimum daily ROI percentage (e.g., 0.5 for 0.5%)
- `maxDailyROI` (optional): Maximum daily ROI percentage (e.g., 0.7 for 0.7%)
- `idealFor` (optional): Target audience description

#### Mining Operations Table
Added new fields:
- `purchaseAmount` (required): The actual amount paid for this operation (for ROI calculation)
- `lastPayoutDate` (optional): Last date profits were paid out (timestamp at start of day)

### 2. Mining Plans Created

#### Beginner Package
- **HashPower**: 500 Gh/s
- **Contract Duration**: 1 month (30 days)
- **Daily Mining ROI**: 0.5% - 0.7%
- **Entry Amount**: $511.43 - $2,997.01
- **Ideal for**: Small investors

#### Premium Package
- **HashPower**: 70 Th/s
- **Contract Duration**: 3 months (90 days)
- **Daily Mining ROI**: 0.8% - 1.0%
- **Entry Amount**: $3,015.02 - $10,115.70
- **Ideal for**: Grown investors

#### Corporate Package
- **HashPower**: 250 Th/s
- **Contract Duration**: 6 months (180 days)
- **Daily Mining ROI**: 1.4% - 1.8%
- **Entry Amount**: $12,057.51 - $19,909.68
- **Ideal for**: High-volume investors

#### Elite Package
- **HashPower**: 500 Th/s
- **Contract Duration**: 12 months (365 days)
- **Daily Mining ROI**: 2.0% - 2.3%
- **Entry Amount**: $20,076.09 - Unlimited
- **Ideal for**: Large-scale corporate investors

### 3. Cron Job Updates (`convex/crons.ts`)

#### Key Changes:
- **Schedule**: Changed from hourly to **daily at midnight UTC** (00:00)
- **Profit Calculation**: Now based on ROI percentage of purchase amount
- **Daily Payouts**: Each operation receives exactly one payout per day
- **ROI Randomization**: Each operation gets a random ROI rate within the plan's range when purchased

#### How It Works:
1. Cron runs daily at 00:00 UTC
2. For each active mining operation:
   - Checks if payout was already made today (using `lastPayoutDate`)
   - Calculates daily profit: `(ROI% / 100) × purchaseAmount`
   - Converts profit to selected coin using current market price
   - Updates user's platform balance and mining balance
   - Sets `lastPayoutDate` to prevent duplicate payouts
3. Marks expired operations as completed

### 4. Purchase Plan Logic (`convex/plans.ts`)

#### Purchase Amount Determination:
- If user balance < `minPriceUSD`: Error (insufficient funds)
- If user balance > `maxPriceUSD`: Uses `maxPriceUSD` as purchase amount
- Otherwise: Uses user's total balance as purchase amount

#### ROI Rate Assignment:
- When purchasing, a random ROI rate is assigned within the plan's range
- This rate is stored in `currentRate` and used for all daily payouts
- Example: Beginner Package (0.5% - 0.7%) might get 0.62% daily ROI

## Setup Instructions

### 1. Deploy Schema Changes
```bash
npx convex deploy
```

### 2. Initialize Plans
Run the initialization function to create the 4 plans:

**Option A: Using Convex Dashboard**
1. Go to Convex Dashboard > Functions
2. Find `initPlans:initializePlans`
3. Click "Run" to execute

**Option B: Using Convex CLI**
```bash
npx convex run initPlans:initializePlans
```

### 3. Verify Cron Job
1. Go to Convex Dashboard > Functions > Schedules
2. Verify `processMiningOperations` is scheduled to run daily at 00:00 UTC
3. If not present, the cron will be registered automatically on next deploy

### 4. Test Daily Payouts
You can manually trigger the cron for testing:
```bash
npx convex run crons:processMiningOperationsAction
```

## How Daily Profits Work

### Example: Beginner Package
- User purchases with $1,000
- Assigned ROI rate: 0.6% (randomized between 0.5% - 0.7%)
- Daily profit: $1,000 × 0.6% = **$6.00/day**
- Over 30 days: $6 × 30 = **$180 total profit**

### Example: Elite Package
- User purchases with $50,000
- Assigned ROI rate: 2.15% (randomized between 2.0% - 2.3%)
- Daily profit: $50,000 × 2.15% = **$1,075.00/day**
- Over 365 days: $1,075 × 365 = **$392,375 total profit**

## Important Notes

1. **Daily Payouts**: Profits are distributed once per day at midnight UTC
2. **ROI Randomization**: Each operation gets a fixed ROI rate when purchased (doesn't change daily)
3. **Purchase Amount**: Users can invest any amount within the plan's range (or unlimited for Elite)
4. **Backward Compatibility**: Old plans without ROI fields will use `estimatedDailyEarning` as fallback
5. **Profit Tracking**: `totalMined` stores cumulative profits in USD

## Troubleshooting

### Plans Not Created
- Check Convex logs for errors
- Ensure schema is deployed before running `initializePlans`
- Verify all required fields are provided

### Cron Not Running
- Check Convex Dashboard > Functions > Schedules
- Verify cron is registered: `processMiningOperations`
- Check logs for errors during execution
- Ensure `processMiningOperationsAction` is accessible

### No Daily Payouts
- Verify operations have `purchaseAmount` set
- Check `lastPayoutDate` - should update after each payout
- Ensure operations are marked as "active"
- Check coin prices are being fetched correctly

### ROI Calculation Issues
- Verify `minDailyROI` and `maxDailyROI` are set on plans
- Check `currentRate` is within the plan's ROI range
- Ensure `purchaseAmount` is stored correctly

## Files Modified

1. `convex/schema.ts` - Updated plans and miningOperations schemas
2. `convex/plans.ts` - Updated purchase logic and plan mutations
3. `convex/crons.ts` - Rewrote profit calculation and daily payout logic
4. `convex/initPlans.ts` - New file to initialize the 4 plans

## Next Steps

1. Deploy all changes: `npx convex deploy`
2. Initialize plans: Run `initializePlans` function
3. Test purchase flow: Create a test user and purchase a plan
4. Monitor cron: Check logs after first daily run
5. Verify payouts: Confirm profits are being distributed correctly



