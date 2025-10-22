# Testing Guide

This document describes the comprehensive testing strategy for the Blue Ocean Explorer application.

## Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Coverage Goals](#coverage-goals)
- [CI/CD Integration](#cicd-integration)

## Overview

The application uses a multi-layered testing approach:

1. **Unit Tests**: Test individual functions and utilities
2. **Integration Tests**: Test API endpoints (tRPC procedures)
3. **Component Tests**: Test React components in isolation
4. **E2E Tests**: Test complete user workflows

## Testing Stack

- **Vitest**: Fast unit test runner with native ESM support
- **Testing Library**: Component testing with best practices
- **Playwright**: Cross-browser E2E testing
- **Coverage**: v8 code coverage reporting

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test

# Run tests with UI
pnpm test:ui

# Generate coverage report
pnpm test:coverage
```

### E2E Tests

```bash
# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui

# Run E2E tests in headed mode
pnpm test:e2e --headed

# Run specific browser
pnpm test:e2e --project=chromium
```

### Run All Tests

```bash
# Run all test suites
pnpm test && pnpm test:e2e
```

## Test Structure

```
tests/
├── setup.ts                          # Test environment setup
├── utils/                            # Utility tests
│   └── export.test.ts
├── server/
│   ├── utils/
│   │   ├── auth.test.ts             # Authentication tests
│   │   └── sanitize.test.ts         # Input sanitization tests
│   ├── middleware/
│   │   └── rateLimit.test.ts        # Rate limiting tests
│   └── procedures/
│       └── auth.test.ts             # Auth procedure tests
├── components/
│   ├── HelpTooltip.test.tsx         # Component tests
│   └── FilterStats.test.tsx
└── e2e/
    ├── auth.spec.ts                 # E2E authentication tests
    └── navigation.spec.ts           # E2E navigation tests
```

## Writing Tests

### Unit Tests

```typescript
import { describe, it, expect } from "vitest";
import { myFunction } from "./myFunction";

describe("myFunction", () => {
  it("should handle basic case", () => {
    const result = myFunction(input);
    expect(result).toBe(expected);
  });

  it("should handle edge case", () => {
    const result = myFunction(edgeInput);
    expect(result).toBe(edgeExpected);
  });
});
```

### Component Tests

```typescript
import { render, screen } from "@testing-library/react";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("should render correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });
});
```

### E2E Tests

```typescript
import { test, expect } from "@playwright/test";

test("user can complete workflow", async ({ page }) => {
  await page.goto("/");
  await page.click("text=Start");
  await expect(page).toHaveURL(/\/success/);
});
```

## Test Coverage Areas

### Critical Paths Tested

1. **Authentication**
   - User registration with validation
   - Login with various scenarios
   - Token generation and validation
   - Session management

2. **Authorization**
   - Protected route access
   - Role-based permissions
   - Feature access control

3. **Data Validation**
   - Input sanitization
   - SQL injection prevention
   - XSS prevention
   - File upload validation

4. **Rate Limiting**
   - Request throttling
   - User-specific limits
   - Window-based counting

5. **Export Functionality**
   - CSV export
   - JSON export
   - Data formatting
   - Special character handling

6. **Error Handling**
   - Error boundaries
   - API error responses
   - Network failures
   - Validation errors

## Coverage Goals

Target coverage thresholds:

- **Lines**: 70%
- **Functions**: 70%
- **Branches**: 70%
- **Statements**: 70%

Critical paths should have 90%+ coverage:
- Authentication
- Authorization
- Data validation
- Payment processing

## Best Practices

### Do's

✅ Test behavior, not implementation
✅ Write descriptive test names
✅ Test edge cases and error conditions
✅ Mock external dependencies
✅ Keep tests independent and isolated
✅ Use meaningful assertions
✅ Test accessibility where applicable

### Don'ts

❌ Don't test framework code
❌ Don't write brittle tests that break on refactoring
❌ Don't ignore failing tests
❌ Don't skip error cases
❌ Don't test multiple things in one test

## CI/CD Integration

Tests run automatically on:

- Every pull request
- Every commit to main branch
- Before deployment

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 20
          cache: "pnpm"
      - run: pnpm install
      - run: pnpm test:coverage
      - run: pnpm test:e2e
```

## Debugging Tests

### Vitest Debugging

```bash
# Run single test file
pnpm test auth.test.ts

# Run tests matching pattern
pnpm test --grep="login"

# Run in debug mode
node --inspect-brk ./node_modules/.bin/vitest
```

### Playwright Debugging

```bash
# Run with browser visible
pnpm test:e2e --headed

# Run with debugger
pnpm test:e2e --debug

# Generate trace
pnpm test:e2e --trace on
```

## Mocking Strategies

### API Mocking

```typescript
vi.mock("~/server/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));
```

### Environment Variables

```typescript
vi.mock("~/server/env", () => ({
  env: {
    JWT_SECRET: "test-secret",
  },
}));
```

## Performance Testing

While not included in this test suite, consider adding:

- Load testing with k6 or Artillery
- Performance profiling
- Memory leak detection
- Database query optimization

## Security Testing

Security tests cover:

- Input validation and sanitization
- Authentication bypass attempts
- Authorization checks
- Rate limiting
- SQL injection prevention
- XSS prevention
- CSRF protection

## Accessibility Testing

Consider adding:

- axe-core integration
- Keyboard navigation tests
- Screen reader compatibility
- ARIA attribute validation

## Continuous Improvement

- Review test coverage regularly
- Update tests when requirements change
- Add tests for bug fixes
- Refactor tests for maintainability
- Document complex test scenarios

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
