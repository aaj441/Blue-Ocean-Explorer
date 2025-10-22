# Blue Ocean Explorer

A comprehensive Blue Ocean Strategy application built with modern web technologies, providing AI-powered market analysis, opportunity identification, and strategic planning tools.

## 🚀 Features

### Core Features
- **Market Analysis**: Create and analyze markets with AI-powered insights
- **Opportunity Management**: Identify, track, and prioritize strategic opportunities
- **Blue Ocean Canvas**: Interactive strategy canvas for eliminate-reduce-raise-create analysis
- **Strategy Sessions**: AI-powered strategic planning conversations
- **Opportunity Boards**: Kanban-style boards for organizing opportunities
- **Radar Matching**: Automated opportunity discovery based on custom criteria

### Advanced Features
- **Marketplace**: Buy and sell strategic templates, analyses, and tools
- **Challenge Arena**: Gamified strategic challenges with community voting
- **AI Insights**: Trend intersection analysis, value migration predictions
- **Partnership Suggestions**: AI-powered partnership opportunity identification
- **Pitch Deck Generation**: Automated presentation creation
- **Cross-Industry Scenarios**: Generate scenarios across different industries

### Enterprise Features
- **Real-time Collaboration**: Multi-user strategic planning sessions
- **Advanced Analytics**: Comprehensive performance metrics and insights
- **Custom Integrations**: API access for enterprise systems
- **White-label Solutions**: Customizable branding and deployment

## 🛠 Tech Stack

### Frontend
- **React 19** - Modern React with concurrent features
- **TypeScript** - Type-safe development
- **TanStack Router** - Type-safe routing
- **TanStack Query** - Server state management
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Lucide React** - Icon library

### Backend
- **Node.js 20** - Runtime environment
- **tRPC** - End-to-end type safety
- **Prisma** - Database ORM
- **PostgreSQL** - Primary database
- **Redis** - Caching and sessions
- **MinIO** - File storage

### AI & External Services
- **OpenRouter** - AI model access
- **Anthropic Claude** - Advanced reasoning
- **OpenAI GPT** - Text generation
- **Google AI** - Additional AI capabilities

### Infrastructure
- **Vinxi** - Full-stack framework
- **Docker** - Containerization
- **AWS ECS** - Container orchestration
- **GitHub Actions** - CI/CD pipeline
- **Playwright** - E2E testing

## 📋 Prerequisites

- Node.js 20 or higher
- pnpm 8 or higher
- PostgreSQL 15 or higher
- Redis 7 or higher (optional, for production)
- Docker (for containerized deployment)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/blue-ocean-explorer.git
cd blue-ocean-explorer
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/blue_ocean_explorer"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
ADMIN_PASSWORD="your-admin-password"

# AI Services
OPENROUTER_API_KEY="your-openrouter-api-key"

# Optional services
STRIPE_SECRET_KEY="your-stripe-secret-key"
REDIS_URL="redis://localhost:6379"
```

### 4. Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm db:migrate

# (Optional) Seed the database
pnpm db:seed
```

### 5. Start Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

## 🧪 Testing

### Run All Tests

```bash
pnpm test:all
```

### Unit Tests

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

### Integration Tests

```bash
pnpm test:integration
```

### End-to-End Tests

```bash
pnpm test:e2e
pnpm test:e2e:ui
```

## 🏗 Building for Production

### Build the Application

```bash
pnpm build
```

### Docker Build

```bash
docker build -t blue-ocean-explorer .
docker run -p 3000:3000 blue-ocean-explorer
```

### Production Deployment

The application includes a complete CI/CD pipeline with GitHub Actions:

1. **Automated Testing**: Unit, integration, and E2E tests
2. **Security Scanning**: Dependency and code security audits
3. **Docker Building**: Optimized production containers
4. **AWS Deployment**: ECS-based deployment to staging and production

## 📚 Documentation

### API Documentation
- [API Reference](./docs/API.md) - Complete tRPC API documentation
- [Authentication](./docs/auth.md) - Authentication and authorization guide
- [Database Schema](./docs/schema.md) - Database structure and relationships

### Development Guides
- [Contributing](./CONTRIBUTING.md) - Contribution guidelines
- [Architecture](./docs/architecture.md) - System architecture overview
- [Deployment](./docs/deployment.md) - Deployment and infrastructure guide

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | No | `development` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Yes | - |
| `ADMIN_PASSWORD` | Admin user password | Yes | - |
| `OPENROUTER_API_KEY` | OpenRouter API key | Yes | - |
| `REDIS_URL` | Redis connection string | No | - |
| `STRIPE_SECRET_KEY` | Stripe secret key | No | - |
| `SENTRY_DSN` | Sentry error tracking DSN | No | - |

### Feature Flags

Control feature availability with environment variables:

```env
ENABLE_MARKETPLACE=true
ENABLE_CHALLENGES=true
ENABLE_AI_INSIGHTS=true
ENABLE_REAL_TIME_COLLABORATION=false
```

## 🚀 Performance

### Optimization Features
- **Caching**: Multi-layer caching with Redis and in-memory fallback
- **Database Optimization**: Optimized queries, indexes, and connection pooling
- **CDN Integration**: Static asset delivery via CDN
- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Automatic image compression and format conversion

### Monitoring
- **Health Checks**: Comprehensive system health monitoring
- **Performance Metrics**: Real-time performance tracking
- **Error Tracking**: Automatic error reporting and alerting
- **Database Monitoring**: Query performance and optimization insights

## 🔒 Security

### Security Features
- **Authentication**: JWT-based authentication with secure token handling
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: API rate limiting to prevent abuse
- **Input Validation**: Comprehensive input sanitization and validation
- **CORS Protection**: Configurable CORS policies
- **Security Headers**: Comprehensive security headers via Helmet
- **SQL Injection Prevention**: Parameterized queries and ORM protection

### Security Best Practices
- Regular dependency updates
- Automated security scanning
- Secure environment variable handling
- Production-ready Docker containers
- HTTPS enforcement in production

## 📊 Monitoring & Analytics

### Application Monitoring
- **Health Endpoints**: `/api/health`, `/api/health/liveness`, `/api/health/readiness`
- **Metrics Collection**: Performance, error, and business metrics
- **Alerting**: Automated alerts for critical issues
- **Dashboards**: Real-time monitoring dashboards

### Business Analytics
- **User Analytics**: User behavior and engagement tracking
- **Feature Usage**: Feature adoption and usage metrics
- **Performance Analytics**: Application performance insights
- **Business Metrics**: Revenue, conversion, and growth metrics

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Process
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code Standards
- TypeScript for all new code
- ESLint and Prettier for code formatting
- Comprehensive test coverage (>70%)
- Documentation for new features
- Semantic commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

### Getting Help
- **Documentation**: Check our comprehensive docs
- **GitHub Issues**: Report bugs and request features
- **Discussions**: Community discussions and Q&A
- **Email Support**: support@blueoceanexplorer.com

### Enterprise Support
For enterprise customers, we offer:
- Priority support
- Custom feature development
- Professional services
- Training and onboarding

## 🗺 Roadmap

### Upcoming Features
- [ ] Mobile applications (iOS/Android)
- [ ] Advanced AI models integration
- [ ] Multi-language support
- [ ] Advanced collaboration features
- [ ] Enterprise SSO integration
- [ ] Advanced analytics and reporting

### Version History
- **v1.0.0** - Initial release with core features
- **v1.1.0** - Marketplace and challenges
- **v1.2.0** - Advanced AI insights
- **v1.3.0** - Real-time collaboration

## 🙏 Acknowledgments

- [Blue Ocean Strategy](https://www.blueoceanstrategy.com/) - Strategic framework inspiration
- [tRPC](https://trpc.io/) - End-to-end type safety
- [Prisma](https://www.prisma.io/) - Database toolkit
- [TanStack](https://tanstack.com/) - React ecosystem tools
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

**Built with ❤️ by the Blue Ocean Explorer team**