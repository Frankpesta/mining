# CoinGecko API Rate Limiting

## Issue
CoinGecko API returns `429 Too Many Requests` error when rate limits are exceeded.

## CoinGecko Free Tier Limits
- **Free tier**: ~10-50 calls/minute (varies by endpoint)
- **Pro tier**: Higher limits available

## Current Implementation

### Retry Logic
- Added exponential backoff retry logic for 429 errors
- Maximum 3 retries with delays: 1s, 2s, 4s
- Automatically retries on rate limit errors

### Rate Limit Handling
The `getCryptoPricesAction` and `getCoinPriceAction` functions now:
1. Detect 429 status codes
2. Wait with exponential backoff (1s, 2s, 4s)
3. Retry up to 3 times
4. Return empty results if all retries fail

### Where Prices Are Fetched
1. **Cron Job** (`processMiningOperationsAction`): Runs hourly, fetches all 16 coins
2. **Platform Balance Calculation**: Fetches prices for user's coins on-demand
3. **Mining Balance Calculation**: Fetches prices for user's coins on-demand

## Recommendations

### Short-term Solutions
1. ✅ **Implemented**: Retry logic with exponential backoff
2. ✅ **Implemented**: Added delay in cron job to prevent simultaneous requests
3. ⚠️ **Monitor**: Watch for 429 errors in logs

### Long-term Solutions
1. **Upgrade to CoinGecko Pro API** (if budget allows)
   - Higher rate limits
   - More reliable service
   - Better support

2. **Implement Caching** (future enhancement)
   - Cache prices for 1-5 minutes
   - Reduce API calls significantly
   - Use Convex storage or in-memory cache

3. **Batch Requests More Efficiently**
   - Group multiple user requests together
   - Fetch prices once per minute maximum
   - Share cached prices across requests

4. **Alternative Price Sources**
   - Consider backup APIs (Binance, CoinMarketCap)
   - Fallback to alternative when CoinGecko is rate limited
   - Distribute load across multiple providers

## Monitoring
- Check Convex logs for `429` errors
- Monitor frequency of rate limit hits
- Consider upgrading if rate limits are hit frequently

## Current Status
- ✅ Retry logic implemented
- ✅ Better error handling
- ✅ Improved logging
- ⚠️ May still hit rate limits if many users request prices simultaneously
- 💡 Consider implementing caching for production

