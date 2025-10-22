import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { TRPCError } from "@trpc/server";

// Mock the database
vi.mock("~/server/db", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("~/server/env", () => ({
  env: {
    JWT_SECRET: "test-secret",
  },
}));

describe("Login Procedure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully log in a user with valid credentials", async () => {
    const { login } = await import("~/server/trpc/procedures/login");
    const { db } = await import("~/server/db");

    const mockUser = {
      id: 1,
      email: "test@example.com",
      name: "Test User",
      role: "analyst" as const,
      passwordHash: await bcrypt.hash("password123", 10),
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.user.findUnique).mockResolvedValueOnce(mockUser as any);
    vi.mocked(db.user.update).mockResolvedValueOnce(mockUser as any);

    const caller = login._def.mutation as any;
    const result = await caller({
      input: {
        email: "test@example.com",
        password: "password123",
      },
    });

    expect(result).toBeDefined();
    expect(result.user.email).toBe("test@example.com");
    expect(result.token).toBeDefined();
    expect(db.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { lastLogin: expect.any(Date) },
    });
  });

  it("should throw UNAUTHORIZED for non-existent user", async () => {
    const { login } = await import("~/server/trpc/procedures/login");
    const { db } = await import("~/server/db");

    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);

    const caller = login._def.mutation as any;

    await expect(
      caller({
        input: {
          email: "nonexistent@example.com",
          password: "password123",
        },
      }),
    ).rejects.toThrow(TRPCError);
  });

  it("should throw UNAUTHORIZED for invalid password", async () => {
    const { login } = await import("~/server/trpc/procedures/login");
    const { db } = await import("~/server/db");

    const mockUser = {
      id: 1,
      email: "test@example.com",
      passwordHash: await bcrypt.hash("correctpassword", 10),
      name: "Test User",
      role: "analyst" as const,
    };

    vi.mocked(db.user.findUnique).mockResolvedValueOnce(mockUser as any);

    const caller = login._def.mutation as any;

    await expect(
      caller({
        input: {
          email: "test@example.com",
          password: "wrongpassword",
        },
      }),
    ).rejects.toThrow(TRPCError);
  });

  it("should validate email format", async () => {
    const { login } = await import("~/server/trpc/procedures/login");

    const caller = login._def.mutation as any;

    await expect(
      caller({
        input: {
          email: "invalid-email",
          password: "password123",
        },
      }),
    ).rejects.toThrow();
  });
});

describe("Register Procedure", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully register a new user", async () => {
    const { register } = await import("~/server/trpc/procedures/register");
    const { db } = await import("~/server/db");

    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);

    const newUser = {
      id: 1,
      email: "newuser@example.com",
      name: "New User",
      role: "analyst" as const,
      passwordHash: "hashedpassword",
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.user.create).mockResolvedValueOnce(newUser as any);

    const caller = register._def.mutation as any;
    const result = await caller({
      input: {
        email: "newuser@example.com",
        password: "password123",
        name: "New User",
        role: "analyst",
      },
    });

    expect(result).toBeDefined();
    expect(result.user.email).toBe("newuser@example.com");
    expect(result.token).toBeDefined();
    expect(db.user.create).toHaveBeenCalled();
  });

  it("should throw CONFLICT error for existing email", async () => {
    const { register } = await import("~/server/trpc/procedures/register");
    const { db } = await import("~/server/db");

    const existingUser = {
      id: 1,
      email: "existing@example.com",
      name: "Existing User",
    };

    vi.mocked(db.user.findUnique).mockResolvedValueOnce(existingUser as any);

    const caller = register._def.mutation as any;

    await expect(
      caller({
        input: {
          email: "existing@example.com",
          password: "password123",
          name: "New User",
        },
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      message: "User with this email already exists",
    });
  });

  it("should validate password length", async () => {
    const { register } = await import("~/server/trpc/procedures/register");

    const caller = register._def.mutation as any;

    await expect(
      caller({
        input: {
          email: "test@example.com",
          password: "short",
          name: "Test User",
        },
      }),
    ).rejects.toThrow();
  });

  it("should validate email format", async () => {
    const { register } = await import("~/server/trpc/procedures/register");

    const caller = register._def.mutation as any;

    await expect(
      caller({
        input: {
          email: "invalid-email",
          password: "password123",
          name: "Test User",
        },
      }),
    ).rejects.toThrow();
  });

  it("should require name", async () => {
    const { register } = await import("~/server/trpc/procedures/register");

    const caller = register._def.mutation as any;

    await expect(
      caller({
        input: {
          email: "test@example.com",
          password: "password123",
          name: "",
        },
      }),
    ).rejects.toThrow();
  });

  it("should hash password before storing", async () => {
    const { register } = await import("~/server/trpc/procedures/register");
    const { db } = await import("~/server/db");

    vi.mocked(db.user.findUnique).mockResolvedValueOnce(null);
    vi.mocked(db.user.create).mockResolvedValueOnce({
      id: 1,
      email: "test@example.com",
      name: "Test",
      role: "analyst",
      passwordHash: "hashed",
    } as any);

    const caller = register._def.mutation as any;
    await caller({
      input: {
        email: "test@example.com",
        password: "plainpassword",
        name: "Test",
      },
    });

    const createCall = vi.mocked(db.user.create).mock.calls[0]?.[0];
    expect(createCall?.data.passwordHash).not.toBe("plainpassword");
    expect(createCall?.data.passwordHash).toBeDefined();
  });
});
