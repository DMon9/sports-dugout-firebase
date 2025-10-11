# GitHub Actions Workflows for Cloudflare Workers Deployment

This directory contains automated deployment workflows for Cloudflare Workers.

## Workflows

### 1. `deploy.yml` - Production Deployment
- **Triggers**: Push to `main` branch, or manual trigger
- **Deploys to**: Production environment (`sports-dugout-firebase`)
- **Environment**: `production` (defined in `wrangler.toml`)

### 2. `deploy-dev.yml` - Development Deployment
- **Triggers**: Push to `develop` or `dev` branch, or manual trigger
- **Deploys to**: Development environment (`sports-dugout-firebase-dev`)
- **Environment**: `development` (defined in `wrangler.toml`)

## Setup Instructions

### Prerequisites

1. A Cloudflare account with Workers enabled
2. A GitHub repository with this codebase

### Required GitHub Secrets

You need to add the following secrets to your GitHub repository:

1. **`CLOUDFLARE_API_TOKEN`**
   - Go to Cloudflare Dashboard → My Profile → API Tokens
   - Create a new token with "Edit Cloudflare Workers" permissions
   - Minimum required permissions:
     - Account Settings: Read
     - User Details: Read
     - Workers Scripts: Edit
     - Workers Routes: Edit
   - Copy the token value

2. **`CLOUDFLARE_ACCOUNT_ID`**
   - Go to Cloudflare Dashboard → Workers & Pages
   - Your Account ID is shown on the right sidebar
   - Copy the Account ID

### Adding Secrets to GitHub

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:
   - Name: `CLOUDFLARE_API_TOKEN`, Value: (your API token)
   - Name: `CLOUDFLARE_ACCOUNT_ID`, Value: (your account ID)

### Environment Secrets (Optional but Recommended)

For better security, also set your application secrets in Cloudflare Workers:

```bash
wrangler secret put JWT_SECRET --env production
wrangler secret put STRIPE_SECRET_KEY --env production
wrangler secret put FIREBASE_PROJECT_ID --env production
wrangler secret put GOOGLE_APPLICATION_CREDENTIALS_JSON --env production
```

For development:
```bash
wrangler secret put JWT_SECRET --env development
wrangler secret put STRIPE_SECRET_KEY --env development
wrangler secret put FIREBASE_PROJECT_ID --env development
wrangler secret put GOOGLE_APPLICATION_CREDENTIALS_JSON --env development
```

## Manual Deployment

You can also trigger deployments manually:

1. Go to **Actions** tab in GitHub
2. Select the workflow (`Deploy to Cloudflare Workers` or `Deploy to Cloudflare Workers (Development)`)
3. Click **Run workflow**
4. Select the branch and click **Run workflow**

## Troubleshooting

### Error: "wrangler.toml not found"

This error means the configuration file is missing or not in the repository root. The workflow includes a verification step that will show this error if it occurs.

**Solutions:**
1. Ensure `wrangler.toml` is in the repository root (not in a subdirectory)
2. Ensure `wrangler.toml` is not in `.gitignore`
3. Commit and push the file: `git add wrangler.toml && git commit -m "Add wrangler.toml" && git push`

### Error: "Authentication error"

Check that:
1. `CLOUDFLARE_API_TOKEN` is set correctly in GitHub secrets
2. `CLOUDFLARE_ACCOUNT_ID` is set correctly in GitHub secrets
3. The API token has the correct permissions

### Error: "Missing secrets"

Your worker might need environment variables. Set them using:
```bash
wrangler secret put SECRET_NAME --env production
```

Or in the Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker
3. Go to Settings → Variables
4. Add your secrets

## Viewing Deployment Logs

1. Go to **Actions** tab in GitHub
2. Click on the most recent workflow run
3. Click on the **Deploy** job to see detailed logs

## Local Testing Before Deployment

Always test locally before pushing:

```bash
# Install dependencies
npm install

# Test locally
npm run dev

# Run verification tests
npm run verify

# Dry run deployment
npx wrangler deploy --dry-run --env production
```

## Deployment URLs

After successful deployment:

- **Production**: `https://sports-dugout-firebase.your-subdomain.workers.dev`
- **Development**: `https://sports-dugout-firebase-dev.your-subdomain.workers.dev`

(Replace `your-subdomain` with your actual Cloudflare Workers subdomain)

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions for Wrangler](https://github.com/cloudflare/wrangler-action)
