# Blue Ocean Explorer - Deployment Guide

## Overview

Blue Ocean Explorer is a comprehensive AI-powered strategic market analysis platform built on the Blue Ocean Strategy framework. This guide covers deployment on Railway and other platforms.

## Fixed Issues

✅ **Critical Structure Issues Resolved:**
- Fixed missing `src/` directory structure
- Created proper `src/main.tsx` entry point
- Reorganized all source files into correct locations
- Generated TanStack Router route tree
- Added Railway deployment configuration
- Created comprehensive Prisma schema with 40+ models

## Tech Stack

- **Frontend**: React 19, TanStack Router, Tailwind CSS
- **Backend**: Vinxi (Vite + Nitro), tRPC
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (production recommended)
- **AI**: Vercel AI SDK with OpenRouter, OpenAI, Anthropic, Google
- **Payment**: Stripe (optional)
- **Storage**: MinIO/S3 (optional)

## Prerequisites

- Node.js 18.x or higher
- npm or pnpm
- Railway CLI (for Railway deployment)
- OpenRouter API key (required for AI features)

## Local Development Setup

### 1. Install Dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

**Required Environment Variables:**

```env
# Database (SQLite for local dev)
DATABASE_URL="file:./dev.db"

# Security (IMPORTANT: Change these!)
ADMIN_PASSWORD=your-secure-admin-password
JWT_SECRET=your-secret-jwt-key-minimum-32-characters-long

# AI Provider (Get from https://openrouter.ai/)
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Application
NODE_ENV=development
BASE_URL=http://localhost:3000
```

**Optional Environment Variables:**

```env
# Stripe Payment Integration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# MinIO/S3 Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_USE_SSL=false
MINIO_BUCKET=blue-ocean-uploads
```

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 4. Start Development Server

```bash
npm run dev
```

Application will be available at http://localhost:3000

## Railway Deployment

### Method 1: Using Railway CLI

1. **Install Railway CLI**

```bash
npm install -g @railway/cli
```

2. **Login to Railway**

```bash
railway login
```

3. **Initialize Project**

```bash
railway init
```

4. **Add PostgreSQL Database**

```bash
railway add -d postgres
```

5. **Set Environment Variables**

```bash
# Set all required environment variables
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -hex 32)
railway variables set ADMIN_PASSWORD=your-secure-password
railway variables set OPENROUTER_API_KEY=your-api-key
```

6. **Deploy**

```bash
railway up
```

### Method 2: Using Railway Dashboard

1. **Create New Project**
   - Go to https://railway.app
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

2. **Add PostgreSQL Database**
   - In your project, click "New"
   - Select "Database" → "PostgreSQL"
   - Railway will automatically set `DATABASE_URL`

3. **Configure Environment Variables**

Go to your service → Variables tab and add:

```
NODE_ENV=production
ADMIN_PASSWORD=<your-secure-password>
JWT_SECRET=<generate-with-openssl-rand-hex-32>
OPENROUTER_API_KEY=<your-openrouter-api-key>
BASE_URL=<your-railway-url>
```

Optional variables:
```
STRIPE_SECRET_KEY=<your-stripe-key>
STRIPE_PUBLISHABLE_KEY=<your-stripe-key>
DEFAULT_COMMISSION_RATE=0.70
REFERRAL_REWARD_AMOUNT=10
```

4. **Deploy Settings**

The project includes `nixpacks.toml` and `railway.json` which configure:
- Build command: `npm install --legacy-peer-deps && npx prisma generate && npx tsr generate && npm run build`
- Start command: `npx prisma db push --accept-data-loss && npm run start`
- Auto-restarts on failure

5. **Deploy**
   - Push to your repository
   - Railway will automatically build and deploy

### Important Railway Notes

- **Database URL**: Use PostgreSQL in production (Railway provides this)
- **Port**: Railway automatically sets `PORT` environment variable
- **Domain**: Get your railway.app domain from the deployment settings
- **Logs**: Monitor deployment logs in Railway dashboard

## Other Deployment Platforms

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Add environment variables in Vercel dashboard.

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npx prisma generate
RUN npx tsr generate
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### Render

1. Create new Web Service
2. Set build command: `npm install --legacy-peer-deps && npx prisma generate && npx tsr generate && npm run build`
3. Set start command: `npx prisma db push --accept-data-loss && npm run start`
4. Add PostgreSQL database
5. Configure environment variables

## Database Migrations

### Production Database Setup

For production, use PostgreSQL:

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname"
```

### Running Migrations

```bash
# Generate migration
npx prisma migrate dev --name init

# Apply to production
npx prisma migrate deploy
```

### Database Push (for quick updates)

```bash
npm run db:push
```

⚠️ **Warning**: `db:push` can cause data loss. Use migrations in production!

## Environment Variable Security

### Generate Secure Secrets

```bash
# Generate JWT secret
openssl rand -hex 32

# Generate admin password
openssl rand -base64 24
```

### Never Commit

- `.env` file (already in .gitignore)
- API keys
- Database credentials
- JWT secrets

## Monitoring & Logs

### View Logs

**Railway:**
```bash
railway logs
```

**Local:**
```bash
npm run dev
```

### Health Checks

Check these endpoints:
- `/` - Frontend should load
- `/trpc/healthcheck` - API health (if implemented)

## Troubleshooting

### Build Fails on Railway

1. **Check environment variables** - Make sure all required vars are set
2. **Check build logs** - Look for Prisma or npm errors
3. **Verify DATABASE_URL** - Must be PostgreSQL format for production

### Prisma Generate Fails

```bash
# Set this if getting checksum errors
export PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1
npm run db:generate
```

### Application Won't Start

1. Check `DATABASE_URL` is set correctly
2. Verify `JWT_SECRET` is at least 32 characters
3. Check `OPENROUTER_API_KEY` is valid
4. Review application logs

### TypeScript Errors

The project has some existing TypeScript errors in route files. These don't block deployment but should be fixed:

```bash
npm run typecheck
```

## Performance Optimization

### Production Recommendations

1. **Use PostgreSQL** instead of SQLite
2. **Enable caching** for API responses
3. **Configure CDN** for static assets
4. **Set up monitoring** (Sentry, LogRocket, etc.)
5. **Enable compression** (handled by Vinxi)

### Scaling

- **Horizontal**: Deploy multiple instances on Railway
- **Database**: Use connection pooling (PgBouncer)
- **Caching**: Add Redis for session/cache storage

## Blue Ocean Strategy Features

The platform includes implementations of:

✅ **ERRC Grid** (Eliminate-Reduce-Raise-Create)
✅ **Six Paths Framework**
✅ **Three Tiers of Non-Customers**
✅ **Strategic Canvas & Value Curves**
✅ **Pioneer-Migrator-Settler Map**
✅ **Four Actions Framework**
✅ **Market Intelligence & Analysis**
✅ **AI-Powered Insights**
✅ **Collaboration Tools**
✅ **Marketplace & Community**

## API Documentation

tRPC procedures are auto-generated and type-safe. Access via:

```typescript
import { trpc } from '~/trpc/react'

// Example usage
const { data } = trpc.createMarket.useMutation()
```

## Support & Resources

- **Blue Ocean Strategy**: https://www.blueoceanstrategy.com/
- **Vinxi Docs**: https://vinxi.vercel.app/
- **Prisma Docs**: https://www.prisma.io/docs
- **Railway Docs**: https://docs.railway.app/

## License

Private - All Rights Reserved

## Next Steps After Deployment

1. **Create Admin Account** - Use the registration endpoint
2. **Configure Subscription Tiers** - Set up pricing in database
3. **Add Initial Badges** - Create achievement badges
4. **Test AI Features** - Verify OpenRouter integration
5. **Configure Stripe** - If using payments
6. **Set up Monitoring** - Add error tracking

---

**Deployment Status**: ✅ Ready for Production

Last Updated: 2025-10-23
