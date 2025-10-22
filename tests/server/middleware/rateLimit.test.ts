import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { rateLimiter } from "../../../src/server/middleware/rateLimit";
import { TRPCError } from "@trpc/server";

describe("RateLimiter", () => {
  beforeEach(() => {
    // Reset rate limiter before each test
    rateLimiter.reset("test-user");
  });

  afterEach(() => {
    rateLimiter.reset("test-user");
  });

  it("should allow requests under the limit", () => {
    expect(() => rateLimiter.check("test-user", 5, 60000)).not.toThrow();
    expect(() => rateLimiter.check("test-user", 5, 60000)).not.toThrow();
    expect(() => rateLimiter.check("test-user", 5, 60000)).not.toThrow();
  });

  it("should throw error when limit exceeded", () => {
    const limit = 3;

    // Should not throw for first 3 requests
    for (let i = 0; i < limit; i++) {
      expect(() => rateLimiter.check("test-user", limit, 60000)).not.toThrow();
    }

    // Should throw on 4th request
    expect(() => rateLimiter.check("test-user", limit, 60000)).toThrow(
      TRPCError,
    );
  });

  it("should throw TOO_MANY_REQUESTS error code", () => {
    const limit = 1;

    rateLimiter.check("test-user", limit, 60000);

    try {
      rateLimiter.check("test-user", limit, 60000);
      expect.fail("Should have thrown error");
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError);
      expect((error as TRPCError).code).toBe("TOO_MANY_REQUESTS");
    }
  });

  it("should track different users separately", () => {
    const limit = 2;

    rateLimiter.check("user-1", limit, 60000);
    rateLimiter.check("user-1", limit, 60000);

    rateLimiter.check("user-2", limit, 60000);
    rateLimiter.check("user-2", limit, 60000);

    // Both users should be at their limit
    expect(() => rateLimiter.check("user-1", limit, 60000)).toThrow();
    expect(() => rateLimiter.check("user-2", limit, 60000)).toThrow();
  });

  it("should reset count after window expires", async () => {
    const windowMs = 100; // 100ms window
    const limit = 2;

    rateLimiter.check("test-user", limit, windowMs);
    rateLimiter.check("test-user", limit, windowMs);

    // Should throw if we try immediately
    expect(() => rateLimiter.check("test-user", limit, windowMs)).toThrow();

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, windowMs + 10));

    // Should not throw after window expires
    expect(() => rateLimiter.check("test-user", limit, windowMs)).not.toThrow();
  });

  it("should handle concurrent requests", () => {
    const limit = 10;

    // Simulate 10 concurrent requests
    const results = Array.from({ length: 10 }, (_, i) => {
      try {
        rateLimiter.check("test-user", limit, 60000);
        return true;
      } catch {
        return false;
      }
    });

    // All 10 should succeed
    expect(results.filter(Boolean).length).toBe(10);

    // 11th should fail
    expect(() => rateLimiter.check("test-user", limit, 60000)).toThrow();
  });

  it("should reset count for specific user", () => {
    const limit = 2;

    rateLimiter.check("test-user", limit, 60000);
    rateLimiter.check("test-user", limit, 60000);

    // Should throw
    expect(() => rateLimiter.check("test-user", limit, 60000)).toThrow();

    // Reset
    rateLimiter.reset("test-user");

    // Should not throw after reset
    expect(() => rateLimiter.check("test-user", limit, 60000)).not.toThrow();
  });
});
