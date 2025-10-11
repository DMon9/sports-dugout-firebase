# Referral API Quick Reference Guide

## Overview
The Sports Dugout API now has full referral support, allowing users to refer others and track their referrals automatically.

## Key Features
- ✅ Automatic referral code generation for every entry
- ✅ Referral validation before payment
- ✅ Automatic referral count tracking
- ✅ Winner detection at 1000 referrals
- ✅ Complete audit trail with timestamps

## API Endpoints

### 1. Validate Referral Code
Check if a referral code is valid before accepting payment.

**Endpoint:** `GET /api?action=validate_referral&code={CODE}`

**Example Request:**
```bash
curl "https://your-domain.com/api?action=validate_referral&code=TSD123ABC"
```

**Success Response:**
```json
{
  "success": true,
  "valid": true,
  "referrerEmail": "joh***",
  "referrals": 5,
  "source": "database"
}
```

**Invalid Code Response:**
```json
{
  "success": true,
  "valid": false,
  "message": "Referral code not found",
  "source": "database"
}
```

### 2. Create Payment with Referral
Include the `referredBy` field when creating a payment intent.

**Endpoint:** `POST /api`

**Request Body:**
```json
{
  "amount": 1000,
  "currency": "usd",
  "email": "newuser@example.com",
  "referredBy": "TSD123ABC"
}
```

**Response:**
```json
{
  "success": true,
  "client_secret": "pi_xxx_secret_yyy",
  "payment_intent_id": "pi_xxx"
}
```

### 3. Confirm Payment with Referral
After Stripe confirms payment, add entry to database with referral tracking.

**Endpoint:** `POST /api`

**Request Body:**
```json
{
  "confirm_payment": true,
  "payment_intent_id": "pi_xxx",
  "email": "newuser@example.com",
  "amount": 1000,
  "referredBy": "TSD123ABC"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contest entry added successfully",
  "referralCode": "TSDDEF456",
  "referralLink": "https://thesportsdugout.com/api/referral?code=TSDDEF456"
}
```

## Frontend Integration Example

```javascript
// 1. Detect referral code from URL
const urlParams = new URLSearchParams(window.location.search);
const referralCode = urlParams.get('ref');

if (referralCode) {
  // Store for later use
  localStorage.setItem('referralCode', referralCode);
  
  // Validate the code
  const validateResponse = await fetch(
    `https://your-domain.com/api?action=validate_referral&code=${referralCode}`
  );
  const validation = await validateResponse.json();
  
  if (validation.valid) {
    console.log('✅ Valid referral code from', validation.referrerEmail);
    // Show referral banner to user
  } else {
    console.log('❌ Invalid referral code');
    localStorage.removeItem('referralCode');
  }
}

// 2. Create payment intent with referral
const referredBy = localStorage.getItem('referralCode');
const paymentResponse = await fetch('https://your-domain.com/api', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 1000,
    currency: 'usd',
    email: userEmail,
    referredBy: referredBy || null
  })
});

// 3. After Stripe confirms, add to database
const confirmResponse = await fetch('https://your-domain.com/api', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    confirm_payment: true,
    payment_intent_id: paymentIntentId,
    email: userEmail,
    amount: 1000,
    referredBy: referredBy || null
  })
});

const result = await confirmResponse.json();
console.log('Your referral link:', result.referralLink);

// Clear referral code after successful entry
localStorage.removeItem('referralCode');
```

## Database Functions

All these functions are available in both `lib/database.js` and `lib/db-functions.js` (moved from `/api/` to comply with Vercel limits):

### findEntryByReferralCode(referralCode)
Find a contest entry by its referral code.

```javascript
const entry = await dbFunctions.findEntryByReferralCode('TSD123ABC');
// Returns: { id, email, referralCode, referrals, ... } or null
```

### incrementReferralCount(referralCode)
Increment the referral count for a user. Automatically detects winners.

```javascript
const newCount = await dbFunctions.incrementReferralCount('TSD123ABC');
// Returns: new count number (e.g., 6)
// Automatically marks as winner if count reaches 1000
```

### markAsWinner(entryId)
Manually mark an entry as winner.

```javascript
await dbFunctions.markAsWinner('doc_id_123');
// Updates status to 'winner' and adds wonAt timestamp
```

### addContestEntry({ email, paymentIntentId, amount, referredBy })
Add a new contest entry with automatic referral code generation.

```javascript
const entry = await dbFunctions.addContestEntry({
  email: 'user@example.com',
  paymentIntentId: 'pi_xxx',
  amount: 1000,
  referredBy: 'TSD123ABC' // optional
});
// Returns: { id, referralCode, referralLink, ... }
// Automatically increments referrer's count
```

## Referral Code Format

All referral codes follow the format: `TSD` + 6 random alphanumeric characters

Examples:
- `TSDABC123`
- `TSDXYZ789`
- `TSD4K2M9P`

## Winner Detection

The system automatically detects winners:
- When a user's referral count reaches **1000**
- Status changes from `active` to `winner`
- `wonAt` timestamp is added to the entry
- Detection happens during `incrementReferralCount()`

## Error Handling

All endpoints gracefully handle errors:
- Invalid referral codes return `valid: false` without errors
- Database failures fall back to mock data
- Referral increment failures don't block payment processing
- All errors are logged for debugging

## Testing Checklist

- [ ] Referral code validation works
- [ ] Payment with referral code increments referrer's count
- [ ] New entries receive unique referral codes
- [ ] Referral links are properly formatted
- [ ] Winner detection triggers at 1000 referrals
- [ ] Invalid codes handled gracefully
- [ ] Payment works without referral code

## Best Practices

1. **Always validate referral codes** on the frontend before showing referral banners
2. **Store referral codes in localStorage** for persistence across page loads
3. **Clear referral codes** after successful payment to prevent reuse
4. **Handle null referredBy gracefully** - it's optional
5. **Show user their referral link** immediately after successful payment
6. **Log referral activity** for debugging and analytics

## Support

For issues or questions:
1. Check browser console for errors
2. Verify environment variables are set (Firebase credentials)
3. Check API logs for detailed error messages
4. Test with the validation endpoint first
