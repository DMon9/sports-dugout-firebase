# Fix: wrangler.toml Not Found in Cloudflare Deployment

## Problem

When deploying to Cloudflare Workers, you may encounter the error:
```
Error: wrangler.toml not found
```

This prevents successful deployment of the application.

## Root Causes

This error can occur due to several reasons:

1. **Wrong deployment type**: Using Cloudflare Pages instead of Cloudflare Workers
2. **Missing CI/CD configuration**: No GitHub Actions workflow for automated deployment
3. **Working directory issue**: Deployment commands running from wrong directory
4. **File not in git**: The `wrangler.toml` file not committed to the repository
5. **File in .gitignore**: The configuration file being ignored by git

## Solution

This fix includes several improvements to prevent this error:

### 1. GitHub Actions Workflows (New!)

Added automated deployment workflows:

- **`.github/workflows/deploy.yml`** - Production deployment (triggers on push to `main`)
- **`.github/workflows/deploy-dev.yml`** - Development deployment (triggers on push to `develop`/`dev`)

Both workflows include:
- Automatic verification that `wrangler.toml` exists before deployment
- Clear error messages if the file is missing
- Support for manual triggering from GitHub Actions UI

### 2. Setup Verification Script (New!)

Added `verify-setup.js` script that checks:
- All required files exist
- `wrangler.toml` has correct configuration
- File is not in `.gitignore`
- Package.json scripts are configured
- Wrangler is installed

Run it with:
```bash
npm run verify:setup
```

### 3. Enhanced Documentation

Updated documentation with:
- CI/CD setup instructions in [`.github/workflows/README.md`](.github/workflows/README.md)
- Troubleshooting section in [`CLOUDFLARE-DEPLOYMENT.md`](CLOUDFLARE-DEPLOYMENT.md)
- Clear explanation of Workers vs Pages deployment

## How to Use

### For Manual Deployment

1. Verify setup is correct:
   ```bash
   npm run verify:setup
   ```

2. Ensure you're in the repository root:
   ```bash
   ls -la wrangler.toml  # Should show the file
   ```

3. Deploy:
   ```bash
   npm run deploy:production
   # or
   npm run deploy:development
   ```

### For Automated CI/CD Deployment

1. **Add GitHub Secrets** (one-time setup):
   - Go to repository Settings → Secrets and variables → Actions
   - Add `CLOUDFLARE_API_TOKEN` (from Cloudflare Dashboard → My Profile → API Tokens)
   - Add `CLOUDFLARE_ACCOUNT_ID` (from Cloudflare Dashboard → Workers & Pages)

2. **Trigger deployment**:
   - **Automatic**: Push to `main` (production) or `develop`/`dev` (development)
   - **Manual**: Go to Actions tab → Select workflow → Run workflow

3. **Monitor deployment**:
   - Go to Actions tab
   - Click on the running workflow
   - View logs to see deployment progress

## Verification

After setup, verify everything is working:

```bash
# 1. Check configuration
npm run verify:setup

# 2. Test local development
npm run dev

# 3. In another terminal, test endpoints
npm run verify

# 4. Deploy to development (if secrets are set)
npm run deploy:development
```

## Common Issues and Fixes

### Issue: "wrangler.toml not found" during GitHub Actions

**Fix**: 
1. Ensure file is committed: `git add wrangler.toml && git commit -m "Add wrangler config"`
2. Push to GitHub: `git push`
3. Check workflow logs to verify file is present

### Issue: "Authentication error" in GitHub Actions

**Fix**:
1. Verify `CLOUDFLARE_API_TOKEN` is set in GitHub secrets
2. Verify `CLOUDFLARE_ACCOUNT_ID` is set in GitHub secrets
3. Check API token has correct permissions (Edit Cloudflare Workers)

### Issue: Using Cloudflare Pages instead of Workers

**Fix**:
1. This project requires **Cloudflare Workers**, not Pages
2. If you have a Pages project:
   - Delete it or leave it inactive
   - Use `wrangler deploy` commands or GitHub Actions workflows
   - Workers deployment uses `wrangler.toml` configuration

### Issue: File in wrong directory

**Fix**:
1. Ensure `wrangler.toml` is in repository root (not in subdirectory)
2. Run commands from repository root
3. Check with: `git ls-files | grep wrangler.toml`

## What Changed

### New Files
- `.github/workflows/deploy.yml` - Production deployment workflow
- `.github/workflows/deploy-dev.yml` - Development deployment workflow
- `.github/workflows/README.md` - CI/CD setup documentation
- `verify-setup.js` - Repository setup verification script
- `DEPLOYMENT-FIX.md` - This file

### Modified Files
- `CLOUDFLARE-DEPLOYMENT.md` - Added CI/CD section and enhanced troubleshooting
- `README.md` - Added setup verification instructions
- `package.json` - Added `verify:setup` script

### No Changes Required
- `wrangler.toml` - Already exists and correctly configured
- `.gitignore` - Already correctly excludes only `.wrangler/` directory
- All API files - No changes needed

## Benefits

1. **Automated Deployment**: Push code and it deploys automatically
2. **Early Error Detection**: Verifies configuration before deployment
3. **Better Documentation**: Clear setup instructions and troubleshooting
4. **Consistent Deployments**: Same process for all developers
5. **Fail-Fast**: Catches configuration errors immediately

## Support

If you continue to have issues:

1. Run `npm run verify:setup` and fix any reported issues
2. Check [CLOUDFLARE-DEPLOYMENT.md](CLOUDFLARE-DEPLOYMENT.md) troubleshooting section
3. Review [.github/workflows/README.md](.github/workflows/README.md) for CI/CD setup
4. Check GitHub Actions logs for specific error messages
5. Verify you're using Cloudflare Workers (not Pages)

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions for Wrangler](https://github.com/cloudflare/wrangler-action)
- [Repository Documentation](README.md)
