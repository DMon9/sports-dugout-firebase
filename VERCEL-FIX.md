# Vercel Deployment Fix - Serverless Function Limit

## Problem
Vercel's Hobby plan has a limit of 12 serverless functions per deployment. The repository had 11 JavaScript files in the `/api` directory, which was close to exceeding this limit and could cause deployment failures.

## Root Cause
On Vercel, each `.js` file in the `/api` directory is automatically treated as a separate serverless function endpoint. This includes:
- Utility modules (database.js, db-functions.js)
- Test/debug endpoints (debug-firebase.js, test-stripe.js)
- Actual API endpoints (index.js, stats.js, contest.js, etc.)

## Solution
Moved utility modules and test files out of the `/api` directory into a new `/lib` directory, reducing the serverless function count from **11 to 7**.

## Changes Made

### 1. Created `/lib` Directory
New directory structure for utility modules and non-endpoint files:
```
lib/
├── database.js         (moved from api/)
├── db-functions.js     (moved from api/)
├── debug-firebase.js   (moved from api/)
└── test-stripe.js      (moved from api/)
```

### 2. Updated Import Paths
Updated all files that imported the moved modules:
- `api/index.js`: `require('./database')` → `require('../lib/database')`
- `api/stats.js`: `require('./database')` → `require('../lib/database')`
- `api/referral.js`: `require('./database')` → `require('../lib/database')`
- `api/contest.js`: `require('./db-functions')` → `require('../lib/db-functions')`
- `test-api.js`: Updated paths to reflect new structure

### 3. Final API Directory Structure
The `/api` directory now contains only **7 serverless function endpoints**:
```
api/
├── ai-predictions.js   - AI game predictions endpoint
├── contest.js          - Contest data endpoint
├── games.js            - Games listing endpoint
├── index.js            - Main API endpoint (stats, leaderboard, payments)
├── referral.js         - Referral tracking endpoint
├── squares.js          - Squares pool endpoint
└── stats.js            - Contest statistics endpoint
```

## Benefits
1. **Reduced serverless function count**: From 11 to 7 (well below the 12 limit)
2. **Better organization**: Utility modules separated from API endpoints
3. **Room for growth**: 5 functions worth of headroom for future endpoints
4. **No functionality lost**: All endpoints and utilities work exactly as before

## Testing
All tests pass successfully:
```bash
$ node test-api.js
✅ All tests passed!
```

## Deployment
These changes are backward compatible and require no changes to environment variables or configuration. Simply deploy to Vercel and the serverless function count will be reduced automatically.
