# API Documentation

## Overview

Blue Ocean Explorer uses tRPC for type-safe API communication between client and server. All API endpoints are available under the `/trpc` path.

## Authentication

Most endpoints require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

## API Endpoints

### Authentication

#### `auth.register`
Register a new user account.

**Input:**
```typescript
{
  email: string;
  password: string; // min 8 chars, must include uppercase, lowercase, number, special char
  name: string;
  role: "analyst" | "strategist" | "executive";
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

#### `auth.login`
Authenticate and receive JWT token.

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
  user: User;
  token: string;
}
```

### Markets

#### `market.getMarkets`
Get list of markets (paginated).

**Input:**
```typescript
{
  page?: number;
  limit?: number;
  industry?: string;
  search?: string;
  sortBy?: "name" | "size" | "growthRate" | "createdAt";
  sortOrder?: "asc" | "desc";
}
```

**Output:**
```typescript
{
  items: Market[];
  total: number;
  page: number;
  totalPages: number;
}
```

#### `market.createMarket`
Create a new market.

**Input:**
```typescript
{
  name: string;
  description?: string;
  industry: string;
  size?: number;
  growthRate?: number;
}
```

**Output:**
```typescript
Market
```

#### `market.getMarketDetails`
Get detailed information about a specific market.

**Input:**
```typescript
{
  marketId: number;
}
```

**Output:**
```typescript
{
  market: Market;
  segments: Segment[];
  opportunities: Opportunity[];
  competitors: Competitor[];
  trends: Trend[];
}
```

### Opportunities

#### `opportunity.getOpportunities`
Get opportunities with filters.

**Input:**
```typescript
{
  type?: OpportunityType;
  status?: OpportunityStatus;
  riskLevel?: RiskLevel;
  marketId?: number;
  minScore?: number;
  page?: number;
  limit?: number;
}
```

**Output:**
```typescript
{
  items: Opportunity[];
  total: number;
  connections: OpportunityConnection[];
}
```

#### `opportunity.createOpportunity`
Create a new opportunity.

**Input:**
```typescript
{
  title: string;
  description: string;
  type: OpportunityType;
  marketId?: number;
  segmentId?: number;
  potentialValue?: number;
  timeToMarket?: number;
  riskLevel?: RiskLevel;
}
```

**Output:**
```typescript
Opportunity
```

#### `opportunity.updateOpportunityScore`
Update opportunity score and status.

**Input:**
```typescript
{
  opportunityId: number;
  score: number; // 0-1
  status?: OpportunityStatus;
}
```

### AI-Powered Features

#### `ai.generateMarketReport`
Generate AI-powered market analysis report.

**Input:**
```typescript
{
  marketId: number;
  sections: ("overview" | "trends" | "opportunities" | "risks" | "recommendations")[];
}
```

**Output:**
```typescript
{
  report: {
    sections: Record<string, string>;
    generatedAt: Date;
  };
  creditsUsed: number;
}
```

#### `ai.generateDynamicSegments`
AI-powered market segmentation.

**Input:**
```typescript
{
  marketId: number;
  criteria: string[];
  minSegments?: number;
  maxSegments?: number;
}
```

**Output:**
```typescript
{
  segments: {
    name: string;
    description: string;
    size: number;
    characteristics: Record<string, any>;
  }[];
  creditsUsed: number;
}
```

#### `ai.strategyChatStream`
Real-time AI strategy consultation (SSE).

**Input:**
```typescript
{
  sessionId: number;
  message: string;
  context?: Record<string, any>;
}
```

**Output:** Server-Sent Events stream

### Boards

#### `board.getBoards`
Get user's boards.

**Input:**
```typescript
{
  type?: BoardType;
}
```

#### `board.createBoard`
Create a new board.

**Input:**
```typescript
{
  name: string;
  description?: string;
  type?: BoardType;
}
```

#### `board.addOpportunityToBoard`
Add opportunity to board.

**Input:**
```typescript
{
  boardId: number;
  opportunityId: number;
  position?: number;
}
```

### Credits & Billing

#### `credit.getCreditBalance`
Get user's credit balance.

**Output:**
```typescript
{
  balance: number;
  transactions: CreditTransaction[];
}
```

#### `credit.purchaseCredits`
Purchase credits via Stripe.

**Input:**
```typescript
{
  amount: number; // Credits to purchase
  paymentMethodId: string;
}
```

### Marketplace

#### `marketplace.getListings`
Browse marketplace listings.

**Input:**
```typescript
{
  category?: ListingCategory;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  featured?: boolean;
  page?: number;
  limit?: number;
}
```

#### `marketplace.createListing`
Create a marketplace listing.

**Input:**
```typescript
{
  title: string;
  description: string;
  category: ListingCategory;
  price: number;
  files?: string[]; // File URLs from upload
  previewImages?: string[];
}
```

## Error Handling

All errors follow this format:

```typescript
{
  code: "BAD_REQUEST" | "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND" | "CONFLICT" | "TOO_MANY_REQUESTS" | "INTERNAL_SERVER_ERROR";
  message: string;
  cause?: {
    zodError?: ZodError; // Validation errors
  };
}
```

Common error codes:
- `BAD_REQUEST` (400): Invalid input or validation error
- `UNAUTHORIZED` (401): Missing or invalid authentication
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource already exists
- `TOO_MANY_REQUESTS` (429): Rate limit exceeded

## Rate Limits

Default rate limits:
- General API: 100 requests per minute
- Authentication: 5 requests per 15 minutes
- AI endpoints: 10 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2024-01-01T00:00:00Z
```

## Pagination

Paginated endpoints support these parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sortBy`: Field to sort by
- `sortOrder`: "asc" or "desc"

Response format:
```typescript
{
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}
```

## File Uploads

File uploads use multipart/form-data to `/api/upload`:

```bash
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf" \
  -F "type=document" \
  https://api.example.com/api/upload
```

Response:
```json
{
  "url": "https://storage.example.com/uploads/document.pdf",
  "size": 1024000,
  "type": "application/pdf"
}
```

Limits:
- Max file size: 10MB
- Allowed types: PDF, DOCX, XLSX, PNG, JPG, CSV

## Webhooks

Configure webhooks for events:
- `opportunity.created`
- `opportunity.statusChanged`
- `market.updated`
- `purchase.completed`

Webhook payload:
```typescript
{
  event: string;
  timestamp: string;
  data: Record<string, any>;
  signature: string; // HMAC-SHA256
}
```

## SDKs

TypeScript types are automatically generated from tRPC definitions. Use the tRPC client for type-safe API access:

```typescript
import { trpc } from '~/trpc/client';

// Type-safe API calls
const markets = await trpc.market.getMarkets.query({ 
  industry: 'Technology' 
});
```