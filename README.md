# Blue Ocean Explorer 🌊

An AI-powered strategic market analysis platform built on the Blue Ocean Strategy framework by W. Chan Kim and Renée Mauborgne.

## Features

🎯 **Blue Ocean Strategy Frameworks**
- ERRC Grid (Eliminate-Reduce-Raise-Create)
- Six Paths Framework
- Three Tiers of Non-Customers Analysis
- Strategic Canvas & Value Curves
- Pioneer-Migrator-Settler Mapping
- Four Actions Framework

📊 **Market Intelligence**
- Market & competitive analysis
- Trend intersection analysis
- Value migration tracking
- Opportunity scoring & prioritization
- Dynamic segment generation

🤖 **AI-Powered Insights**
- Multi-model AI support (OpenRouter, OpenAI, Anthropic, Google)
- Automated market reports
- Strategic recommendations
- Partnership suggestions
- Pitch deck generation

🤝 **Collaboration & Community**
- Strategy boards & collections
- AI strategy sessions
- Community challenges
- Marketplace for strategies
- Achievement system

## Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Setup database
npm run db:push

# Start development server
npm run dev
```

Visit http://localhost:3000

## Required Environment Variables

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET=your-secret-key-here
ADMIN_PASSWORD=your-admin-password
OPENROUTER_API_KEY=your-openrouter-api-key
```

## Tech Stack

- **Frontend**: React 19, TanStack Router, Tailwind CSS
- **Backend**: Vinxi, tRPC, Nitro
- **Database**: Prisma (SQLite/PostgreSQL)
- **AI**: Vercel AI SDK
- **Payments**: Stripe (optional)

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions for Railway, Vercel, Docker, and other platforms.

### Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new)

```bash
# Using Railway CLI
railway login
railway init
railway add -d postgres
railway variables set OPENROUTER_API_KEY=your-key
railway variables set JWT_SECRET=$(openssl rand -hex 32)
railway up
```

## Project Structure

```
Blue-Ocean-Explorer/
├── src/
│   ├── routes/           # React Router pages
│   ├── server/           # tRPC procedures & backend logic
│   ├── components/       # Reusable UI components
│   ├── stores/           # Zustand state management
│   ├── trpc/             # tRPC client setup
│   ├── utils/            # Utility functions
│   ├── main.tsx          # Application entry point
│   └── styles.css        # Global styles
├── prisma/
│   └── schema.prisma     # Database schema
├── app.config.ts         # Vinxi configuration
├── nixpacks.toml         # Railway build config
└── railway.json          # Railway deployment config
```

## Database Schema

The platform includes 40+ models covering:
- User management & authentication
- Markets, segments, competitors
- Opportunities & scenarios
- Blue Ocean Strategy frameworks
- Subscriptions & billing
- Marketplace & community
- AI-generated reports & analytics

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run typecheck    # Run TypeScript checks
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio
npm run format       # Format code with Prettier
```

## Contributing

This is a private project. All rights reserved.

## Blue Ocean Strategy Methodology

This platform implements the key principles of Blue Ocean Strategy:

1. **Value Innovation**: Simultaneous pursuit of differentiation and low cost
2. **Reconstruct Market Boundaries**: Use Six Paths Framework
3. **Reach Beyond Existing Demand**: Target three tiers of non-customers
4. **Get the Strategic Sequence Right**: Validate buyer utility, price, cost, adoption
5. **Overcome Key Organizational Hurdles**: Enable execution of blue ocean moves
6. **Build Execution into Strategy**: Apply fair process in strategy making

## Resources

- [Blue Ocean Strategy Official Website](https://www.blueoceanstrategy.com/)
- [Deployment Guide](./DEPLOYMENT.md)
- [Environment Variables Guide](./.env.example)

## Support

For deployment issues or questions, refer to:
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment guide
- [Railway Docs](https://docs.railway.app/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Vinxi Docs](https://vinxi.vercel.app/)

---

Built with [Vinxi](https://vinxi.vercel.app/), [tRPC](https://trpc.io/), [Prisma](https://www.prisma.io/), and [Vercel AI SDK](https://sdk.vercel.ai/)
