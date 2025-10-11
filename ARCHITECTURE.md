# System Architecture

## Overview

This document provides a visual overview of the Sports Dugout system architecture with the new account creation and sports features.

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐ │
│  │ Landing    │  │ Dashboard  │  │ Profile    │  │ Sports    │ │
│  │ Page       │  │ (Contest)  │  │ Management │  │ Scores    │ │
│  └────────────┘  └────────────┘  └────────────┘  └───────────┘ │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                    HTTP Requests │
                                  │
┌─────────────────────────────────▼───────────────────────────────┐
│                    VERCEL SERVERLESS FUNCTIONS                   │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                  API LAYER (New + Existing)                 │ │
│  │                                                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │ │
│  │  │ /api/users   │  │ /api/sports  │  │ /api/index   │    │ │
│  │  │              │  │              │  │              │    │ │
│  │  │ • Register   │  │ • Scores     │  │ • Payments   │    │ │
│  │  │ • Login      │  │ • Schedules  │  │ • Stats      │    │ │
│  │  │ • Profile    │  │ • News       │  │ • Leaderboard│    │ │
│  │  │ • Logout     │  │ • Standings  │  │ • Referral   │    │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │ │
│  │         │                  │                  │            │ │
│  └─────────┼──────────────────┼──────────────────┼────────────┘ │
│            │                  │                  │              │
│  ┌─────────▼──────────────────▼──────────────────▼────────────┐ │
│  │              SHARED BUSINESS LOGIC MODULES                  │ │
│  │                                                             │ │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐          │ │
│  │  │ auth.js    │  │ database.js│  │ db-functions│          │ │
│  │  │            │  │            │  │    .js      │          │ │
│  │  │ • Register │  │ • CRUD     │  │ • Contest  │          │ │
│  │  │ • Login    │  │ • Queries  │  │   Logic    │          │ │
│  │  │ • JWT      │  │ • Firestore│  │ • Referral │          │ │
│  │  │ • Sessions │  │ • Users    │  │ • Stats    │          │ │
│  │  └────────────┘  └────────────┘  └────────────┘          │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────┬─────────────────┬────────────────────────┘
                        │                 │
        ┌───────────────▼────┐   ┌────────▼────────────┐
        │                    │   │                     │
┌───────▼────────┐  ┌────────▼──────────┐  ┌─────────▼────────┐
│   FIREBASE     │  │   STRIPE API      │  │   ESPN API       │
│   FIRESTORE    │  │                   │  │ (thesportsdb.com)│
│                │  │ • Payment Intent  │  │                  │
│ Collections:   │  │ • Webhooks        │  │ • Live Scores    │
│ • users        │  │ • Subscriptions   │  │ • Schedules      │
│ • sessions     │  │                   │  │ • News           │
│ • contest_     │  └───────────────────┘  │ • Standings      │
│   entries      │                         │                  │
└────────────────┘                         └──────────────────┘
```

## Authentication Flow

```
┌────────────┐                                    ┌──────────────┐
│   User     │                                    │   Server     │
└──────┬─────┘                                    └──────┬───────┘
       │                                                 │
       │ 1. POST /api/users?action=register              │
       │    { email, password, firstName, lastName }     │
       ├────────────────────────────────────────────────>│
       │                                                 │
       │                                    2. Hash password (bcrypt)
       │                                    3. Create user in Firestore
       │                                    4. Generate JWT token
       │                                    5. Create session
       │                                                 │
       │ 6. { token, userId, email, firstName }          │
       │<────────────────────────────────────────────────┤
       │                                                 │
       │ 7. Store token in localStorage/cookie           │
       │                                                 │
       │ 8. GET /api/users?action=profile                │
       │    Authorization: Bearer <token>                │
       ├────────────────────────────────────────────────>│
       │                                                 │
       │                                    9. Verify JWT
       │                                    10. Validate session
       │                                    11. Fetch user + entries
       │                                                 │
       │ 12. { profile, contestEntries }                 │
       │<────────────────────────────────────────────────┤
       │                                                 │
```

## Contest Entry Flow (Updated)

```
┌────────────┐                                    ┌──────────────┐
│   User     │                                    │   Server     │
└──────┬─────┘                                    └──────┬───────┘
       │                                                 │
       │ 1. POST /api (create payment intent)            │
       │    { amount, email, referredBy }                │
       ├────────────────────────────────────────────────>│
       │                                                 │
       │                                    2. Check if email exists
       │                                    3. Create Stripe payment
       │                                                 │
       │ 4. { client_secret, payment_intent_id }         │
       │<────────────────────────────────────────────────┤
       │                                                 │
       │ 5. Process payment with Stripe Elements         │
       │                                                 │
       │ 6. POST /api (confirm payment)                  │
       │    { confirm_payment, payment_intent_id }       │
       ├────────────────────────────────────────────────>│
       │                                                 │
       │                                    7. Create contest entry
       │                                    8. Link to userId (if logged in)
       │                                    9. Update referral count
       │                                                 │
       │ 10. { referralCode, referralLink }              │
       │<────────────────────────────────────────────────┤
       │                                                 │
```

## Sports Data Flow

```
┌────────────┐        ┌──────────────┐        ┌──────────────┐
│   User     │        │   Server     │        │  ESPN API    │
└──────┬─────┘        └──────┬───────┘        └──────┬───────┘
       │                     │                       │
       │ 1. GET /api/sports?action=live_scores       │
       ├────────────────────>│                       │
       │                     │                       │
       │                     │ 2. Request scores     │
       │                     ├──────────────────────>│
       │                     │                       │
       │                     │ 3. Game data (JSON)   │
       │                     │<──────────────────────┤
       │                     │                       │
       │                     │ 4. Transform & format │
       │                     │                       │
       │ 5. { games[] }      │                       │
       │<────────────────────┤                       │
       │                     │                       │
       │ (Auto-refresh every 30s)                    │
       │                     │                       │
```

## Database Schema Relationships

```
┌───────────────────┐
│      users        │
│ ─────────────────│
│ • id (PK)         │
│ • email           │
│ • password        │
│ • firstName       │
│ • lastName        │
│ • phone           │
│ • createdAt       │
│ • lastLogin       │
│ • status          │
└─────────┬─────────┘
          │
          │ 1:N
          │
┌─────────▼─────────┐         ┌───────────────────┐
│ contest_entries   │         │     sessions      │
│ ─────────────────│         │ ─────────────────│
│ • id (PK)         │         │ • id (PK)         │
│ • email           │         │ • userId (FK)     │◄──┐
│ • paymentIntentId │         │ • token           │   │
│ • amount          │         │ • createdAt       │   │ 1:N
│ • referralCode    │         │ • expiresAt       │   │
│ • referredBy      │         │ • status          │   │
│ • userId (FK) ────┼─────────┴───────────────────┘   │
│ • referrals       │                                 │
│ • status          │                                 │
│ • created         │─────────────────────────────────┘
│ • linkedAt        │
└───────────────────┘
```

## Module Dependencies

```
┌──────────────────────────────────────────────────────────────┐
│                         api/users.js                          │
│                    (User API Endpoints)                       │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           │ requires
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                         api/auth.js                           │
│                  (Authentication Functions)                   │
│                                                               │
│  Exports:                                                     │
│  • registerUser()                                             │
│  • loginUser()                                                │
│  • verifyToken()                                              │
│  • getUserProfile()                                           │
│  • updateUserProfile()                                        │
│  • logoutUser()                                               │
│  • linkContestEntryToUser()                                   │
└──────────────┬─────────────────────┬────────────────────────┘
               │                     │
               │ uses                │ uses
               │                     │
┌──────────────▼──────────┐  ┌──────▼───────────────────────┐
│   firebase-admin        │  │  External Libraries          │
│                         │  │                              │
│  • Firestore           │  │  • jsonwebtoken (JWT)        │
│  • Authentication      │  │  • bcryptjs (Password hash)  │
└─────────────────────────┘  └──────────────────────────────┘


┌──────────────────────────────────────────────────────────────┐
│                        api/sports.js                          │
│                   (Sports Data Endpoints)                     │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           │ uses
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                          axios                                │
│                    (HTTP Client)                              │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           │ calls
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                    ESPN Public API                            │
│                                                               │
│  Endpoints:                                                   │
│  • /sports/{sport}/{league}/scoreboard                       │
│  • /sports/{sport}/{league}/news                             │
│  • /sports/{sport}/{league}/standings                        │
└───────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────┐
│                        api/index.js                           │
│                    (Main API Handler)                         │
│                    [EXISTING - Not Modified]                  │
└──────────────────────────┬───────────────────────────────────┘
                           │
                           │ uses
                           │
┌──────────────────────────▼───────────────────────────────────┐
│                      api/database.js                          │
│                  (Database Functions)                         │
│                  [MODIFIED - Added userId]                    │
│                                                               │
│  Functions:                                                   │
│  • addContestEntry() ← Updated to support userId             │
│  • getContestStats()                                          │
│  • getLeaderboard()                                           │
│  • isEmailAlreadyEntered()                                    │
│  • incrementReferralCount()                                   │
│  • findEntryByReferralCode()                                  │
└───────────────────────────────────────────────────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT SIDE                              │
│  • Input validation                                             │
│  • HTTPS (enforced by Vercel)                                   │
│  • Token storage (localStorage/httpOnly cookies)                │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      API GATEWAY (Vercel)                        │
│  • CORS headers                                                 │
│  • Rate limiting (Vercel default)                               │
│  • DDoS protection                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     AUTHENTICATION LAYER                         │
│  • JWT verification (jsonwebtoken)                              │
│  • Session validation (Firestore)                               │
│  • Token expiration check (7 days)                              │
│  • Bearer token format validation                               │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     APPLICATION LAYER                            │
│  • Input sanitization                                           │
│  • Business logic validation                                    │
│  • Authorization checks (user owns resource)                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                       DATA LAYER                                 │
│  • Password hashing (bcrypt, 10 rounds)                         │
│  • Firebase security rules                                      │
│  • SQL injection prevention (parameterized queries)             │
│  • Data encryption at rest (Firebase default)                   │
└──────────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          GITHUB                                  │
│                  (Source Code Repository)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Git Push
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     VERCEL (Hosting)                             │
│                                                                  │
│  Automatic:                                                      │
│  • Build on push                                                │
│  • Deploy serverless functions                                  │
│  • SSL certificate                                              │
│  • CDN distribution                                             │
│                                                                  │
│  Routes:                                                         │
│  • /api/users    → users.js  (serverless function)             │
│  • /api/sports   → sports.js (serverless function)             │
│  • /api          → index.js  (serverless function)             │
│  • /            → Static files                                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
                  ┌──────────┴──────────┐
                  │                     │
       ┌──────────▼──────────┐  ┌──────▼───────────┐
       │  FIREBASE FIRESTORE │  │   EXTERNAL APIs  │
       │                     │  │                  │
       │  • Production DB    │  │  • ESPN API      │
       │  • Automatic backup │  │  • Stripe API    │
       │  • Scaling          │  └──────────────────┘
       └─────────────────────┘
```

## Data Flow: Complete User Journey

```
1. USER REGISTRATION
   User → Frontend → POST /api/users?action=register
   → auth.js → Firestore (users) → JWT token
   → Frontend stores token

2. USER LOGIN
   User → Frontend → POST /api/users?action=login
   → auth.js → Verify password → JWT token
   → Create session → Frontend stores token

3. VIEW PROFILE
   User → Frontend → GET /api/users?action=profile
   → Verify JWT → Get user data → Get contest entries
   → Return combined data → Display in UI

4. ENTER CONTEST
   User → Frontend → POST /api (payment intent)
   → Stripe → Payment → POST /api (confirm)
   → database.js → Create entry with userId
   → Update referrals → Return referral code

5. VIEW LIVE SCORES
   User → Frontend → GET /api/sports?action=live_scores
   → ESPN API → Transform data → Return games
   → Display in UI → Auto-refresh every 30s

6. LOGOUT
   User → Frontend → POST /api/users?action=logout
   → Verify JWT → Invalidate session
   → Frontend clears token → Redirect to login
```

## Scalability Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                      CURRENT ARCHITECTURE                        │
│                      (Good for 0-10K users)                      │
│                                                                  │
│  • Vercel serverless functions (auto-scaling)                   │
│  • Firebase Firestore (managed, auto-scaling)                   │
│  • ESPN API (free tier, rate limited)                           │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                     SCALING TO 10K-100K USERS                    │
│                                                                  │
│  Add:                                                            │
│  • Redis cache for JWT verification                             │
│  • Redis cache for ESPN API responses (30s-1hr TTL)             │
│  • CDN for static assets                                        │
│  • Connection pooling for database                              │
└──────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    SCALING TO 100K+ USERS                        │
│                                                                  │
│  Add:                                                            │
│  • Load balancer                                                │
│  • Multiple region deployment                                   │
│  • Database read replicas                                       │
│  • Message queue for async tasks                                │
│  • Premium sports APIs with higher limits                       │
│  • WebSocket server for real-time updates                       │
└──────────────────────────────────────────────────────────────────┘
```

## Technology Stack

```
Frontend (Not Implemented - Your Choice)
├── HTML/CSS/JavaScript (vanilla)
├── React.js
├── Vue.js
└── Angular

Backend (Implemented)
├── Node.js
├── Vercel Serverless Functions
└── Express.js concepts

Authentication
├── jsonwebtoken (JWT)
├── bcryptjs (password hashing)
└── Firebase Admin SDK

Database
└── Firebase Firestore
    ├── users collection
    ├── sessions collection
    └── contest_entries collection

External APIs
├── ESPN API (sports data)
├── TheSportsDB API (backup)
└── Stripe API (payments - existing)

Development
├── Git/GitHub
├── Node.js 18+
└── npm
```

## Summary

This architecture provides:

1. **Scalability** - Serverless functions scale automatically
2. **Security** - Multiple layers of protection
3. **Maintainability** - Clear separation of concerns
4. **Extensibility** - Easy to add new features
5. **Performance** - Fast API responses with caching strategy
6. **Reliability** - Managed services with high uptime
7. **Cost-Effective** - Pay only for what you use

All components work together to provide a complete user account system with sports data integration.
