# Sports Dugout Firebase

A comprehensive sports contest platform with user authentication, live scores, and payment processing. Now deployed on Cloudflare Workers for better performance and global distribution.

## Features

- 🏆 Contest management with referral system
- 👤 User authentication and account management
- 🏈 Live sports scores and data (ESPN API)
- 💳 Payment processing with Stripe
- 📊 Real-time leaderboards and statistics
- 🔒 Secure JWT-based authentication
- 🌍 Global edge deployment with Cloudflare Workers

## Quick Start

### Installation

```bash
npm install
```

### Local Development

```bash
npm run dev
```

This starts the Cloudflare Workers development server at `http://localhost:8787`

### Deployment

```bash
# Deploy to production
npm run deploy:production

# Deploy to development
npm run deploy:development
```

## Documentation

- **[CLOUDFLARE-DEPLOYMENT.md](CLOUDFLARE-DEPLOYMENT.md)** - Complete deployment guide and migration instructions
- **[API-DOCUMENTATION.md](API-DOCUMENTATION.md)** - API reference with all endpoints
- **[USAGE-EXAMPLES.md](USAGE-EXAMPLES.md)** - Frontend integration examples
- **[IMPLEMENTATION-GUIDE.md](IMPLEMENTATION-GUIDE.md)** - Architecture and technical details
- **[FEATURE-SUMMARY.md](FEATURE-SUMMARY.md)** - Feature overview and summary

## Environment Variables

Set these in Cloudflare Workers dashboard or using `wrangler secret`:

```bash
JWT_SECRET=your-secure-secret-key
STRIPE_SECRET_KEY=sk_...
GOOGLE_APPLICATION_CREDENTIALS_JSON={...}
FIREBASE_PROJECT_ID=your-project-id
```

See [CLOUDFLARE-DEPLOYMENT.md](CLOUDFLARE-DEPLOYMENT.md) for detailed setup instructions.

## API Endpoints

- `GET /api` - Health check
- `POST /api/users?action=register` - User registration
- `POST /api/users?action=login` - User login
- `GET /api/sports?action=live_scores` - Live sports scores
- `GET /api/stats` - Contest statistics
- `GET /api/referral?code=ABC123` - Referral landing page
- And many more...

## Technology Stack

- **Runtime**: Cloudflare Workers
- **Authentication**: JWT + bcrypt
- **Database**: Firebase Firestore
- **Payment**: Stripe
- **Sports Data**: ESPN API
- **Language**: Node.js

## Migration from Vercel

This project has been migrated from Vercel to Cloudflare Workers. All API endpoints remain the same. See [CLOUDFLARE-DEPLOYMENT.md](CLOUDFLARE-DEPLOYMENT.md) for migration details.

## License

MIT