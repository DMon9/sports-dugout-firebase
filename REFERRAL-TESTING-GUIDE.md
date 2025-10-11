# Referral Link Testing Guide

## Overview
This guide explains how to test the new referral link functionality implemented in `public/index.html`.

## Features Implemented

### 1. Referral Code Detection
- URL parameter `?ref=CODE` is automatically detected on page load
- Referral code is stored in `localStorage` for persistence
- Code is included in payment API calls

### 2. Referral Banner
- Displays a blue/purple banner at the top of the page when a referral code is detected
- Shows the referral code to the user
- Can be dismissed by clicking the ✕ button

### 3. Auto-Signup Feature
- URL parameter `?signup=true` automatically opens the signup modal after 1 second
- Works in conjunction with referral codes

### 4. Payment Integration
- Referral code is sent with payment intent creation (`referredBy` field)
- Referral code is sent with payment confirmation (`referredBy` field)
- Code is cleared from localStorage after successful payment

## Testing Instructions

### Test Case 1: Basic Referral Link
**URL:** `https://your-domain.com/?ref=TSD123ABC`

**Expected Behavior:**
1. Page loads normally
2. Blue/purple banner appears at top: "🎉 You were referred by TSD123ABC! Both of you get credit when you join!"
3. Console shows: `🔗 Referral code detected: TSD123ABC`
4. localStorage contains: `referralCode = "TSD123ABC"`

**Manual Test:**
```javascript
// Open browser console and run:
localStorage.getItem('referralCode')
// Should return: "TSD123ABC"
```

### Test Case 2: Referral Link + Auto-Signup
**URL:** `https://your-domain.com/?ref=TESTUSER456&signup=true`

**Expected Behavior:**
1. Page loads with referral banner
2. After 1 second, signup modal automatically opens
3. User can proceed with signup and deposit

### Test Case 3: Payment with Referral Code
**Steps:**
1. Visit a referral link: `?ref=MYCODE`
2. Click "JOIN CONTEST NOW" button
3. Fill in email and password
4. Proceed to deposit
5. Complete payment with test card

**Expected Console Logs:**
```
🔗 Referral code detected: MYCODE
💳 Creating payment intent with referral: MYCODE
✅ Payment succeeded: pi_xxxxx
📝 Adding contest entry to database...
✅ Contest entry added: success
```

**Expected API Calls:**

Payment Intent Creation:
```json
{
  "amount": 1000,
  "currency": "usd",
  "email": "test@example.com",
  "referredBy": "MYCODE"
}
```

Payment Confirmation:
```json
{
  "confirm_payment": true,
  "payment_intent_id": "pi_xxxxx",
  "email": "test@example.com",
  "amount": 1000,
  "referredBy": "MYCODE"
}
```

**After Payment:**
```javascript
// Check localStorage - should be empty
localStorage.getItem('referralCode')
// Should return: null
```

### Test Case 4: No Referral Code
**URL:** `https://your-domain.com/`

**Expected Behavior:**
1. Page loads normally
2. No referral banner appears
3. Payment works without referral code (referredBy will be null)

## Code Changes Summary

### New Functions Added:
1. **showReferralBanner(referralCode)** - Creates and displays the referral banner
2. **DOMContentLoaded event handler** - Detects and processes referral parameters

### Modified Functions:
1. **processPayment()** - Now includes referral code in API calls and clears it after success

### localStorage Keys:
- `referralCode` - Stores the referral code temporarily

## Backend Requirements

The backend API must handle the new `referredBy` field in:
1. Payment intent creation endpoint
2. Payment confirmation endpoint

Example backend handling:
```javascript
// Payment intent creation
app.post('/api', async (req, res) => {
  const { amount, currency, email, referredBy } = req.body;
  // Store referredBy with payment intent
  // Credit the referrer when payment succeeds
});

// Payment confirmation
app.post('/api', async (req, res) => {
  const { confirm_payment, payment_intent_id, email, amount, referredBy } = req.body;
  // Update referral counts
  // Link new user to referrer
});
```

## Browser Console Testing

Use these commands in the browser console to test:

```javascript
// Check if referral code is stored
localStorage.getItem('referralCode')

// Manually set a referral code (for testing)
localStorage.setItem('referralCode', 'TESTCODE')

// Clear referral code
localStorage.removeItem('referralCode')

// Check all localStorage items
console.log(localStorage)
```

## Verification Checklist

- [ ] Referral banner appears when using ?ref parameter
- [ ] Referral code is stored in localStorage
- [ ] Banner can be dismissed
- [ ] Auto-signup works with ?signup=true parameter
- [ ] Payment includes referredBy field in API calls
- [ ] Console logs show correct referral code
- [ ] localStorage is cleared after successful payment
- [ ] Normal flow works without referral code

## Notes

- Referral codes are case-sensitive
- Referral codes persist across page refreshes (stored in localStorage)
- Referral codes are only cleared after successful payment
- Multiple referral visits will overwrite previous codes
- The banner uses z-index of 50 to appear above other content

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify localStorage contains the referral code
3. Check network tab for API requests with referredBy field
4. Ensure backend is configured to handle referredBy parameter
