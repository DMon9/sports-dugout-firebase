# Cloudflare Workers Deployment Guide

This guide covers the migration from Vercel to Cloudflare Workers for the Sports Dugout application.

## Why Cloudflare Workers?

- **Better Performance**: Edge computing with lower latency
- **Global Distribution**: Deployed to 300+ data centers worldwide
- **Cost Effective**: More generous free tier and better pricing
- **Node.js Compatibility**: Full support for existing npm packages
- **Easy Scaling**: Automatic scaling with no configuration

## Prerequisites

1. **Cloudflare Account**: Sign up at https://dash.cloudflare.com/sign-up
2. **Wrangler CLI**: Already installed as a dev dependency
3. **Node.js**: Version 16 or higher

## Installation

Dependencies are already installed in `package.json`:

```bash
npm install
```

## Configuration

### 1. Wrangler Configuration

The `wrangler.toml` file is already configured with:
- Application name: `sports-dugout-firebase`
- Node.js compatibility enabled
- Development and production environments

### 2. Environment Variables

Set up your secrets using Wrangler CLI:

```bash
# JWT Secret (required)
wrangler secret put JWT_SECRET

# Stripe Secret Key (required)
wrangler secret put STRIPE_SECRET_KEY

# Firebase Credentials (required)
wrangler secret put GOOGLE_APPLICATION_CREDENTIALS_JSON
wrangler secret put FIREBASE_PROJECT_ID

# Optional
wrangler secret put JWT_EXPIRES_IN
```

Alternatively, use the Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Go to Settings > Variables
4. Add environment variables and secrets

### 3. Secrets Management

**Important**: Never commit secrets to your repository!

For development, you can create a `.dev.vars` file (already in .gitignore):

```bash
# .dev.vars
JWT_SECRET=your-dev-secret
STRIPE_SECRET_KEY=sk_test_...
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account",...}
```

## Deployment

### Local Development

Test your worker locally:

```bash
npm run dev
```

This starts a local server at `http://localhost:8787`

### Manual Deployment

#### Deploy to Development Environment

```bash
npm run deploy:development
```

This deploys to: `sports-dugout-firebase-dev.your-subdomain.workers.dev`

#### Deploy to Production

```bash
npm run deploy:production
```

This deploys to: `sports-dugout-firebase.your-subdomain.workers.dev`

#### Quick Deploy (uses default config)

```bash
npm run deploy
```

### Automated Deployment (CI/CD)

**New!** GitHub Actions workflows are now included for automated deployments.

#### Setup

1. **Add GitHub Secrets** (required for automated deployment):
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `CLOUDFLARE_API_TOKEN` - Create from Cloudflare Dashboard → My Profile → API Tokens
     - `CLOUDFLARE_ACCOUNT_ID` - Found in Workers & Pages dashboard

2. **Workflows**:
   - **Production**: Automatically deploys when pushing to `main` branch
   - **Development**: Automatically deploys when pushing to `develop` or `dev` branch
   - Both can also be triggered manually from the Actions tab

For detailed setup instructions, see [`.github/workflows/README.md`](.github/workflows/README.md)

#### Verifying wrangler.toml

The workflows include a verification step that ensures `wrangler.toml` exists before deployment. If you see "wrangler.toml not found" errors:

1. Ensure the file is in the repository root
2. Ensure it's committed to git: `git add wrangler.toml && git commit -m "Add wrangler config"`
3. Check that it's not in `.gitignore`

## Custom Domain Setup

### Option 1: Using Cloudflare Dashboard

1. Go to Workers & Pages
2. Select your worker
3. Click "Custom Domains"
4. Add your domain (e.g., `api.thesportsdugout.com`)

### Option 2: Using Wrangler

Add to `wrangler.toml`:

```toml
routes = [
  { pattern = "api.thesportsdugout.com/*", zone_name = "thesportsdugout.com" }
]
```

Then deploy:

```bash
npm run deploy
```

## API Endpoints

All existing API endpoints remain the same:

- `GET /api` - Health check
- `GET /api?action=stats` - Contest statistics
- `GET /api?action=leaderboard` - Top referrers
- `POST /api/users?action=register` - User registration
- `POST /api/users?action=login` - User login
- `GET /api/users?action=profile` - User profile
- `GET /api/sports?action=live_scores` - Live sports scores
- `GET /api/referral?code=ABC123` - Referral landing page
- And more...

## Testing

### Automated Verification

Use the included verification script to test all endpoints:

```bash
# Test local development
npm run verify

# Test deployed worker (replace with your URL)
npm run verify https://sports-dugout-firebase.your-subdomain.workers.dev
```

The script will test:
- Health check endpoint
- Stats endpoint
- Sports API
- CORS headers
- Response validation

### Manual Testing

#### Test Health Endpoint

```bash
curl https://sports-dugout-firebase.your-subdomain.workers.dev/api
```

#### Test with Authentication

```bash
curl -X POST https://sports-dugout-firebase.your-subdomain.workers.dev/api/users?action=login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

## Monitoring

### View Logs

```bash
wrangler tail
```

Or in the Cloudflare Dashboard:
1. Workers & Pages
2. Select your worker
3. Click "Logs" tab

### Analytics

Access analytics in the Cloudflare Dashboard:
- Request volume
- Success rate
- Response time
- Errors

## Troubleshooting

### wrangler.toml Not Found

This is a common error during deployment. **Solutions**:

1. **Verify file exists**:
   ```bash
   ls -la wrangler.toml
   ```

2. **Check if file is tracked by git**:
   ```bash
   git ls-files | grep wrangler.toml
   ```
   If not listed, add it:
   ```bash
   git add wrangler.toml
   git commit -m "Add wrangler.toml configuration"
   git push
   ```

3. **Ensure correct working directory**:
   - The file must be in the repository root
   - If using CI/CD, ensure the workflow runs from the root directory
   - Check that deployment commands run from where `wrangler.toml` exists

4. **Using Cloudflare Pages instead of Workers?**:
   - This project is designed for **Cloudflare Workers**, not Pages
   - If you created a Pages project, create a new Workers project instead
   - Workers projects use `wrangler.toml`, Pages use different configuration

5. **GitHub Actions troubleshooting**:
   - Check the workflow logs in the Actions tab
   - The "Verify wrangler.toml exists" step will show if the file is missing
   - Ensure `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets are set

### Module Resolution Issues

If you encounter `Cannot find module` errors:
- Ensure `compatibility_flags = ["nodejs_compat"]` is set in `wrangler.toml`
- Check that all dependencies are in `package.json`
- Try clearing the wrangler cache: `wrangler dev --force`

### Environment Variables Not Working

- Verify secrets are set: `wrangler secret list`
- For local dev, ensure `.dev.vars` file exists
- Check variable names match exactly (case-sensitive)

### Deployment Fails

```bash
# Check for syntax errors
npm run cf-typegen

# Clear cache and retry
rm -rf node_modules/.cache
npm run deploy
```

### CORS Issues

All handlers already include CORS headers:
```javascript
'Access-Control-Allow-Origin': '*'
'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
'Access-Control-Allow-Headers': 'Content-Type, Authorization'
```

## Migration from Vercel

### What Changed

1. **Deployment Platform**: Vercel → Cloudflare Workers
2. **Configuration**: `vercel.json` → `wrangler.toml`
3. **CLI Tool**: `vercel` → `wrangler`
4. **Entry Point**: Automatic routing → `src/index.js` with explicit routing

### What Stayed the Same

1. **API Endpoints**: All URLs remain identical
2. **Code Logic**: Business logic unchanged
3. **Environment Variables**: Same names and purposes
4. **Dependencies**: All npm packages still work

### Migration Checklist

- [x] Install Cloudflare Workers dependencies
- [x] Create `wrangler.toml` configuration
- [x] Create worker entry point and routing
- [x] Adapt API handlers for Workers
- [x] Update documentation
- [ ] Set environment variables in Cloudflare
- [ ] Test locally with `npm run dev`
- [ ] Deploy to development environment
- [ ] Test all endpoints
- [ ] Deploy to production
- [ ] Update DNS/domain settings (if needed)
- [ ] Remove Vercel deployment (optional)

## Performance Optimization

### Caching

Cloudflare Workers can cache responses:

```javascript
return new Response(body, {
  headers: {
    'Cache-Control': 'public, max-age=300',
    'Content-Type': 'application/json'
  }
});
```

### KV Storage (Optional)

For better performance, consider using Cloudflare KV for caching:

```toml
# Add to wrangler.toml
[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"
```

## Cost Comparison

### Vercel (Hobby Plan)
- 100GB bandwidth/month
- Serverless function execution limits

### Cloudflare Workers (Free Tier)
- 100,000 requests/day
- First 10ms of CPU time free
- Unlimited bandwidth

### Cloudflare Workers (Paid - $5/month)
- 10 million requests/month
- No CPU time limits for first 50ms

## Support

- **Cloudflare Docs**: https://developers.cloudflare.com/workers/
- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler/
- **Community**: https://discord.gg/cloudflaredev

## Next Steps

1. Set up environment variables
2. Test locally with `npm run dev`
3. Deploy to development
4. Test all endpoints thoroughly
5. Deploy to production
6. Update your frontend to use new URLs (if domain changed)
7. Monitor performance and errors
