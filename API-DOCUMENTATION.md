# Sports Dugout API Documentation

## Overview
This document describes the account creation system and sports features APIs for the Sports Dugout platform.

## Table of Contents
1. [User Management API](#user-management-api)
2. [Sports Data API](#sports-data-api)
3. [Authentication](#authentication)
4. [Database Schema](#database-schema)
5. [Environment Variables](#environment-variables)

---

## User Management API

Base URL: `/api/users`

### 1. Register User

Create a new user account.

**Endpoint:** `POST /api/users?action=register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Validation:**
- Email is required and must be valid
- Password is required and must be at least 6 characters
- First name, last name, and phone are optional

### 2. Login User

Authenticate and get access token.

**Endpoint:** `POST /api/users?action=login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": "abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Get User Profile

Get authenticated user's profile and contest entries.

**Endpoint:** `GET /api/users?action=profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "userId": "abc123",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "createdAt": "2024-01-01T00:00:00Z",
    "lastLogin": "2024-01-15T12:00:00Z",
    "contestEntries": [
      {
        "id": "entry123",
        "email": "user@example.com",
        "amount": 1000,
        "referralCode": "TSDABC123",
        "referrals": 5,
        "status": "active",
        "created": "2024-01-10T00:00:00Z"
      }
    ]
  }
}
```

### 4. Update User Profile

Update user profile information.

**Endpoint:** `PUT /api/users?action=profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+1987654321"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "userId": "abc123",
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Smith",
    "phone": "+1987654321",
    "contestEntries": [...]
  }
}
```

### 5. Logout User

Invalidate user session.

**Endpoint:** `POST /api/users?action=logout`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 6. Link Contest Entry

Link an existing contest entry to user account.

**Endpoint:** `POST /api/users?action=link_entry`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "entryId": "entry123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contest entry linked successfully"
}
```

---

## Sports Data API

Base URL: `/api/sports`

All sports endpoints support the following query parameters:
- `sport`: football, basketball, baseball, hockey (default: football)
- `league`: nfl, nba, mlb, nhl, college-football (default: nfl)

### 1. Live Scores

Get real-time game scores.

**Endpoint:** `GET /api/sports?action=live_scores&sport=football&league=nfl`

**Response:**
```json
{
  "success": true,
  "data": {
    "league": "NFL",
    "sport": "football",
    "games": [
      {
        "id": "401547415",
        "name": "Kansas City Chiefs vs Buffalo Bills",
        "date": "2024-01-15T18:00:00Z",
        "status": "Live - 2nd Quarter",
        "homeTeam": {
          "name": "Kansas City Chiefs",
          "abbreviation": "KC",
          "score": "14",
          "logo": "https://a.espncdn.com/i/teamlogos/nfl/500/kc.png"
        },
        "awayTeam": {
          "name": "Buffalo Bills",
          "abbreviation": "BUF",
          "score": "10",
          "logo": "https://a.espncdn.com/i/teamlogos/nfl/500/buf.png"
        },
        "venue": "Arrowhead Stadium",
        "broadcast": "CBS"
      }
    ],
    "lastUpdated": "2024-01-15T19:30:00Z"
  },
  "source": "ESPN API"
}
```

### 2. Game Schedules

Get upcoming game schedules.

**Endpoint:** `GET /api/sports?action=schedules&sport=football&league=nfl&date=20240115`

**Query Parameters:**
- `date`: YYYYMMDD format (optional, defaults to today)

**Response:**
```json
{
  "success": true,
  "data": {
    "league": "NFL",
    "sport": "football",
    "date": "20240115",
    "schedule": [
      {
        "id": "401547415",
        "name": "Kansas City Chiefs vs Buffalo Bills",
        "shortName": "KC vs BUF",
        "date": "2024-01-15T18:00:00Z",
        "time": "6:00 PM",
        "status": "Scheduled",
        "homeTeam": "Kansas City Chiefs",
        "awayTeam": "Buffalo Bills",
        "venue": "Arrowhead Stadium",
        "broadcast": "CBS"
      }
    ],
    "lastUpdated": "2024-01-15T12:00:00Z"
  },
  "source": "ESPN API"
}
```

### 3. Betting Lines

Get betting lines for games (mock data).

**Endpoint:** `GET /api/sports?action=betting_lines&game_id=401547415`

**Query Parameters:**
- `game_id`: Specific game ID (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "notice": "Betting lines require premium API access",
    "games": [
      {
        "gameId": "401547415",
        "matchup": "Kansas City Chiefs vs Buffalo Bills",
        "spread": {
          "home": "-3.5",
          "away": "+3.5",
          "odds": "-110"
        },
        "moneyline": {
          "home": "-165",
          "away": "+145"
        },
        "total": {
          "over": "47.5 (-110)",
          "under": "47.5 (-110)"
        }
      }
    ],
    "disclaimer": "For entertainment purposes only. Please gamble responsibly.",
    "lastUpdated": "2024-01-15T12:00:00Z"
  },
  "source": "mock"
}
```

### 4. Sports News

Get latest sports news articles.

**Endpoint:** `GET /api/sports?action=news&sport=football&league=nfl`

**Response:**
```json
{
  "success": true,
  "data": {
    "league": "NFL",
    "sport": "football",
    "articles": [
      {
        "id": "12345",
        "headline": "Chiefs advance to Championship Game",
        "description": "Kansas City defeats Buffalo in thriller",
        "published": "2024-01-15T20:00:00Z",
        "images": "https://example.com/image.jpg",
        "link": "https://www.espn.com/article/12345"
      }
    ],
    "lastUpdated": "2024-01-15T20:30:00Z"
  },
  "source": "ESPN API"
}
```

### 5. Team Standings

Get current team standings.

**Endpoint:** `GET /api/sports?action=standings&sport=football&league=nfl`

**Response:**
```json
{
  "success": true,
  "data": {
    "league": "NFL",
    "sport": "football",
    "standings": [
      {
        "name": "AFC East",
        "teams": [
          {
            "team": "Buffalo Bills",
            "stats": {
              "wins": "13",
              "losses": "4",
              "winPercent": ".765"
            }
          }
        ]
      }
    ],
    "lastUpdated": "2024-01-15T12:00:00Z"
  },
  "source": "ESPN API"
}
```

---

## Authentication

### JWT Token

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Token Lifecycle

- **Expiration:** 7 days from creation
- **Storage:** Stored in `sessions` collection with active/inactive status
- **Renewal:** Login again to get a new token
- **Invalidation:** Call logout endpoint to invalidate session

### Security Best Practices

1. Store tokens securely (use httpOnly cookies or secure storage)
2. Always use HTTPS in production
3. Set strong `JWT_SECRET` environment variable
4. Implement token refresh mechanism for better UX
5. Password requirements: minimum 6 characters (enhance as needed)

---

## Database Schema

### Users Collection

```javascript
{
  email: string,              // User email (lowercase)
  password: string,           // Bcrypt hashed password
  firstName: string,          // User first name
  lastName: string,           // User last name
  phone: string,             // User phone number
  createdAt: timestamp,       // Account creation time
  lastLogin: timestamp,       // Last login time
  updatedAt: timestamp,       // Last profile update
  status: string             // 'active' or 'inactive'
}
```

### Sessions Collection

```javascript
{
  userId: string,            // Reference to user ID
  token: string,             // JWT token
  createdAt: timestamp,      // Session creation time
  expiresAt: timestamp,      // Session expiration time
  loggedOutAt: timestamp,    // Logout time (if logged out)
  status: string            // 'active' or 'inactive'
}
```

### Contest Entries Collection (Updated)

```javascript
{
  email: string,
  paymentIntentId: string,
  amount: number,
  referralCode: string,
  referredBy: string,
  userId: string,            // NEW: Reference to user account
  referrals: number,
  status: string,
  created: timestamp,
  lastUpdated: timestamp,
  linkedAt: timestamp        // NEW: When linked to user account
}
```

---

## Environment Variables

### Required Variables

```bash
# Firebase Configuration
GOOGLE_APPLICATION_CREDENTIALS_JSON='{...}'  # Firebase service account JSON
FIREBASE_PROJECT_ID=your-project-id

# JWT Configuration
JWT_SECRET=your-very-secure-secret-key-change-in-production

# Stripe Configuration (existing)
STRIPE_SECRET_KEY=sk_test_...
```

### Optional Variables

```bash
# JWT Token Expiration (default: 7d)
JWT_EXPIRES_IN=7d

# API Configuration
NODE_ENV=production
```

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "error": "Error message here",
  "message": "Detailed error description"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created (e.g., new user registered)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `500` - Internal Server Error

---

## Rate Limiting

Consider implementing rate limiting for:
- Login attempts: 5 per minute per IP
- Registration: 3 per hour per IP
- API calls: 100 per minute per user

---

## Testing

### Example cURL Commands

**Register User:**
```bash
curl -X POST http://localhost:3000/api/users?action=register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/users?action=login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Get Profile:**
```bash
curl -X GET http://localhost:3000/api/users?action=profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Get Live Scores:**
```bash
curl -X GET "http://localhost:3000/api/sports?action=live_scores&sport=football&league=nfl"
```

---

## Migration Guide

### Linking Existing Contest Entries to Users

To link existing contest entries to user accounts:

1. User registers/logs in to get their account
2. User provides their contest entry email
3. Call link_entry endpoint with the entry ID
4. Entry is associated with user account

Example workflow:
```javascript
// 1. User logs in
const loginResponse = await fetch('/api/users?action=login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
const { token } = await loginResponse.json();

// 2. Find user's contest entry (by email match)
// This would be done server-side for security

// 3. Link the entry
await fetch('/api/users?action=link_entry', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ entryId: 'entry123' })
});
```

---

## Future Enhancements

1. **OAuth Integration**: Add Google, Facebook login
2. **Password Reset**: Email-based password recovery
3. **Email Verification**: Verify email addresses
4. **Two-Factor Authentication**: Enhanced security
5. **Premium Sports Data**: Integrate paid APIs for betting lines
6. **Real-time Updates**: WebSocket for live score updates
7. **User Preferences**: Save favorite teams, sports
8. **Notifications**: Email/push notifications for games
9. **Social Features**: Share contest entries, compete with friends
10. **Analytics Dashboard**: Track user engagement and sports data usage
