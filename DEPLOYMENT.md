# Deployment Guide

This guide covers deploying the Blue Ocean Explorer to Railway and Vercel.

## Prerequisites

1. **Database**: You'll need a PostgreSQL database. Both Railway and Vercel offer database services.
2. **Environment Variables**: Set up all required environment variables.

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL`: PostgreSQL connection string
- `ADMIN_PASSWORD`: Admin password for the application
- `JWT_SECRET`: Secret key for JWT tokens
- `OPENROUTER_API_KEY`: API key for OpenRouter AI services

Optional variables:
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`: For payment processing
- `DEFAULT_COMMISSION_RATE`, `REFERRAL_REWARD_AMOUNT`: Commission settings

## Railway Deployment

1. **Connect Repository**:
   - Go to [Railway](https://railway.app)
   - Connect your GitHub repository

2. **Add Database**:
   - Add a PostgreSQL service
   - Copy the `DATABASE_URL` from the database service

3. **Set Environment Variables**:
   - Go to your project settings
   - Add all required environment variables
   - Set `NODE_ENV=production`

4. **Deploy**:
   - Railway will automatically detect the `railway.json` and `nixpacks.toml` configuration
   - The app will build and deploy automatically

## Vercel Deployment

1. **Connect Repository**:
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository

2. **Configure Build Settings**:
   - Framework Preset: Other
   - Build Command: `pnpm build`
   - Output Directory: `.vinxi/output`
   - Install Command: `pnpm install`

3. **Add Database**:
   - Add a PostgreSQL database (Vercel Postgres or external)
   - Copy the `DATABASE_URL`

4. **Set Environment Variables**:
   - Go to Project Settings > Environment Variables
   - Add all required environment variables
   - Set `NODE_ENV=production`

5. **Deploy**:
   - Vercel will use the `vercel.json` configuration
   - The app will build and deploy automatically

## Database Setup

After deployment, run database migrations:

```bash
# For Railway
railway run pnpm db:migrate

# For Vercel (using Vercel CLI)
vercel env pull .env.local
pnpm db:migrate
```

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Ensure all environment variables are set
   - Check that `DATABASE_URL` is accessible
   - Verify Node.js version compatibility

2. **Database Connection Issues**:
   - Verify `DATABASE_URL` format
   - Check database service is running
   - Ensure database allows connections from deployment platform

3. **Environment Variable Issues**:
   - Ensure all required variables are set
   - Check variable names match exactly
   - Verify no typos in variable values

### Platform-Specific Notes

**Railway**:
- Uses `nixpacks.toml` for build configuration
- Supports Dockerfile deployment
- Automatic database provisioning available

**Vercel**:
- Uses `vercel.json` for configuration
- Serverless functions have execution time limits
- Consider using Vercel Postgres for optimal performance

## Local Development

To run locally:

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your values

# Set up database
pnpm db:push

# Start development server
pnpm dev
```

## Support

If you encounter issues:
1. Check the deployment logs
2. Verify environment variables
3. Test database connectivity
4. Review the troubleshooting section above