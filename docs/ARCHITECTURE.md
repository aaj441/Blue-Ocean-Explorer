# Architecture Overview

## System Architecture

Blue Ocean Explorer follows a modern, scalable architecture designed for performance, security, and developer experience.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  React Client   │────▶│   tRPC Server   │────▶│   PostgreSQL    │
│  (TanStack)     │     │   (Node.js)     │     │                 │
│                 │     │                 │     └─────────────────┘
└─────────────────┘     └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
              ┌─────▼─────┐           ┌──────▼──────┐
              │           │           │             │
              │   Redis   │           │    MinIO    │
              │  (Cache)  │           │  (Storage)  │
              │           │           │             │
              └───────────┘           └─────────────┘
```

## Tech Stack

### Frontend
- **React 19**: Latest React with concurrent features
- **TanStack Router**: Type-safe routing
- **TanStack Query**: Data fetching and caching
- **Zustand**: Lightweight state management
- **TailwindCSS**: Utility-first styling
- **Recharts**: Data visualization
- **React Hook Form**: Form management

### Backend
- **Node.js**: JavaScript runtime
- **tRPC**: End-to-end typesafe APIs
- **Prisma**: Type-safe database ORM
- **Vinxi**: Modern build tool and dev server
- **Zod**: Schema validation

### Infrastructure
- **PostgreSQL**: Primary database
- **Redis**: Caching and rate limiting
- **MinIO**: S3-compatible object storage
- **Docker**: Containerization
- **Nginx**: Reverse proxy (production)

## Directory Structure

```
blue-ocean-explorer/
├── components/          # React components
│   ├── charts/         # Chart components
│   └── ui/            # UI components
├── routes/             # TanStack Router pages
├── server/             # Backend code
│   ├── trpc/          # tRPC routers and procedures
│   ├── utils/         # Utility functions
│   └── middleware/    # Express middleware
├── stores/             # Zustand stores
├── test/              # Test files
│   ├── unit/         # Unit tests
│   ├── integration/  # Integration tests
│   └── e2e/          # End-to-end tests
├── prisma/            # Database schema
└── docs/              # Documentation
```

## Key Design Patterns

### 1. Type-Safe API Layer
tRPC provides end-to-end type safety between client and server:

```typescript
// Server
export const marketRouter = createTRPCRouter({
  getMarkets: protectedProcedure
    .input(z.object({ 
      industry: z.string().optional() 
    }))
    .query(({ input, ctx }) => {
      return db.market.findMany({
        where: { 
          userId: ctx.user.id,
          industry: input.industry 
        }
      });
    }),
});

// Client - types are automatically inferred
const { data } = trpc.market.getMarkets.useQuery({ 
  industry: 'Technology' 
});
```

### 2. Layered Architecture

**Presentation Layer** (React Components)
- Handles UI rendering and user interactions
- Uses React Query for server state

**Application Layer** (tRPC Procedures)
- Business logic and orchestration
- Input validation with Zod
- Authentication and authorization

**Domain Layer** (Services)
- Core business rules
- Domain-specific logic

**Data Layer** (Prisma)
- Database interactions
- Data modeling

### 3. Error Handling Strategy

Centralized error handling with custom error classes:

```typescript
// Throw domain-specific errors
throw new NotFoundError('Market', marketId);

// Automatically converted to appropriate HTTP responses
// and tRPC errors with proper status codes
```

### 4. Caching Strategy

Multi-level caching for optimal performance:

1. **Browser Cache**: TanStack Query caching
2. **Redis Cache**: Server-side caching for expensive operations
3. **Database Query Optimization**: Efficient queries with Prisma

### 5. Security Layers

- **Authentication**: JWT-based with refresh tokens
- **Authorization**: Role-based access control (RBAC)
- **Rate Limiting**: Per-endpoint and per-user limits
- **Input Validation**: Zod schemas on all inputs
- **SQL Injection Prevention**: Parameterized queries via Prisma
- **XSS Prevention**: React's built-in escaping + CSP headers

## Performance Optimizations

### Frontend
- Code splitting with dynamic imports
- Image optimization and lazy loading
- Prefetching for TanStack Router
- Optimistic updates for better UX

### Backend
- Database query optimization with proper indexes
- Connection pooling
- Response compression
- Efficient pagination
- Caching of expensive computations

### Infrastructure
- CDN for static assets
- Load balancing (production)
- Horizontal scaling capability
- Health checks and auto-recovery

## Monitoring and Observability

### Logging
- Structured JSON logging
- Log levels: error, warn, info, debug, trace
- Contextual information (request ID, user ID)

### Metrics
- Request duration
- Database query performance
- Cache hit rates
- Error rates
- Business metrics

### Health Checks
- `/health` - Basic health check
- `/health/live` - Liveness probe
- `/health/ready` - Readiness probe

## Development Workflow

### Local Development
```bash
pnpm dev
```
- Hot module replacement
- Type checking
- Automatic API type generation

### Testing
```bash
pnpm test        # Unit tests
pnpm test:e2e    # E2E tests
```

### Code Quality
```bash
pnpm lint        # ESLint
pnpm typecheck   # TypeScript
pnpm format      # Prettier
```

## Deployment Architecture

### Container-Based Deployment
```yaml
services:
  app:
    build: .
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
      - minio
  
  postgres:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
  
  minio:
    image: minio/minio
    volumes:
      - minio_data:/data
```

### Environment-Specific Configurations
- **Development**: Hot reloading, verbose logging
- **Staging**: Production-like with debug features
- **Production**: Optimized builds, minimal logging

## Scalability Considerations

### Horizontal Scaling
- Stateless application servers
- Shared session storage in Redis
- Database read replicas

### Vertical Scaling
- Resource limits configuration
- Memory optimization
- Connection pooling

### Future Enhancements
- GraphQL federation for microservices
- Event-driven architecture with message queues
- Kubernetes deployment
- Multi-region deployment