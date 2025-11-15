# Mining Earnings Payout Analysis

## Current Flow

### How Mining Earnings Work:
1. **Earnings Accumulation**: 
   - Mining operations accumulate earnings in `miningBalance` (BTC, ETH, LTC, or others)
   - Cron job (`convex/crons.ts`) runs hourly and updates `miningBalance` based on elapsed time
   - Formula: `expectedEarnings = currentRate × elapsedDays`

2. **Withdrawal System**:
   - Withdrawals only work from `platformBalance` (ETH, USDT, USDC)
   - Users can request withdrawals from their platform balance
   - Admin approves and executes withdrawals

### **ISSUE IDENTIFIED**: 
**Mining earnings accumulate in `miningBalance` but withdrawals only work from `platformBalance`. There's NO conversion mechanism!**

Users cannot withdraw their mining earnings because:
- Mining earnings → `miningBalance` (BTC, ETH, LTC, others)
- Withdrawals → `platformBalance` (ETH, USDT, USDC only)
- No bridge between the two

## Recommended Solutions

### Option 1: Auto-convert Mining Earnings to Platform Balance (Recommended)
Modify the cron job to convert mining earnings directly to platform balance:
- For ETH mining: Add directly to `platformBalance.ETH`
- For BTC/LTC/others: Convert to USD equivalent and add to `platformBalance.USDC` or `platformBalance.USDT`

### Option 2: Manual Conversion Function
Create a function that allows users to convert mining balance to platform balance:
- User selects amount from mining balance
- System converts to platform balance (with conversion rates)
- User can then withdraw

### Option 3: Direct Platform Balance Payout
Change mining earnings to go directly to platform balance instead of mining balance.

## Current Implementation Details

**Files Involved:**
- `convex/crons.ts` - Updates `miningBalance` hourly
- `convex/withdrawals.ts` - Only works with `platformBalance`
- `app/(dashboard)/dashboard/wallet/page.tsx` - Shows both balances separately
- `app/(dashboard)/dashboard/withdraw/page.tsx` - Only shows platform balance for withdrawal

