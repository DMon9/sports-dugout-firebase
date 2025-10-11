# Usage Examples

This document provides practical examples of how to use the new account creation and sports features APIs.

## Table of Contents
1. [User Authentication Flow](#user-authentication-flow)
2. [Sports Data Integration](#sports-data-integration)
3. [Complete User Journey](#complete-user-journey)
4. [Frontend Integration Examples](#frontend-integration-examples)

---

## User Authentication Flow

### 1. Register a New User

```javascript
// Frontend JavaScript example
async function registerUser(email, password, firstName, lastName) {
  try {
    const response = await fetch('/api/users?action=register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Store the token securely
      localStorage.setItem('authToken', result.data.token);
      localStorage.setItem('userId', result.data.userId);
      
      console.log('User registered:', result.data.email);
      return result.data;
    } else {
      console.error('Registration failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Error during registration:', error);
    return null;
  }
}

// Usage
registerUser('john@example.com', 'securePass123', 'John', 'Doe')
  .then(user => {
    if (user) {
      console.log('Welcome,', user.firstName);
      // Redirect to dashboard
      window.location.href = '/dashboard';
    }
  });
```

### 2. Login Existing User

```javascript
async function loginUser(email, password) {
  try {
    const response = await fetch('/api/users?action=login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Store the token
      localStorage.setItem('authToken', result.data.token);
      localStorage.setItem('userId', result.data.userId);
      localStorage.setItem('userEmail', result.data.email);
      
      return result.data;
    } else {
      alert(result.error);
      return null;
    }
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

// Usage
loginUser('john@example.com', 'securePass123')
  .then(user => {
    if (user) {
      console.log('Logged in as:', user.email);
    }
  });
```

### 3. Get User Profile

```javascript
async function getUserProfile() {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    console.error('No auth token found');
    return null;
  }
  
  try {
    const response = await fetch('/api/users?action=profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      return result.data;
    } else {
      console.error('Failed to get profile:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Error getting profile:', error);
    return null;
  }
}

// Usage
getUserProfile().then(profile => {
  if (profile) {
    console.log('User Profile:', profile);
    console.log('Contest Entries:', profile.contestEntries);
    
    // Display in UI
    document.getElementById('userName').textContent = 
      `${profile.firstName} ${profile.lastName}`;
    document.getElementById('userEmail').textContent = profile.email;
    document.getElementById('contestCount').textContent = 
      profile.contestEntries.length;
  }
});
```

### 4. Update User Profile

```javascript
async function updateProfile(firstName, lastName, phone) {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch('/api/users?action=profile', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: firstName,
        lastName: lastName,
        phone: phone
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('Profile updated successfully');
      return result.data;
    } else {
      console.error('Update failed:', result.error);
      return null;
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    return null;
  }
}

// Usage
updateProfile('Jane', 'Smith', '+1234567890')
  .then(profile => {
    if (profile) {
      alert('Profile updated successfully!');
    }
  });
```

### 5. Logout User

```javascript
async function logoutUser() {
  const token = localStorage.getItem('authToken');
  
  try {
    const response = await fetch('/api/users?action=logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Clear local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      
      console.log('Logged out successfully');
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Usage
document.getElementById('logoutBtn').addEventListener('click', logoutUser);
```

---

## Sports Data Integration

### 1. Get Live Scores

```javascript
async function getLiveScores(sport = 'football', league = 'nfl') {
  try {
    const response = await fetch(
      `/api/sports?action=live_scores&sport=${sport}&league=${league}`
    );
    
    const result = await response.json();
    
    if (result.success) {
      displayLiveScores(result.data.games);
      return result.data.games;
    }
  } catch (error) {
    console.error('Error fetching live scores:', error);
  }
}

function displayLiveScores(games) {
  const container = document.getElementById('liveScores');
  container.innerHTML = '';
  
  games.forEach(game => {
    const gameCard = `
      <div class="game-card">
        <div class="game-status">${game.status}</div>
        <div class="teams">
          <div class="team away">
            <img src="${game.awayTeam.logo}" alt="${game.awayTeam.name}">
            <span class="team-name">${game.awayTeam.abbreviation}</span>
            <span class="score">${game.awayTeam.score}</span>
          </div>
          <div class="vs">@</div>
          <div class="team home">
            <img src="${game.homeTeam.logo}" alt="${game.homeTeam.name}">
            <span class="team-name">${game.homeTeam.abbreviation}</span>
            <span class="score">${game.homeTeam.score}</span>
          </div>
        </div>
        <div class="game-info">
          <span class="venue">${game.venue}</span>
          <span class="broadcast">${game.broadcast}</span>
        </div>
      </div>
    `;
    container.innerHTML += gameCard;
  });
}

// Usage: Auto-refresh every 30 seconds
getLiveScores('football', 'nfl');
setInterval(() => getLiveScores('football', 'nfl'), 30000);
```

### 2. Get Game Schedule

```javascript
async function getGameSchedule(sport = 'football', league = 'nfl', date = null) {
  // Format date as YYYYMMDD
  const scheduleDate = date || new Date().toISOString().split('T')[0].replace(/-/g, '');
  
  try {
    const response = await fetch(
      `/api/sports?action=schedules&sport=${sport}&league=${league}&date=${scheduleDate}`
    );
    
    const result = await response.json();
    
    if (result.success) {
      displaySchedule(result.data.schedule);
      return result.data.schedule;
    }
  } catch (error) {
    console.error('Error fetching schedule:', error);
  }
}

function displaySchedule(schedule) {
  const container = document.getElementById('schedule');
  container.innerHTML = '<h2>Game Schedule</h2>';
  
  schedule.forEach(game => {
    const gameItem = `
      <div class="schedule-item">
        <div class="matchup">${game.name}</div>
        <div class="game-time">${game.time}</div>
        <div class="venue">${game.venue}</div>
        <div class="broadcast">${game.broadcast}</div>
      </div>
    `;
    container.innerHTML += gameItem;
  });
}

// Usage
getGameSchedule('football', 'nfl');
```

### 3. Get Sports News

```javascript
async function getSportsNews(sport = 'football', league = 'nfl') {
  try {
    const response = await fetch(
      `/api/sports?action=news&sport=${sport}&league=${league}`
    );
    
    const result = await response.json();
    
    if (result.success) {
      displayNews(result.data.articles);
      return result.data.articles;
    }
  } catch (error) {
    console.error('Error fetching news:', error);
  }
}

function displayNews(articles) {
  const container = document.getElementById('newsContainer');
  container.innerHTML = '<h2>Latest News</h2>';
  
  articles.forEach(article => {
    const newsCard = `
      <div class="news-card">
        ${article.images ? `<img src="${article.images}" alt="${article.headline}">` : ''}
        <h3>${article.headline}</h3>
        <p>${article.description}</p>
        <div class="news-meta">
          <span class="date">${new Date(article.published).toLocaleDateString()}</span>
          ${article.link ? `<a href="${article.link}" target="_blank">Read More</a>` : ''}
        </div>
      </div>
    `;
    container.innerHTML += newsCard;
  });
}

// Usage
getSportsNews('football', 'nfl');
```

### 4. Get Betting Lines

```javascript
async function getBettingLines(gameId = null) {
  try {
    const url = gameId 
      ? `/api/sports?action=betting_lines&game_id=${gameId}`
      : '/api/sports?action=betting_lines';
    
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success) {
      displayBettingLines(result.data.games);
      return result.data.games;
    }
  } catch (error) {
    console.error('Error fetching betting lines:', error);
  }
}

function displayBettingLines(games) {
  const container = document.getElementById('bettingLines');
  container.innerHTML = '<h2>Betting Lines</h2>';
  
  games.forEach(game => {
    const betCard = `
      <div class="betting-card">
        <h3>${game.matchup}</h3>
        <div class="betting-row">
          <span class="bet-type">Spread:</span>
          <span>${game.spread.home} / ${game.spread.away}</span>
        </div>
        <div class="betting-row">
          <span class="bet-type">Moneyline:</span>
          <span>${game.moneyline.home} / ${game.moneyline.away}</span>
        </div>
        <div class="betting-row">
          <span class="bet-type">Total:</span>
          <span>O/U ${game.total.over}</span>
        </div>
      </div>
    `;
    container.innerHTML += betCard;
  });
}

// Usage
getBettingLines();
```

### 5. Get Team Standings

```javascript
async function getStandings(sport = 'football', league = 'nfl') {
  try {
    const response = await fetch(
      `/api/sports?action=standings&sport=${sport}&league=${league}`
    );
    
    const result = await response.json();
    
    if (result.success) {
      displayStandings(result.data.standings);
      return result.data.standings;
    }
  } catch (error) {
    console.error('Error fetching standings:', error);
  }
}

function displayStandings(standings) {
  const container = document.getElementById('standings');
  container.innerHTML = '<h2>Standings</h2>';
  
  standings.forEach(division => {
    let divisionHtml = `<h3>${division.name}</h3><table class="standings-table">`;
    divisionHtml += `
      <thead>
        <tr>
          <th>Team</th>
          <th>W</th>
          <th>L</th>
          <th>Win %</th>
        </tr>
      </thead>
      <tbody>
    `;
    
    division.teams.forEach(team => {
      divisionHtml += `
        <tr>
          <td>${team.team}</td>
          <td>${team.stats.wins || '-'}</td>
          <td>${team.stats.losses || '-'}</td>
          <td>${team.stats.winPercent || '-'}</td>
        </tr>
      `;
    });
    
    divisionHtml += '</tbody></table>';
    container.innerHTML += divisionHtml;
  });
}

// Usage
getStandings('football', 'nfl');
```

---

## Complete User Journey

### Example: New User Enters Contest and Uses Sports Features

```javascript
// Complete workflow example
class SportsContestApp {
  constructor() {
    this.token = localStorage.getItem('authToken');
  }
  
  // Step 1: User registers
  async register(email, password, firstName, lastName) {
    const response = await fetch('/api/users?action=register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName, lastName })
    });
    
    const result = await response.json();
    if (result.success) {
      this.token = result.data.token;
      localStorage.setItem('authToken', this.token);
      return result.data;
    }
    throw new Error(result.error);
  }
  
  // Step 2: User enters contest (uses existing payment flow)
  async enterContest(amount, email, referredBy = null) {
    const response = await fetch('/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amount,
        email: email,
        referredBy: referredBy
      })
    });
    
    const result = await response.json();
    return result;
  }
  
  // Step 3: Link contest entry to user account
  async linkContestEntry(entryId) {
    const response = await fetch('/api/users?action=link_entry', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ entryId })
    });
    
    return await response.json();
  }
  
  // Step 4: View user dashboard with sports data
  async loadDashboard() {
    // Get user profile
    const profile = await this.getUserProfile();
    
    // Get live scores
    const liveScores = await this.getLiveScores();
    
    // Get sports news
    const news = await this.getSportsNews();
    
    return {
      profile,
      liveScores,
      news
    };
  }
  
  async getUserProfile() {
    const response = await fetch('/api/users?action=profile', {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    const result = await response.json();
    return result.data;
  }
  
  async getLiveScores(sport = 'football', league = 'nfl') {
    const response = await fetch(
      `/api/sports?action=live_scores&sport=${sport}&league=${league}`
    );
    const result = await response.json();
    return result.data.games;
  }
  
  async getSportsNews(sport = 'football', league = 'nfl') {
    const response = await fetch(
      `/api/sports?action=news&sport=${sport}&league=${league}`
    );
    const result = await response.json();
    return result.data.articles;
  }
}

// Usage
const app = new SportsContestApp();

// Complete flow
async function completeUserFlow() {
  try {
    // 1. Register
    const user = await app.register(
      'john@example.com',
      'securePass123',
      'John',
      'Doe'
    );
    console.log('Registered:', user.email);
    
    // 2. Enter contest (would integrate with existing payment flow)
    // const entry = await app.enterContest(1000, user.email);
    
    // 3. Link entry (after payment confirmation)
    // await app.linkContestEntry(entry.id);
    
    // 4. Load dashboard
    const dashboard = await app.loadDashboard();
    console.log('Dashboard loaded:', dashboard);
    
    // Display everything
    displayUserDashboard(dashboard);
    
  } catch (error) {
    console.error('Error in user flow:', error);
  }
}

function displayUserDashboard(dashboard) {
  // Display user info
  document.getElementById('userName').textContent = 
    `${dashboard.profile.firstName} ${dashboard.profile.lastName}`;
  
  // Display contest entries
  const entriesHtml = dashboard.profile.contestEntries.map(entry => `
    <div class="entry-card">
      <div>Entry: ${entry.referralCode}</div>
      <div>Referrals: ${entry.referrals}</div>
      <div>Status: ${entry.status}</div>
    </div>
  `).join('');
  document.getElementById('contestEntries').innerHTML = entriesHtml;
  
  // Display live scores
  displayLiveScores(dashboard.liveScores);
  
  // Display news
  displayNews(dashboard.news);
}
```

---

## Frontend Integration Examples

### React Component Example

```jsx
import React, { useState, useEffect } from 'react';

function SportsScoreboard() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchLiveScores();
    const interval = setInterval(fetchLiveScores, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);
  
  const fetchLiveScores = async () => {
    try {
      const response = await fetch(
        '/api/sports?action=live_scores&sport=football&league=nfl'
      );
      const result = await response.json();
      if (result.success) {
        setGames(result.data.games);
      }
    } catch (error) {
      console.error('Error fetching scores:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div className="scoreboard">
      <h2>Live Scores</h2>
      {games.map(game => (
        <div key={game.id} className="game-card">
          <div className="status">{game.status}</div>
          <div className="teams">
            <div className="team">
              <img src={game.awayTeam.logo} alt={game.awayTeam.name} />
              <span>{game.awayTeam.abbreviation}</span>
              <span className="score">{game.awayTeam.score}</span>
            </div>
            <span>@</span>
            <div className="team">
              <img src={game.homeTeam.logo} alt={game.homeTeam.name} />
              <span>{game.homeTeam.abbreviation}</span>
              <span className="score">{game.homeTeam.score}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SportsScoreboard;
```

### Vue.js Component Example

```vue
<template>
  <div class="user-profile">
    <h2>User Profile</h2>
    <div v-if="loading">Loading...</div>
    <div v-else-if="profile">
      <div class="profile-info">
        <p>Name: {{ profile.firstName }} {{ profile.lastName }}</p>
        <p>Email: {{ profile.email }}</p>
        <p>Member Since: {{ formatDate(profile.createdAt) }}</p>
      </div>
      
      <h3>Contest Entries</h3>
      <div class="entries">
        <div 
          v-for="entry in profile.contestEntries" 
          :key="entry.id"
          class="entry-card"
        >
          <p>Code: {{ entry.referralCode }}</p>
          <p>Referrals: {{ entry.referrals }}</p>
          <p>Status: {{ entry.status }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserProfile',
  data() {
    return {
      profile: null,
      loading: true
    };
  },
  mounted() {
    this.fetchProfile();
  },
  methods: {
    async fetchProfile() {
      const token = localStorage.getItem('authToken');
      try {
        const response = await fetch('/api/users?action=profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const result = await response.json();
        if (result.success) {
          this.profile = result.data;
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        this.loading = false;
      }
    },
    formatDate(timestamp) {
      return new Date(timestamp).toLocaleDateString();
    }
  }
};
</script>
```

---

## Security Best Practices

1. **Always use HTTPS in production**
2. **Store tokens securely** (httpOnly cookies preferred over localStorage)
3. **Implement CSRF protection**
4. **Validate input on both client and server**
5. **Set strong password requirements**
6. **Implement rate limiting**
7. **Use environment variables for secrets**
8. **Regularly rotate JWT secrets**
9. **Implement token refresh mechanism**
10. **Log authentication attempts**

---

## Troubleshooting

### Common Issues

1. **401 Unauthorized Error**
   - Check if token is expired
   - Verify token is included in Authorization header
   - Ensure token format is: `Bearer <token>`

2. **CORS Errors**
   - Verify CORS headers are set correctly
   - Check if frontend and backend are on same domain

3. **Sports API Returns Fallback Data**
   - ESPN API may be rate limited
   - Check network connectivity
   - Verify API endpoint URLs are correct

4. **User Cannot Link Contest Entry**
   - Verify user is authenticated
   - Check if entry ID exists
   - Ensure entry isn't already linked to another user

---

## Next Steps

1. Integrate these examples into your frontend
2. Add error handling and user feedback
3. Implement token refresh mechanism
4. Add loading states and animations
5. Test with real user data
6. Monitor API usage and performance
7. Implement analytics tracking
