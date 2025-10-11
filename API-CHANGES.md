# API Endpoints and Database Integration - Changes

## Overview
This document describes the changes made to fix API endpoints for stats and leaderboard, enable UI auto-update upon contest entry, and provide full referral support.

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

- `incrementReferralCount(referralCode)` - Increments referral count for a referrer
  - Parameters: `referralCode` - the referral code to increment
  - Returns: new count number
  - Automatically marks as winner when reaching 1000 referrals

- `findEntryByReferralCode(referralCode)` - Finds contest entry by referral code
  - Parameters: `referralCode` - the referral code to look up
  - Returns: entry object with id and data, or null if not found

- `markAsWinner(entryId)` - Marks a contest entry as winner
  - Parameters: `entryId` - database document ID
  - Updates status to 'winner' and adds wonAt timestamp

## Files Modified

### `/api/index.js`
**Changes**:
- Fixed circular dependency by importing from `./database`
- Maintains payment intent creation and contest entry confirmation flow
- Supports two-step payment process:
  1. Create payment intent with optional `referredBy` field
  2. Confirm payment and add to database via `confirm_payment` flag
- Added new `validate_referral` endpoint for referral code validation
- Updated to version 3.3.0 with full referral support
- Added features list in health check response

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

### GET `/api?action=validate_referral&code=TSD123ABC`
Validates a referral code before payment
```json
{
  "success": true,
  "valid": true,
  "referrerEmail": "tes***",
  "referrals": 5,
  "source": "database"
}
```

Invalid code response:
```json
{
  "success": true,
  "valid": false,
  "message": "Referral code not found",
  "source": "database"
}
```

### POST `/api`
**Create Payment Intent**
```json
{
  "amount": 1000,
  "currency": "usd",
  "email": "user@example.com",
  "referredBy": "TSD123ABC"
}
```

**Confirm Payment (Add to Database)**
```json
{
  "confirm_payment": true,
  "payment_intent_id": "pi_xxx",
  "email": "user@example.com",
  "amount": 1000,
  "referredBy": "TSD123ABC"
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

1. **User enters email and amount** → Frontend calls `POST /api` with payment details (optionally including `referredBy` code)
2. **Server creates Stripe payment intent** → Returns `client_secret` (stores referral code in metadata)
3. **Frontend confirms with Stripe** → Stripe confirms payment
4. **Frontend confirms with API** → Calls `POST /api` with `confirm_payment: true` and `referredBy` code
5. **Server adds to database** → Creates contest entry with unique referral code
6. **Server increments referrer count** → If `referredBy` was provided, increments that referrer's count
7. **Auto-winner detection** → If referrer reaches 1000 referrals, automatically marked as winner
8. **UI refreshes** → Stats and leaderboard update automatically (1s, 2s, 3s delays)

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

## Referral System Features

The system now includes comprehensive referral support:

### Referral Code Generation
- Every contest entry automatically receives a unique referral code (format: TSD + 6 random alphanumeric chars)
- Referral link format: `https://thesportsdugout.com/api/referral?code=TSD123ABC`

### Referral Tracking
- New users can include `referredBy` field when signing up
- System automatically increments referrer's count when referred user completes payment
- Referral counts are tracked with timestamps for audit trail

### Winner Detection
- System automatically detects when a user reaches 1000 referrals
- Entry is marked as 'winner' with `wonAt` timestamp
- Winner detection happens during referral count increment

### Referral Validation
- Frontend can validate referral codes before payment via `/api?action=validate_referral&code=XXX`
- Returns referrer information (masked email, current referral count)
- Gracefully handles invalid codes

### Database Schema
Each contest entry includes:
- `referralCode` - unique code for this user
- `referralLink` - full URL for sharing
- `referredBy` - code of who referred this user (null if direct signup)
- `referrals` - count of successful referrals
- `status` - 'active' or 'winner'
- `wonAt` - timestamp when reached 1000 referrals (if winner)
- `lastUpdated` - timestamp of last referral count update

## Notes

- The system is designed to work in both test and production modes
- Stripe test mode is detected automatically via the API key
- All endpoints include proper CORS headers
- Payment confirmation is idempotent (safe to retry)
- Referral counting is automatic when `referredBy` is provided
- Referral validation is non-blocking (failures don't prevent payment)
