# Blue Ocean Explorer API Documentation

## Overview

The Blue Ocean Explorer API is built with tRPC, providing end-to-end type safety and automatic client generation. All endpoints are prefixed with `/trpc/` and use JSON-RPC 2.0 format.

## Base URL

```
Development: http://localhost:3000/trpc
Production: https://your-domain.com/trpc
```

## Authentication

Most endpoints require authentication via JWT token. Include the token in the request:

```typescript
{
  token: "your-jwt-token"
}
```

## Error Handling

All errors follow a consistent format:

```typescript
{
  error: {
    code: "UNAUTHORIZED" | "NOT_FOUND" | "BAD_REQUEST" | "INTERNAL_SERVER_ERROR",
    message: "Human-readable error message",
    data?: any
  }
}
```

## Endpoints

### Authentication

#### `login`
Authenticate user and return JWT token.

**Input:**
```typescript
{
  email: string;
  password: string;
}
```

**Output:**
```typescript
{
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
  token: string;
  refreshToken?: string;
}
```

**Example:**
```typescript
const result = await trpc.login.mutate({
  email: "user@example.com",
  password: "password123"
});
```

#### `register`
Register new user account.

**Input:**
```typescript
{
  email: string;
  password: string;
  name: string;
}
```

**Output:**
```typescript
{
  user: {
    id: number;
    email: string;
    name: string;
    role: string;
  };
  token: string;
}
```

### Markets

#### `getMarkets`
Get all markets for authenticated user.

**Input:**
```typescript
{
  token: string;
}
```

**Output:**
```typescript
Array<{
  id: number;
  name: string;
  description: string;
  sector: string;
  createdAt: Date;
  _count: {
    segments: number;
    competitors: number;
  };
}>
```

#### `createMarket`
Create a new market.

**Input:**
```typescript
{
  token: string;
  name: string;
  description: string;
  sector: string;
}
```

**Output:**
```typescript
{
  id: number;
  name: string;
  description: string;
  sector: string;
  userId: number;
  createdAt: Date;
}
```

#### `getMarketDetails`
Get detailed market information including segments, competitors, and trends.

**Input:**
```typescript
{
  token: string;
  marketId: number;
  startDate?: string;
  endDate?: string;
  minSize?: number;
  maxSize?: number;
  minGrowth?: number;
  maxGrowth?: number;
}
```

**Output:**
```typescript
{
  id: number;
  name: string;
  description: string;
  sector: string;
  segments: Array<{
    id: number;
    name: string;
    characteristics: string;
    size?: number;
    growth?: number;
    opportunities: Array<{
      id: number;
      title: string;
      description: string;
      status: string;
      score: number;
      risk: string;
      revenue?: number;
      roi?: number;
    }>;
  }>;
  competitors: Array<{
    id: number;
    name: string;
    strengths: string;
    weaknesses: string;
    positioning?: string;
    marketShare?: number;
  }>;
  trends: Array<{
    id: number;
    title: string;
    sentimentScore?: number;
    source?: string;
    createdAt: Date;
  }>;
}
```

### Opportunities

#### `getOpportunities`
Get opportunities for a market with optional filtering.

**Input:**
```typescript
{
  token: string;
  marketId: number;
  status?: Array<"identified" | "analyzing" | "approved" | "rejected">;
}
```

**Output:**
```typescript
Array<{
  id: number;
  title: string;
  description: string;
  status: string;
  score: number;
  risk: string;
  revenue?: number;
  roi?: number;
  segment: {
    id: number;
    name: string;
    market: {
      id: number;
      name: string;
    };
  };
}>
```

#### `createOpportunity`
Create a new opportunity.

**Input:**
```typescript
{
  token: string;
  segmentId: number;
  title: string;
  description: string;
  revenue?: number;
  entryBarrier?: string;
  strategicFit?: number;
}
```

**Output:**
```typescript
{
  id: number;
  title: string;
  description: string;
  segmentId: number;
  status: string;
  score: number;
  createdAt: Date;
}
```

#### `updateOpportunityScore`
Update opportunity score and status.

**Input:**
```typescript
{
  token: string;
  opportunityId: number;
  score: number;
  status?: string;
}
```

**Output:**
```typescript
{
  id: number;
  score: number;
  status: string;
  updatedAt: Date;
}
```

### AI Features

#### `strategyChatStream`
Stream AI strategy chat responses.

**Input:**
```typescript
{
  token: string;
  sessionId: number;
  message: string;
  opportunityIds?: Array<number>;
}
```

**Output:**
```typescript
AsyncGenerator<{
  chunk: string;
  done: boolean;
}>
```

**Example:**
```typescript
const stream = trpc.strategyChatStream.query({
  token: "your-token",
  sessionId: 1,
  message: "Help me analyze this opportunity"
});

for await (const chunk of stream) {
  if (chunk.done) break;
  console.log(chunk.chunk);
}
```

#### `analyzeOpportunityWithAI`
Get AI analysis of an opportunity.

**Input:**
```typescript
{
  token: string;
  opportunityId: number;
  analysisType: "blue_ocean_assessment" | "competitive_analysis" | "market_validation" | "risk_assessment" | "value_innovation" | "business_model_review";
  customPrompt?: string;
}
```

**Output:**
```typescript
AsyncGenerator<{
  chunk: string;
  done: boolean;
}>
```

#### `generateMarketInsights`
Generate AI-powered market insights.

**Input:**
```typescript
{
  token: string;
  marketId: number;
  insightType: "trend_analysis" | "opportunity_identification" | "competitive_intelligence" | "customer_insights" | "market_forecasting" | "blue_ocean_opportunities";
  focusAreas?: Array<string>;
  timeframe?: "short_term" | "medium_term" | "long_term";
}
```

**Output:**
```typescript
AsyncGenerator<{
  chunk: string;
  done: boolean;
}>
```

### Boards

#### `getBoards`
Get all opportunity boards for user.

**Input:**
```typescript
{
  token: string;
}
```

**Output:**
```typescript
Array<{
  id: number;
  name: string;
  description?: string;
  stage: "exploring" | "validating" | "building" | "live";
  _count: {
    opportunities: number;
  };
  createdAt: Date;
}>
```

#### `createBoard`
Create a new opportunity board.

**Input:**
```typescript
{
  token: string;
  name: string;
  description?: string;
  stage: "exploring" | "validating" | "building" | "live";
}
```

**Output:**
```typescript
{
  id: number;
  name: string;
  description?: string;
  stage: string;
  userId: number;
  createdAt: Date;
}
```

#### `addOpportunityToBoard`
Add opportunity to a board.

**Input:**
```typescript
{
  token: string;
  boardId: number;
  opportunityId: number;
}
```

**Output:**
```typescript
{
  id: number;
  boardId: number;
  opportunityId: number;
  createdAt: Date;
}
```

### Analytics

#### `getCreditBalance`
Get user's credit balance and transaction history.

**Input:**
```typescript
{
  token: string;
  includeTransactions?: boolean;
}
```

**Output:**
```typescript
{
  balance: number;
  transactions?: Array<{
    id: number;
    amount: number;
    type: string;
    description: string;
    createdAt: Date;
  }>;
}
```

#### `getUserSubscription`
Get user's subscription information.

**Input:**
```typescript
{
  token: string;
}
```

**Output:**
```typescript
{
  id: number;
  tier: {
    id: number;
    name: string;
    creditsPerMonth: number;
    price: number;
  };
  status: string;
  currentPeriodEnd: Date;
}
```

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **AI endpoints**: 10 requests per minute per user
- **General endpoints**: 100 requests per minute per user

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Webhooks

The API supports webhooks for real-time updates:

### Market Updates
```typescript
POST /webhooks/market-updated
{
  marketId: number;
  event: "created" | "updated" | "deleted";
  data: MarketData;
}
```

### Opportunity Updates
```typescript
POST /webhooks/opportunity-updated
{
  opportunityId: number;
  event: "created" | "updated" | "deleted";
  data: OpportunityData;
}
```

## SDK Usage

### TypeScript/JavaScript

```typescript
import { createTRPCClient } from '@trpc/client';
import type { AppRouter } from './server/trpc/root';

const client = createTRPCClient<AppRouter>({
  url: 'http://localhost:3000/trpc',
});

// Use the client
const markets = await client.getMarkets.query({
  token: 'your-jwt-token'
});
```

### React Hook

```typescript
import { useTRPC } from '~/trpc/react';

function MyComponent() {
  const trpc = useTRPC();
  
  const { data: markets, isLoading } = trpc.getMarkets.useQuery({
    token: 'your-jwt-token'
  });
  
  const createMarket = trpc.createMarket.useMutation();
  
  return (
    <div>
      {isLoading ? 'Loading...' : markets?.map(market => (
        <div key={market.id}>{market.name}</div>
      ))}
    </div>
  );
}
```

## Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHORIZED` | Invalid or missing authentication token |
| `FORBIDDEN` | User doesn't have permission for this resource |
| `NOT_FOUND` | Resource not found |
| `BAD_REQUEST` | Invalid request parameters |
| `VALIDATION_ERROR` | Input validation failed |
| `RATE_LIMITED` | Too many requests |
| `INTERNAL_SERVER_ERROR` | Server error |

## Pagination

List endpoints support pagination:

```typescript
{
  page?: number;        // Page number (default: 1)
  limit?: number;       // Items per page (default: 20, max: 100)
  sortBy?: string;      // Field to sort by
  sortOrder?: "asc" | "desc"; // Sort direction
}
```

Response includes pagination metadata:

```typescript
{
  data: Array<any>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

## Filtering

Many endpoints support filtering:

```typescript
{
  // Date range filtering
  startDate?: string;   // ISO date string
  endDate?: string;     // ISO date string
  
  // Numeric range filtering
  minScore?: number;
  maxScore?: number;
  minSize?: number;
  maxSize?: number;
  
  // Status filtering
  status?: Array<string>;
  
  // Search
  search?: string;      // Text search
}
```

## Examples

### Complete Workflow

```typescript
// 1. Login
const { user, token } = await trpc.login.mutate({
  email: "user@example.com",
  password: "password123"
});

// 2. Create market
const market = await trpc.createMarket.mutate({
  token,
  name: "Electric Vehicles",
  description: "EV market analysis",
  sector: "Automotive"
});

// 3. Get market details
const details = await trpc.getMarketDetails.query({
  token,
  marketId: market.id
});

// 4. Create opportunity
const opportunity = await trpc.createOpportunity.mutate({
  token,
  segmentId: details.segments[0].id,
  title: "Battery Technology Innovation",
  description: "Next-gen battery solutions"
});

// 5. Get AI analysis
const analysis = trpc.analyzeOpportunityWithAI.query({
  token,
  opportunityId: opportunity.id,
  analysisType: "blue_ocean_assessment"
});

for await (const chunk of analysis) {
  if (chunk.done) break;
  console.log(chunk.chunk);
}
```