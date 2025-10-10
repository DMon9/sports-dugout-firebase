# API Endpoints and Database Integration - Changes

## Overview
This document describes the changes made to fix API endpoints for stats and leaderboard, and to enable UI auto-update upon contest entry.

## Files Created

### `/api/db-functions.js`
**Purpose**: Firebase database helper functions for contest management

**Exported Functions**:
- `getContestStats()` - Retrieves real-time contest statistics from Firebase
  - Returns: `{ totalUsers, totalDeposits, currentLeader, leaderEmail, hasWinner, winnerEmail }`
  
- `getLeaderboard(limit)` - Retrieves top referrers from the database
  - Parameters: `limit` (default: 10) - number of top entries to return
  - Returns: Array of `{ rank, email, referrals, referralCode }`
  
- `addContestEntry({ email, paymentIntentId, amount, referredBy })` - Adds new contest entry
  - Parameters: Object with entry details
  - Returns: `{ id, referralCode, referralLink, ...entryData }`
  - Automatically increments referrer's count if `referredBy` is provided
  
- `isEmailAlreadyEntered(email)` - Checks if email already entered contest
  - Parameters: `email` - email address to check
  - Returns: boolean

## Files Modified

### `/api/index.js`
**Changes**:
- Fixed circular dependency by importing from `./db-functions` instead of `./database`
- Maintains payment intent creation and contest entry confirmation flow
- Supports two-step payment process:
  1. Create payment intent
  2. Confirm payment and add to database via `confirm_payment` flag

### `/api/database.js`
**Changes**:
- Fixed circular dependency by importing from `./db-functions` instead of itself
- Similar structure to `index.js` but with additional payment confirmation handling
- Version updated to 3.1.0

### `/api/stats.js`
**Changes**:
- Now uses real database data via `dbFunctions.getContestStats()`
- Falls back to empty mock data if database not configured
- Returns `source: 'database'` when using real data, `source: 'mock_data'` otherwise

### `/api/contest.js`
**Changes**:
- Fixed module export syntax (changed from ES6 `export default` to CommonJS `module.exports`)
- Updated import to use `./db-functions` instead of `./database`
- Maintains read-only endpoint for contest data retrieval

### `/public/index.html`
**Changes**:
- Updated `processPayment()` function to implement three-step flow:
  1. Create payment intent
  2. Confirm payment with Stripe
  3. Confirm payment success with API to add database entry
- Enhanced `showSuccess()` function to accept and display real referral links
- Added multiple UI refresh calls after successful payment (1s, 2s, 3s delays)
- Improved logging for better debugging

## API Endpoints

### GET `/api?action=stats`
Returns contest statistics from database
```json
{
  "success": true,
  "data": {
    "totalUsers": 5,
    "totalDeposits": 50,
    "currentLeader": 3,
    "leaderEmail": "tes***",
    "hasWinner": false,
    "winnerEmail": null
  },
  "source": "database",
  "timestamp": "2024-10-10T19:31:31.686Z"
}
```

### GET `/api?action=leaderboard`
Returns top referrers
```json
{
  "success": true,
  "data": [
    {
      "rank": 1,
      "email": "tes***",
      "referrals": 3,
      "referralCode": "TSDABC123"
    }
  ]
}
```

### POST `/api`
**Create Payment Intent**
```json
{
  "amount": 1000,
  "currency": "usd",
  "email": "user@example.com"
}
```

**Confirm Payment (Add to Database)**
```json
{
  "confirm_payment": true,
  "payment_intent_id": "pi_xxx",
  "email": "user@example.com",
  "amount": 1000
}
```

Response:
```json
{
  "success": true,
  "message": "Contest entry added successfully",
  "referralCode": "TSDABC123",
  "referralLink": "https://thesportsdugout.com/ref/TSDABC123"
}
```

## Complete Payment Flow

1. **User enters email and amount** → Frontend calls `POST /api` with payment details
2. **Server creates Stripe payment intent** → Returns `client_secret`
3. **Frontend confirms with Stripe** → Stripe confirms payment
4. **Frontend confirms with API** → Calls `POST /api` with `confirm_payment: true`
5. **Server adds to database** → Creates contest entry with referral code
6. **UI refreshes** → Stats and leaderboard update automatically (1s, 2s, 3s delays)

## Testing

Run the test suite:
```bash
node test-api.js
```

This validates:
- All database functions are properly exported
- No circular dependencies exist
- All API files load successfully
- Stats endpoint uses real database data
- HTML includes proper payment flow

## Circular Dependency Resolution

**Before**: `api/index.js` and `api/database.js` both tried to `require('./database')`, causing circular dependency

**After**: Created separate `api/db-functions.js` module containing Firebase functions, which is imported by all API files

## Environment Requirements

Required environment variables:
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `STRIPE_SECRET_KEY` - Stripe API secret key

The system gracefully handles missing configuration:
- Without Firebase: Returns mock data with `source: 'mock_data'`
- Without Stripe: Returns appropriate error messages

## Notes

- The system is designed to work in both test and production modes
- Stripe test mode is detected automatically via the API key
- All endpoints include proper CORS headers
- Payment confirmation is idempotent (safe to retry)
- Referral counting is automatic when `referredBy` is provided
