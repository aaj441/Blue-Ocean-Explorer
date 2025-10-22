# Blue Ocean Explorer

A comprehensive strategic analysis platform that helps businesses discover untapped market opportunities using Blue Ocean Strategy principles, AI-powered insights, and collaborative tools.

## 🚀 Features

- **Market Analysis**: Comprehensive tools for analyzing markets, segments, and opportunities
- **AI-Powered Insights**: Leverage AI for trend analysis, scenario planning, and strategic recommendations
- **Blue Ocean Canvas**: Interactive strategy canvas for value innovation
- **Opportunity Constellation**: Visual representation of interconnected opportunities
- **Collaborative Boards**: Organize and share strategic insights with your team
- **Marketplace**: Buy and sell market reports, templates, and strategic resources
- **Real-time Collaboration**: Work together on strategic initiatives

## 📋 Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL 14+
- Redis (optional, for caching and rate limiting)
- MinIO or S3-compatible storage (for file uploads)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/blue-ocean-explorer.git
cd blue-ocean-explorer
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with appropriate values (see [Environment Variables](#environment-variables))

5. Set up the database:
```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm db:migrate:dev

# Seed the database (optional)
pnpm db:seed
```

6. Start the development server:
```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## 🧪 Testing

Run the test suite:
```bash
# Unit and integration tests
pnpm test

# With coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e

# All tests
pnpm test:all
```

## 🏗️ Architecture

The application is built with:

- **Frontend**: React 19 + TanStack Router + TailwindCSS
- **Backend**: Node.js + tRPC + Prisma
- **Database**: PostgreSQL
- **Caching**: Redis
- **File Storage**: MinIO/S3
- **Authentication**: JWT-based
- **Real-time**: Server-Sent Events (SSE)

See [ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed information.

## 📝 Environment Variables

Key environment variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/blue_ocean_explorer

# Authentication
JWT_SECRET=your-secret-key-min-32-chars
ADMIN_PASSWORD=strong-admin-password

# AI Services
OPENROUTER_API_KEY=your-openrouter-key

# Storage
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin

# Redis (optional)
REDIS_URL=redis://localhost:6379

# Monitoring (optional)
SENTRY_DSN=your-sentry-dsn
```

See [.env.example](./.env.example) for a complete list.

## 🚀 Deployment

### Docker

```bash
docker-compose up -d
```

### Manual Deployment

1. Build the application:
```bash
pnpm build
```

2. Run migrations:
```bash
pnpm db:migrate:prod
```

3. Start the server:
```bash
pnpm start
```

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for platform-specific guides.

## 🔒 Security

- All passwords are hashed with bcrypt
- JWT tokens for authentication
- Rate limiting on sensitive endpoints
- Input validation and sanitization
- SQL injection protection via Prisma
- XSS protection headers
- CORS configuration

Run security audit:
```bash
pnpm run security:audit
```

## 📊 Monitoring

The application includes:

- Health check endpoints (`/health`, `/health/live`, `/health/ready`)
- Metrics endpoint (`/metrics`)
- Performance monitoring
- Error tracking with Sentry
- Structured logging

## 🤝 Contributing

Please read [CONTRIBUTING.md](./docs/CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Documentation: [/docs](./docs)
- Issues: [GitHub Issues](https://github.com/your-org/blue-ocean-explorer/issues)
- Discussions: [GitHub Discussions](https://github.com/your-org/blue-ocean-explorer/discussions)