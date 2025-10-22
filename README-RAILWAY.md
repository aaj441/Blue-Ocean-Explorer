# 🚀 Railway Deployment Automation

This project includes comprehensive automation for deploying to Railway with zero manual configuration needed.

## 🎯 What This Fixes

- ✅ **Missing Procfile** - Automatically creates correct Procfile
- ✅ **Port binding issues** - Ensures proper port configuration
- ✅ **Missing environment variables** - Auto-generates .env.example with all required vars
- ✅ **Build configuration** - Creates railway.json with proper build settings
- ✅ **Deployment validation** - Runs type checks, linting, and builds before deploy

## 🚀 Quick Start

### Option 1: Automated Script (Recommended)
```bash
# Run the automated setup script
./scripts/railway-setup.sh
```

### Option 2: Manual Steps
```bash
# 1. Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh

# 2. Login to Railway
railway login

# 3. Initialize project
railway init

# 4. Set environment variables
node scripts/railway-env-setup.js

# 5. Deploy
railway up
```

## 📁 Generated Files

The automation creates these files:

- **`Procfile`** - Tells Railway how to start your app
- **`.env.example`** - Template with all required environment variables
- **`railway.json`** - Railway-specific build and deploy configuration
- **`.github/workflows/railway-autofix.yml`** - GitHub Actions workflow for auto-fixes

## 🔧 Environment Variables

The following environment variables are automatically configured:

### Required
- `NODE_ENV` - Application environment (production)
- `BASE_URL` - Your Railway app URL
- `ADMIN_PASSWORD` - Admin password for your app
- `JWT_SECRET` - Secret key for JWT tokens
- `OPENROUTER_API_KEY` - API key for AI services

### Optional
- `STRIPE_SECRET_KEY` - Stripe payment processing
- `STRIPE_PUBLISHABLE_KEY` - Stripe public key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook secret
- `DEFAULT_COMMISSION_RATE` - Default commission rate (0.70)
- `REFERRAL_REWARD_AMOUNT` - Referral reward amount (10)

## 🤖 GitHub Actions Integration

The included GitHub workflow automatically:

1. **Validates** all configuration files on every push
2. **Auto-corrects** missing or incorrect files
3. **Runs** type checking and linting
4. **Builds** the application to ensure it works
5. **Commits** any auto-generated files back to the repo

### Enable GitHub Actions

1. Push your code to GitHub
2. The workflow runs automatically on push to `main` branch
3. Check the Actions tab to see the automation in action

### Optional: Auto-Deploy

To enable automatic deployment to Railway:

1. Get your Railway token from [Railway Dashboard](https://railway.app/account/tokens)
2. Add it as a GitHub secret named `RAILWAY_TOKEN`
3. Uncomment the deploy job in `.github/workflows/railway-autofix.yml`

## 🛠️ Scripts Available

### `./scripts/railway-setup.sh`
Complete automation script that:
- Checks/installs Railway CLI
- Creates all necessary config files
- Validates package.json
- Builds the application
- Sets up Railway project
- Deploys to Railway

### `node scripts/railway-env-setup.js`
Environment variables setup script that:
- Parses .env.example
- Sets variables in Railway
- Skips placeholder values
- Provides detailed feedback

## 🔍 Troubleshooting

### Common Issues

**"Railway CLI not found"**
```bash
# Install Railway CLI
curl -fsSL https://railway.app/install.sh | sh
export PATH="$HOME/.railway/bin:$PATH"
```

**"Not logged in to Railway"**
```bash
railway login
```

**"Build failed"**
```bash
# Check your package.json has required scripts
pnpm typecheck
pnpm lint
pnpm build
```

**"Environment variables not set"**
```bash
# Check .env.example has real values (not placeholders)
# Then run:
node scripts/railway-env-setup.js
```

### Validation Commands

```bash
# Check if all config files exist
ls -la Procfile .env.example railway.json

# Validate package.json scripts
grep -E '"start"|"build"' package.json

# Test build locally
pnpm install && pnpm build
```

## 📊 Monitoring

After deployment:

1. **Railway Dashboard** - Monitor deployments and logs
2. **GitHub Actions** - Check automation status
3. **Application Logs** - Use `railway logs` for real-time logs

## 🎉 Success!

Once deployed, your app will be available at:
- **Railway URL**: `https://your-app.railway.app`
- **Health Check**: `https://your-app.railway.app/health` (if implemented)

## 🔄 Updates

The automation handles updates automatically:
- Push to `main` branch triggers validation
- Any missing configs are auto-corrected
- Build and deployment happen automatically (if enabled)

---

**Need help?** Check the [Railway Documentation](https://docs.railway.app/) or open an issue in this repository.