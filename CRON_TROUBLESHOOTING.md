# Cron Job Troubleshooting Guide

## Issue: Cron Job Not Running Automatically

If your cron job isn't running automatically, follow these steps:

## Step 1: Verify Deployment

1. **Deploy your Convex functions:**
   ```bash
   npx convex deploy
   ```

2. **Check deployment status:**
   ```bash
   npx convex dev
   ```
   Look for any errors related to cron jobs.

## Step 2: Verify Cron Registration in Convex Dashboard

1. Go to your [Convex Dashboard](https://dashboard.convex.dev)
2. Navigate to **Functions** > **Schedules**
3. Look for a schedule named `processMiningOperations`
4. Verify it shows:
   - Status: Active
   - Schedule: Hourly at minute 0
   - Last run: Should show recent timestamp

## Step 3: Check Convex Logs

1. In the Convex Dashboard, go to **Logs**
2. Filter for `processMiningOperations` or `crons`
3. Look for:
   - Execution logs showing the cron running
   - Any error messages
   - Return values showing processed operations

## Step 4: Manual Testing

### Option A: Test via HTTP Endpoint

```bash
# Get your Convex deployment URL from the dashboard
# Then call:
curl https://YOUR_DEPLOYMENT.convex.site/processMiningOperations
```

### Option B: Test via Convex CLI

```bash
npx convex run crons:processMiningOperationsAction
```

### Option C: Test via Convex Dashboard

1. Go to **Functions** > **crons**
2. Find `processMiningOperationsAction`
3. Click **Run** to execute manually
4. Check the logs for results

## Step 5: Verify Cron File Export

Make sure `convex/crons.ts` has:
- ✅ `export default crons;` at the end
- ✅ `crons.hourly()` or `crons.interval()` configured
- ✅ No syntax errors

## Step 6: Common Issues and Solutions

### Issue: Cron not showing in Dashboard Schedules
**Solution:** 
- Redeploy: `npx convex deploy`
- Check that `convex/crons.ts` exports `default crons`
- Verify no TypeScript errors

### Issue: Cron shows as inactive
**Solution:**
- Check Convex Dashboard for any error messages
- Verify the action function exists and is accessible
- Check Convex logs for runtime errors

### Issue: Cron runs but doesn't process operations
**Solution:**
- Check that you have active mining operations (`status: "active"`)
- Verify the action function logic is correct
- Check logs for any errors during execution

### Issue: Cron runs but updates don't appear
**Solution:**
- Verify the mutation is updating the database correctly
- Check that user balances are being updated
- Look for any validation errors in the logs

## Step 7: Enable More Frequent Updates (Optional)

If you want the cron to run more frequently for testing:

1. Edit `convex/crons.ts`
2. Uncomment the `crons.interval()` section
3. Adjust the interval as needed (e.g., 15 minutes = 900 seconds)
4. Redeploy: `npx convex deploy`

## Step 8: Monitor Cron Execution

After fixing, monitor:
- **Convex Dashboard** > **Logs** for execution logs
- **Functions** > **Schedules** for run history
- Your application to verify mining balances are updating

## Still Not Working?

1. **Check Convex Status:** Visit status.convex.dev
2. **Review Documentation:** https://docs.convex.dev/scheduled-functions
3. **Contact Support:** Use Convex Dashboard support or community forums

## Quick Verification Checklist

- [ ] `convex/crons.ts` exists and exports `default crons`
- [ ] `npx convex deploy` completed successfully
- [ ] Cron appears in Dashboard > Functions > Schedules
- [ ] Cron status shows as "Active"
- [ ] Manual test via HTTP endpoint works
- [ ] Manual test via CLI works
- [ ] Logs show cron execution
- [ ] Mining operations are being processed

