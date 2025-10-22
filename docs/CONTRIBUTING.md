# Contributing to Blue Ocean Explorer

Thank you for your interest in contributing to Blue Ocean Explorer! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct:

- Be respectful and inclusive
- Welcome newcomers and help them get started
- Focus on constructive criticism
- Respect differing viewpoints and experiences

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/blue-ocean-explorer.git
   cd blue-ocean-explorer
   ```
3. **Add upstream remote:**
   ```bash
   git remote add upstream https://github.com/original/blue-ocean-explorer.git
   ```
4. **Install dependencies:**
   ```bash
   pnpm install
   ```
5. **Set up development environment:**
   ```bash
   cp .env.example .env
   # Configure your local environment variables
   ```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates
- `chore/` - Maintenance tasks

### 2. Make Your Changes

Follow these guidelines:

#### Code Style

- Use TypeScript for type safety
- Follow existing code patterns
- Run formatting: `pnpm format`
- Run linting: `pnpm lint`

#### Commit Messages

Follow conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Maintenance

Examples:
```bash
git commit -m "feat(auth): add two-factor authentication"
git commit -m "fix(market): resolve pagination issue"
git commit -m "docs(api): update endpoint documentation"
```

### 3. Write Tests

- Add unit tests for new functions
- Add integration tests for API endpoints
- Add E2E tests for user workflows
- Ensure all tests pass: `pnpm test`

### 4. Update Documentation

- Update README.md if needed
- Add/update API documentation
- Include JSDoc comments for functions
- Update type definitions

### 5. Submit Pull Request

1. **Push your branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create Pull Request** on GitHub

3. **Fill out PR template:**
   - Describe changes
   - Link related issues
   - Include screenshots if UI changes
   - List breaking changes

## Development Guidelines

### TypeScript Best Practices

```typescript
// ✅ Good: Use explicit types
interface UserData {
  id: number;
  email: string;
  name: string;
}

function getUser(id: number): Promise<UserData> {
  // ...
}

// ❌ Bad: Avoid any type
function processData(data: any) {
  // ...
}
```

### React Best Practices

```typescript
// ✅ Good: Use functional components with hooks
export function MarketCard({ market }: { market: Market }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="card">
      {/* ... */}
    </div>
  );
}

// ✅ Good: Memoize expensive computations
const expensiveValue = useMemo(() => {
  return calculateComplexValue(data);
}, [data]);
```

### Database Guidelines

```typescript
// ✅ Good: Use transactions for related operations
const result = await db.$transaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.creditBalance.create({ 
    data: { userId: user.id, balance: 100 } 
  });
  return user;
});

// ✅ Good: Select only needed fields
const markets = await db.market.findMany({
  select: {
    id: true,
    name: true,
    industry: true,
  },
});
```

### API Design

```typescript
// ✅ Good: Use proper HTTP semantics in tRPC
export const marketRouter = createTRPCRouter({
  // GET operations use .query()
  getMarkets: protectedProcedure
    .input(z.object({ page: z.number() }))
    .query(({ input, ctx }) => {
      // ...
    }),
    
  // POST/PUT/DELETE use .mutation()
  createMarket: protectedProcedure
    .input(createMarketSchema)
    .mutation(({ input, ctx }) => {
      // ...
    }),
});
```

## Testing Guidelines

### Unit Tests

```typescript
describe('calculateOpportunityScore', () => {
  it('should return high score for low risk, high value opportunities', () => {
    const score = calculateOpportunityScore({
      potentialValue: 1000000,
      riskLevel: 'LOW',
      timeToMarket: 6,
    });
    
    expect(score).toBeGreaterThan(0.8);
  });
});
```

### Integration Tests

```typescript
describe('Market API', () => {
  it('should create and retrieve market', async () => {
    const market = await caller.market.createMarket({
      name: 'Test Market',
      industry: 'Technology',
    });
    
    expect(market.id).toBeDefined();
    
    const retrieved = await caller.market.getMarketDetails({
      marketId: market.id,
    });
    
    expect(retrieved.market.name).toBe('Test Market');
  });
});
```

### E2E Tests

```typescript
test('complete opportunity workflow', async ({ page }) => {
  // Login
  await page.goto('/auth/login');
  await loginUser(page, 'test@example.com', 'password');
  
  // Create opportunity
  await page.goto('/opportunities');
  await page.click('button:has-text("Create")');
  await fillOpportunityForm(page, opportunityData);
  
  // Verify creation
  await expect(page.locator('text=Opportunity created')).toBeVisible();
});
```

## Performance Considerations

- Lazy load components with dynamic imports
- Optimize images (WebP, proper sizing)
- Use React.memo for expensive components
- Implement virtual scrolling for long lists
- Cache API responses appropriately

## Security Considerations

- Never commit secrets or API keys
- Validate all user inputs
- Use parameterized queries (Prisma handles this)
- Implement proper access control
- Sanitize user-generated content

## Pull Request Review Process

1. **Automated checks** must pass:
   - Tests (unit, integration, E2E)
   - Linting
   - Type checking
   - Build process

2. **Code review** by maintainers:
   - Code quality
   - Performance implications
   - Security considerations
   - Documentation completeness

3. **Testing** on staging environment

4. **Approval and merge**

## Release Process

1. Merge to `main` branch
2. Create release tag: `v1.2.3`
3. Deploy to staging
4. Run smoke tests
5. Deploy to production
6. Monitor metrics

## Getting Help

- 💬 [GitHub Discussions](https://github.com/your-org/blue-ocean-explorer/discussions)
- 🐛 [Issue Tracker](https://github.com/your-org/blue-ocean-explorer/issues)
- 📧 Email: contribute@blueoceanexplorer.com

## Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Annual contributor report

Thank you for contributing! 🙏