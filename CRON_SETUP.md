# Mining Operations Cron Job Setup

## Overview
The mining operations cron job automatically processes all active mining operations to:
1. Calculate and update earnings based on elapsed time
2. Mark expired operations as completed
3. Update user mining balances

## Setup Options

### Option 1: Convex Scheduled Functions (Recommended)
Convex supports scheduled functions through the dashboard:

1. Go to your Convex Dashboard
2. Navigate to **Functions** > **Schedules**
3. Click **New Schedule**
4. Configure:
   - **Function**: `crons:processMiningOperations`
   - **Schedule**: `0 * * * *` (runs every hour at minute 0)
   - **Description**: "Process mining operations hourly"

### Option 2: External Cron Service
Use an external cron service to call the HTTP endpoint:

1. **Set up HTTP endpoint** (already configured in `convex/http.ts`)
2. **Get your Convex deployment URL** from the dashboard
3. **Configure external cron service** (e.g., cron-job.org, EasyCron):
   - URL: `https://YOUR_DEPLOYMENT.convex.site/processMiningOperations`
   - Schedule: Every hour (`0 * * * *`)
   - Method: GET or POST

### Option 3: Manual Testing
You can manually trigger the cron job for testing:

```bash
# Using Convex CLI
npx convex run crons:processMiningOperations
```

Or call the HTTP endpoint:
```bash
curl https://YOUR_DEPLOYMENT.convex.site/processMiningOperations
```

## How It Works

The cron job:
1. **Fetches all active mining operations**
2. **For each operation**:
   - Checks if it has expired (current time >= endTime)
   - If expired: Marks as completed and awards final earnings
   - If active: Calculates earnings based on elapsed time and updates user balance
3. **Updates operation records** with new `totalMined` values
4. **Returns statistics** about processed operations

## Earnings Calculation

Earnings are calculated as:
```
elapsedDays = (currentTime - startTime) / (24 * 60 * 60 * 1000)
expectedEarnings = currentRate * elapsedDays
balanceDelta = expectedEarnings - totalMined
```

The user's mining balance is updated with the `balanceDelta` amount.

## Monitoring

Check the Convex dashboard logs to see:
- How many operations were processed
- How many were completed
- How many had earnings updated
- Any errors that occurred

## Troubleshooting

If mining operations aren't updating:
1. Check that the cron job is scheduled and running
2. Verify operations have `status: "active"`
3. Check Convex logs for errors
4. Manually trigger the function to test

