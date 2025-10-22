# Blue Ocean Explorer API Documentation

## Overview

The Blue Ocean Explorer API is built using tRPC, providing type-safe API endpoints for the Blue Ocean Strategy application. This document covers all available procedures, their inputs, outputs, and usage examples.

## Base URL

- **Development**: `http://localhost:3000/trpc`
- **Staging**: `https://staging.blueoceanexplorer.com/trpc`
- **Production**: `https://blueoceanexplorer.com/trpc`

## Authentication

Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

All API responses follow the tRPC error format:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "data": {
      "code": "UNAUTHORIZED",
      "httpStatus": 401,
      "path": "createMarket",
      "zodError": null
    }
  }
}
```

Common error codes:
- `BAD_REQUEST` (400): Invalid input data
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource already exists
- `TOO_MANY_REQUESTS` (429): Rate limit exceeded
- `INTERNAL_SERVER_ERROR` (500): Server error

## Rate Limiting

API requests are rate-limited to prevent abuse:
- **Default**: 100 requests per 15-minute window
- **Authentication endpoints**: 10 requests per 15-minute window

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Unix timestamp when the rate limit resets

## Endpoints

### Authentication

#### `register`
Register a new user account.

**Type**: `mutation`
**Authentication**: Not required

**Input**:
```typescript
{
  email: string;           // Valid email address
  password: string;        // Min 8 chars, must contain uppercase, lowercase, number, special char
  name: string;           // Min 2 chars, max 100 chars
  acceptTerms: boolean;   // Must be true
}
```

**Output**:
```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    subscriptionTier: string;
    creditBalance: number;
    createdAt: Date;
  };
  token: string;
  expiresIn: string;
}
```

**Example**:
```typescript
const result = await trpc.register.mutate({
  email: "user@example.com",
  password: "SecurePass123!",
  name: "John Doe",
  acceptTerms: true
});
```

#### `login`
Authenticate an existing user.

**Type**: `mutation`
**Authentication**: Not required

**Input**:
```typescript
{
  email: string;
  password: string;
  rememberMe?: boolean;    // Optional, extends token expiry
}
```

**Output**:
```typescript
{
  user: {
    id: string;
    email: string;
    name: string;
    avatar: string | null;
    subscriptionTier: string;
    creditBalance: number;
    createdAt: Date;
  };
  token: string;
  expiresIn: string;       // "7d" or "30d" if rememberMe is true
}
```

### Markets

#### `createMarket`
Create a new market for analysis.

**Type**: `mutation`
**Authentication**: Required

**Input**:
```typescript
{
  name: string;            // Max 200 chars
  description?: string;    // Max 2000 chars
  industry: string;        // Max 100 chars
  size?: string;          // Max 50 chars
  growth?: number;        // -1 to 10 (representing -100% to 1000%)
  trends?: string[];      // Max 20 items
}
```

**Output**:
```typescript
{
  id: string;
  name: string;
  description: string | null;
  industry: string;
  size: string | null;
  growth: number | null;
  trends: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    name: string;
    email: string;
  };
  _count: {
    opportunities: number;
    competitors: number;
    segments: number;
  };
}
```

#### `getMarkets`
Retrieve user's markets with pagination.

**Type**: `query`
**Authentication**: Required

**Input**:
```typescript
{
  page?: number;          // Default: 1
  limit?: number;         // Default: 20, max: 100
  sortBy?: string;        // Field to sort by
  sortOrder?: "asc" | "desc"; // Default: "desc"
  query?: string;         // Search query
}
```

**Output**:
```typescript
{
  markets: Market[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### `getMarketDetails`
Get detailed information about a specific market.

**Type**: `query`
**Authentication**: Required

**Input**:
```typescript
{
  marketId: string;       // CUID format
}
```

**Output**:
```typescript
{
  id: string;
  name: string;
  description: string | null;
  industry: string;
  size: string | null;
  growth: number | null;
  trends: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  opportunities: Opportunity[];
  competitors: Competitor[];
  segments: Segment[];
  _count: {
    opportunities: number;
    competitors: number;
    segments: number;
  };
}
```

### Opportunities

#### `createOpportunity`
Create a new opportunity within a market.

**Type**: `mutation`
**Authentication**: Required

**Input**:
```typescript
{
  title: string;          // Max 200 chars
  description: string;    // Min 10 chars, max 5000 chars
  category: string;       // Max 100 chars
  priority?: "low" | "medium" | "high" | "critical"; // Default: "medium"
  status?: "identified" | "analyzing" | "validated" | "pursuing" | "completed"; // Default: "identified"
  potential?: number;     // 0-1 scale
  difficulty?: number;    // 0-1 scale
  timeframe?: string;     // Max 100 chars
  tags?: string[];        // Max 20 items, each max 50 chars
  marketId: string;       // CUID format
}
```

**Output**:
```typescript
{
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  potential: number | null;
  difficulty: number | null;
  timeframe: string | null;
  tags: string[];
  marketId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  market: {
    id: string;
    name: string;
    industry: string;
  };
  _count: {
    scenarios: number;
    boardOpportunities: number;
  };
}
```

#### `getOpportunities`
Retrieve opportunities with filtering and pagination.

**Type**: `query`
**Authentication**: Required

**Input**:
```typescript
{
  marketId?: string;      // Filter by market
  category?: string;      // Filter by category
  priority?: string;      // Filter by priority
  status?: string;        // Filter by status
  tags?: string[];        // Filter by tags
  page?: number;          // Default: 1
  limit?: number;         // Default: 20, max: 100
  sortBy?: string;        // Field to sort by
  sortOrder?: "asc" | "desc"; // Default: "desc"
  query?: string;         // Search query
}
```

#### `updateOpportunityScore`
Update the score of an opportunity.

**Type**: `mutation`
**Authentication**: Required

**Input**:
```typescript
{
  opportunityId: string;  // CUID format
  score: number;          // 0-1 scale
  criteria?: Record<string, number>; // Optional scoring criteria
}
```

### Boards

#### `createBoard`
Create a new opportunity board.

**Type**: `mutation`
**Authentication**: Required

**Input**:
```typescript
{
  name: string;           // Max 200 chars
  description?: string;   // Max 2000 chars
  color?: string;         // Hex color format (#RRGGBB)
  isPublic?: boolean;     // Default: false
}
```

#### `addOpportunityToBoard`
Add an opportunity to a board.

**Type**: `mutation`
**Authentication**: Required

**Input**:
```typescript
{
  boardId: string;        // CUID format
  opportunityId: string;  // CUID format
  position?: number;      // Position on board
  notes?: string;         // Max 1000 chars
}
```

### Strategy Sessions

#### `createStrategySession`
Start a new AI-powered strategy session.

**Type**: `mutation`
**Authentication**: Required

**Input**:
```typescript
{
  title: string;          // Max 200 chars
  description?: string;   // Max 2000 chars
  context?: Record<string, any>; // Session context
}
```

#### `strategyChatStream`
Send a message to an AI strategy session (streaming response).

**Type**: `subscription`
**Authentication**: Required

**Input**:
```typescript
{
  sessionId: string;      // CUID format
  message: string;        // Max 5000 chars
  context?: Record<string, any>; // Message context
}
```

### Blue Ocean Canvas

#### `createBlueOceanCanvas`
Create a new Blue Ocean Strategy canvas.

**Type**: `mutation`
**Authentication**: Required

**Input**:
```typescript
{
  name: string;           // Max 200 chars
  description?: string;   // Max 2000 chars
  eliminate?: string[];   // Max 20 items, each max 200 chars
  reduce?: string[];      // Max 20 items, each max 200 chars
  raise?: string[];       // Max 20 items, each max 200 chars
  create?: string[];      // Max 20 items, each max 200 chars
}
```

### Marketplace

#### `getMarketplaceListings`
Browse marketplace listings.

**Type**: `query`
**Authentication**: Optional

**Input**:
```typescript
{
  category?: string;      // Filter by category
  type?: string;          // Filter by type
  minPrice?: number;      // Minimum price filter
  maxPrice?: number;      // Maximum price filter
  tags?: string[];        // Filter by tags
  page?: number;          // Default: 1
  limit?: number;         // Default: 20, max: 100
  sortBy?: string;        // Field to sort by
  sortOrder?: "asc" | "desc"; // Default: "desc"
  query?: string;         // Search query
}
```

#### `createMarketplaceListing`
Create a new marketplace listing.

**Type**: `mutation`
**Authentication**: Required

**Input**:
```typescript
{
  title: string;          // Max 200 chars
  description: string;    // Min 50 chars, max 5000 chars
  category: string;       // Max 100 chars
  price: number;          // Must be positive
  currency?: string;      // 3-letter code, default: "USD"
  type: "template" | "strategy" | "analysis" | "tool" | "data";
  content: Record<string, any>; // Listing content
  tags?: string[];        // Max 20 items, each max 50 chars
}
```

### Health & Monitoring

#### `healthCheck`
Get comprehensive system health status.

**Type**: `query`
**Authentication**: Not required

**Output**:
```typescript
{
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  uptime: number;
  version: string;
  checks: {
    database: {
      status: "healthy" | "unhealthy";
      responseTime: number;
      message?: string;
    };
    externalServices: {
      status: "healthy" | "unhealthy";
      responseTime: number;
      message?: string;
    };
    // ... other checks
  };
}
```

#### `liveness`
Simple liveness check for Kubernetes.

**Type**: `query`
**Authentication**: Not required

**Output**:
```typescript
{
  status: "ok";
  timestamp: string;
}
```

#### `readiness`
Readiness check for Kubernetes.

**Type**: `query`
**Authentication**: Not required

**Output**:
```typescript
{
  status: "ready" | "not-ready";
  timestamp: string;
  message?: string;
}
```

## Usage Examples

### TypeScript Client

```typescript
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from './server/trpc/root';

const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc',
      headers: () => ({
        Authorization: `Bearer ${getAuthToken()}`,
      }),
    }),
  ],
});

// Register a new user
const user = await trpc.register.mutate({
  email: 'user@example.com',
  password: 'SecurePass123!',
  name: 'John Doe',
  acceptTerms: true,
});

// Create a market
const market = await trpc.createMarket.mutate({
  name: 'Electric Vehicle Market',
  description: 'Analysis of the growing EV market',
  industry: 'Automotive',
  growth: 0.25,
  trends: ['Sustainability', 'Battery Technology', 'Autonomous Driving'],
});

// Get markets with pagination
const markets = await trpc.getMarkets.query({
  page: 1,
  limit: 10,
  sortBy: 'createdAt',
  sortOrder: 'desc',
});
```

### React Hook Usage

```typescript
import { trpc } from '../utils/trpc';

function MarketsList() {
  const { data: markets, isLoading, error } = trpc.getMarkets.useQuery({
    page: 1,
    limit: 20,
  });

  const createMarketMutation = trpc.createMarket.useMutation({
    onSuccess: () => {
      // Invalidate and refetch markets
      trpc.getMarkets.invalidate();
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {markets?.markets.map(market => (
        <div key={market.id}>
          <h3>{market.name}</h3>
          <p>{market.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## Webhooks

The API supports webhooks for real-time notifications:

### Stripe Webhooks
- **Endpoint**: `/api/webhooks/stripe`
- **Events**: `payment_intent.succeeded`, `customer.subscription.updated`

### Custom Webhooks
- **Endpoint**: `/api/webhooks/custom`
- **Events**: User-defined events for integrations

## SDKs and Libraries

- **TypeScript/JavaScript**: Built-in tRPC client
- **React**: tRPC React Query integration
- **Python**: Community SDK available
- **Go**: Community SDK available

## Support

For API support and questions:
- **Documentation**: [docs.blueoceanexplorer.com](https://docs.blueoceanexplorer.com)
- **Support Email**: support@blueoceanexplorer.com
- **GitHub Issues**: [github.com/blueoceanexplorer/api/issues](https://github.com/blueoceanexplorer/api/issues)

## Changelog

### v1.0.0 (Current)
- Initial API release
- Full tRPC implementation
- Authentication and authorization
- Core business logic endpoints
- Health monitoring
- Rate limiting
- Comprehensive error handling