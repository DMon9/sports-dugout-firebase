# Quick Start Guide: Account Creation & Sports Features

Get started with the new user authentication and sports data features in just a few steps!

## 🚀 Getting Started in 5 Minutes

### Step 1: Set Environment Variables

Add this to your Vercel environment variables:

```bash
JWT_SECRET=your-super-secret-key-change-this-in-production
```

Your existing variables should already be set:
- `GOOGLE_APPLICATION_CREDENTIALS_JSON`
- `FIREBASE_PROJECT_ID`
- `STRIPE_SECRET_KEY`

### Step 2: Deploy to Vercel

The code is already in the correct location. Just push to GitHub:

```bash
git push origin main
```

Vercel will automatically deploy:
- `/api/users` - User management endpoints
- `/api/sports` - Sports data endpoints

### Step 3: Test the Endpoints

**Test User Registration:**
```bash
curl -X POST https://your-app.vercel.app/api/users?action=register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","firstName":"Test"}'
```

**Test Live Scores:**
```bash
curl "https://your-app.vercel.app/api/sports?action=live_scores&sport=football&league=nfl"
```

### Step 4: Integrate with Frontend

**Add User Registration:**
```html
<form id="signupForm">
  <input type="email" name="email" placeholder="Email" required>
  <input type="password" name="password" placeholder="Password" required>
  <button type="submit">Sign Up</button>
</form>

<script>
document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  
  const response = await fetch('/api/users?action=register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: formData.get('email'),
      password: formData.get('password')
    })
  });
  
  const result = await response.json();
  if (result.success) {
    localStorage.setItem('authToken', result.data.token);
    alert('Registration successful!');
  }
});
</script>
```

**Add Live Scores:**
```html
<div id="scores"></div>

<script>
async function loadScores() {
  const response = await fetch('/api/sports?action=live_scores&sport=football&league=nfl');
  const result = await response.json();
  
  const scoresHtml = result.data.games.map(game => `
    <div class="game">
      ${game.awayTeam.abbreviation} ${game.awayTeam.score} @ 
      ${game.homeTeam.abbreviation} ${game.homeTeam.score}
      <span>${game.status}</span>
    </div>
  `).join('');
  
  document.getElementById('scores').innerHTML = scoresHtml;
}

loadScores();
setInterval(loadScores, 30000); // Refresh every 30 seconds
</script>
```

---

## 📖 API Quick Reference

### User Authentication

**Register:**
```javascript
POST /api/users?action=register
Body: { email, password, firstName, lastName }
Returns: { success, data: { token, userId } }
```

**Login:**
```javascript
POST /api/users?action=login
Body: { email, password }
Returns: { success, data: { token, userId } }
```

**Get Profile:**
```javascript
GET /api/users?action=profile
Headers: { Authorization: "Bearer TOKEN" }
Returns: { success, data: { profile, contestEntries } }
```

### Sports Data

**Live Scores:**
```javascript
GET /api/sports?action=live_scores&sport=football&league=nfl
Returns: { success, data: { games: [...] } }
```

**Game Schedules:**
```javascript
GET /api/sports?action=schedules&sport=football&league=nfl&date=20241011
Returns: { success, data: { schedule: [...] } }
```

**Sports News:**
```javascript
GET /api/sports?action=news&sport=football&league=nfl
Returns: { success, data: { articles: [...] } }
```

---

## 🎯 Common Use Cases

### Use Case 1: User Signs Up and Enters Contest

```javascript
// 1. User registers
const registerResponse = await fetch('/api/users?action=register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'securePass123',
    firstName: 'John',
    lastName: 'Doe'
  })
});
const { data: { token, userId } } = await registerResponse.json();
localStorage.setItem('authToken', token);

// 2. User enters contest (existing payment flow)
const paymentResponse = await fetch('/api', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    amount: 1000,
    email: 'user@example.com'
  })
});
const { client_secret } = await paymentResponse.json();

// 3. Complete payment with Stripe (existing flow)
// ... Stripe Elements payment confirmation ...

// 4. Contest entry is automatically linked to user via email match!
```

### Use Case 2: Show Live Scores on Dashboard

```javascript
async function updateDashboard() {
  // Get user profile
  const token = localStorage.getItem('authToken');
  const profileRes = await fetch('/api/users?action=profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const profile = await profileRes.json();
  
  // Get live scores
  const scoresRes = await fetch('/api/sports?action=live_scores&sport=football&league=nfl');
  const scores = await scoresRes.json();
  
  // Display both
  displayUserInfo(profile.data);
  displayLiveScores(scores.data.games);
}

updateDashboard();
```

### Use Case 3: Protected Route

```javascript
// Middleware to check authentication
async function requireAuth() {
  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = '/login';
    return false;
  }
  
  // Verify token is valid
  const response = await fetch('/api/users?action=profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) {
    localStorage.removeItem('authToken');
    window.location.href = '/login';
    return false;
  }
  
  return true;
}

// Use in your app
if (await requireAuth()) {
  loadDashboard();
}
```

---

## 🔧 Troubleshooting

### "JWT_SECRET not defined"
**Solution:** Add JWT_SECRET to your environment variables in Vercel dashboard

### "User already exists"
**Solution:** Use the login endpoint instead of register

### "Authorization token missing"
**Solution:** Include `Authorization: Bearer YOUR_TOKEN` header in requests

### "Sports API returns fallback data"
**Solution:** ESPN API may be rate limited. This is normal, real data will resume shortly

### "Token expired"
**Solution:** User needs to login again. Tokens last 7 days by default

---

## 📊 Supported Sports & Leagues

| Sport | League | Code |
|-------|--------|------|
| Football | NFL | `sport=football&league=nfl` |
| Football | College | `sport=football&league=college-football` |
| Basketball | NBA | `sport=basketball&league=nba` |
| Baseball | MLB | `sport=baseball&league=mlb` |
| Hockey | NHL | `sport=hockey&league=nhl` |

---

## 🎨 Frontend Examples

### React Component

```jsx
import React, { useState } from 'react';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await fetch('/api/users?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const result = await response.json();
    if (result.success) {
      localStorage.setItem('authToken', result.data.token);
      window.location.href = '/dashboard';
    } else {
      alert(result.error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="email" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
    </form>
  );
}

export default LoginForm;
```

### Vue.js Component

```vue
<template>
  <div class="live-scores">
    <h2>Live Scores</h2>
    <div v-for="game in games" :key="game.id" class="game">
      <div class="teams">
        <span>{{ game.awayTeam.abbreviation }} {{ game.awayTeam.score }}</span>
        <span>@</span>
        <span>{{ game.homeTeam.abbreviation }} {{ game.homeTeam.score }}</span>
      </div>
      <div class="status">{{ game.status }}</div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      games: []
    };
  },
  mounted() {
    this.loadScores();
    setInterval(this.loadScores, 30000);
  },
  methods: {
    async loadScores() {
      const response = await fetch('/api/sports?action=live_scores&sport=football&league=nfl');
      const result = await response.json();
      if (result.success) {
        this.games = result.data.games;
      }
    }
  }
};
</script>
```

---

## 📚 Next Steps

1. **Read the full documentation:**
   - `API-DOCUMENTATION.md` - Complete API reference
   - `USAGE-EXAMPLES.md` - More examples
   - `IMPLEMENTATION-GUIDE.md` - Architecture details

2. **Customize for your needs:**
   - Add password strength requirements
   - Customize JWT expiration time
   - Add email verification
   - Implement password reset

3. **Enhance the UI:**
   - Add loading states
   - Add error handling
   - Style the components
   - Add animations

4. **Monitor and optimize:**
   - Track user registrations
   - Monitor API response times
   - Set up error logging
   - Implement caching

---

## 🎉 You're Ready!

You now have:
- ✅ Complete user authentication
- ✅ Profile management
- ✅ Live sports scores
- ✅ Game schedules
- ✅ Sports news
- ✅ Team standings
- ✅ Full documentation

Start building your frontend and integrate these features!

For questions or issues, check the documentation files or the implementation guide.

**Happy coding! 🚀**
