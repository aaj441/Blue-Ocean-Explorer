import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";

// Mock the database
vi.mock("~/server/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock env
vi.mock("~/server/env", () => ({
  env: {
    JWT_SECRET: "test-secret",
  },
}));

describe("authenticateUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should authenticate a valid user with valid token", async () => {
    const { authenticateUser } = await import("~/server/utils/auth");
    const { db } = await import("~/server/db");

    const mockUser = {
      id: 1,
      email: "test@example.com",
      name: "Test User",
      role: "analyst" as const,
    };

    const token = jwt.sign({ userId: 1 }, "test-secret");

    vi.mocked(db.user.findUnique).mockResolvedValueOnce({
      ...mockUser,
      passwordHash: "hash",
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const result = await authenticateUser(token);

    expect(result).toBeDefined();
    expect(result.id).toBe(1);
    expect(result.email).toBe("test@example.com");
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
    });
  });

  it("should throw UNAUTHORIZED error for invalid token", async () => {
    const { authenticateUser } = await import("~/server/utils/auth");

    await expect(authenticateUser("invalid-token")).rejects.toThrow(TRPCError);
    await expect(authenticateUser("invalid-token")).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
    });
  });

  it("should throw UNAUTHORIZED error when user not found", async () => {
    const { authenticateUser } = await import("~/server/utils/auth");
    const { db } = await import("~/server/db");

    const token = jwt.sign({ userId: 999 }, "test-secret");

    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);

    await expect(authenticateUser(token)).rejects.toThrow(TRPCError);
    await expect(authenticateUser(token)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
      message: "User not found",
    });
  });

  it("should throw UNAUTHORIZED error for expired token", async () => {
    const { authenticateUser } = await import("~/server/utils/auth");

    const expiredToken = jwt.sign({ userId: 1 }, "test-secret", {
      expiresIn: "-1h",
    });

    await expect(authenticateUser(expiredToken)).rejects.toThrow(TRPCError);
    await expect(authenticateUser(expiredToken)).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("should throw UNAUTHORIZED error for malformed token payload", async () => {
    const { authenticateUser } = await import("~/server/utils/auth");

    const malformedToken = jwt.sign({ wrongField: "value" }, "test-secret");

    await expect(authenticateUser(malformedToken)).rejects.toThrow(TRPCError);
  });
});
