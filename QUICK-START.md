# Quick Start Guide - Referral Link Feature

## 🚀 What's New?

Your frontend now supports referral links! Users can share links and both parties get credit when someone signs up.

## 📝 How It Works

### 1. Share Referral Link
Users share links like:
```
https://thesportsdugout.com/?ref=TSD123ABC
```

### 2. New User Clicks Link
- Banner appears: "🎉 You were referred by TSD123ABC!"
- Code is stored automatically
- User can dismiss banner or proceed to signup

### 3. User Makes Deposit
- Referral code is included in payment
- Backend receives `referredBy: "TSD123ABC"`
- Both users get credited

### 4. Code Cleared
- After successful payment, code is removed
- Ready for next transaction

## 🔗 URL Parameters

### `?ref=CODE`
Tracks the referral code
```
https://thesportsdugout.com/?ref=TSD123ABC
```

### `?signup=true`
Auto-opens signup modal after 1 second
```
https://thesportsdugout.com/?ref=TSD123ABC&signup=true
```

## 🧪 Test It Now

### Quick Test Steps:
1. Open browser to: `https://thesportsdugout.com/?ref=TESTCODE123`
2. Look for banner at top of page
3. Open browser console (F12)
4. Run: `localStorage.getItem('referralCode')`
5. Should see: `"TESTCODE123"`

### Full Payment Test:
1. Visit: `https://thesportsdugout.com/?ref=MYCODE&signup=true`
2. Wait for signup modal to auto-open
3. Enter test email and password
4. Use test card: `4242 4242 4242 4242`
5. Complete payment
6. Check console for: `💳 Creating payment intent with referral: MYCODE`
7. After success, check: `localStorage.getItem('referralCode')` should be `null`

## 💻 Console Commands

```javascript
// Check current referral code
localStorage.getItem('referralCode')

// Set a test referral code
localStorage.setItem('referralCode', 'TESTCODE')

// Clear referral code
localStorage.removeItem('referralCode')

// View all localStorage data
console.log(localStorage)
```

## 🎨 Banner Styling

The referral banner appears at the top with:
- **Colors:** Blue-to-purple gradient
- **Position:** Fixed at top (z-index: 50)
- **Dismissible:** Click ✕ to close
- **Message:** "🎉 You were referred by CODE! Both of you get credit when you join!"

## 📊 Backend Integration

Your backend now receives `referredBy` in these API calls:

### Payment Intent Creation
```json
POST /api
{
  "amount": 1000,
  "currency": "usd",
  "email": "user@example.com",
  "referredBy": "TSD123ABC"
}
```

### Payment Confirmation
```json
POST /api
{
  "confirm_payment": true,
  "payment_intent_id": "pi_xxx",
  "email": "user@example.com",
  "amount": 1000,
  "referredBy": "TSD123ABC"
}
```

## ✅ What's Working

- ✅ URL parameter detection
- ✅ localStorage persistence
- ✅ Visual banner display
- ✅ Auto-signup feature
- ✅ Payment integration
- ✅ Automatic cleanup

## 📚 More Information

- **Full Testing Guide:** See `REFERRAL-TESTING-GUIDE.md`
- **Detailed Changes:** See `CHANGES-SUMMARY.md`
- **Code Location:** `public/index.html`

## 🆘 Troubleshooting

### Banner not showing?
- Check URL has `?ref=CODE` parameter
- Check browser console for: `🔗 Referral code detected: CODE`

### Code not in payment?
- Check console log: `💳 Creating payment intent with referral: CODE`
- Check network tab: Look for `referredBy` in request body

### Code not clearing?
- Should clear automatically after successful payment
- Check console: `localStorage.removeItem('referralCode')`
- Manually clear: `localStorage.clear()`

## 🎉 You're Ready!

The referral system is fully implemented and ready to use. Share your referral links and start tracking conversions!

For detailed testing instructions, see `REFERRAL-TESTING-GUIDE.md`.
