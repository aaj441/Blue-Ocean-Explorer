import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '~/server/db';
import { login } from '~/server/trpc/procedures/login';
import { env } from '~/server/env';

// Mock dependencies
jest.mock('~/server/db', () => ({
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
}));

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockDb = db as jest.Mocked<typeof db>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('login procedure', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    password: 'hashed-password',
    name: 'Test User',
    avatar: null,
    subscriptionTier: 'free',
    creditBalance: 0,
    createdAt: new Date(),
  };

  const mockContext = {
    req: {
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should successfully login with valid credentials', async () => {
    // Arrange
    const input = {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: false,
    };

    mockDb.user.findUnique.mockResolvedValue(mockUser);
    mockBcrypt.compare.mockResolvedValue(true);
    mockDb.user.update.mockResolvedValue(mockUser);
    mockJwt.sign.mockReturnValue('mock-token');

    // Act
    const result = await login({
      input,
      ctx: mockContext,
    } as any);

    // Assert
    expect(mockDb.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        avatar: true,
        subscriptionTier: true,
        creditBalance: true,
        createdAt: true,
      },
    });

    expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-password');
    
    expect(mockDb.user.update).toHaveBeenCalledWith({
      where: { id: 'user-123' },
      data: { updatedAt: expect.any(Date) },
    });

    expect(mockJwt.sign).toHaveBeenCalledWith(
      {
        userId: 'user-123',
        email: 'test@example.com',
        subscriptionTier: 'free',
      },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    expect(result).toEqual({
      user: {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: null,
        subscriptionTier: 'free',
        creditBalance: 0,
        createdAt: mockUser.createdAt,
      },
      token: 'mock-token',
      expiresIn: '7d',
    });
  });

  it('should use longer expiration when rememberMe is true', async () => {
    // Arrange
    const input = {
      email: 'test@example.com',
      password: 'password123',
      rememberMe: true,
    };

    mockDb.user.findUnique.mockResolvedValue(mockUser);
    mockBcrypt.compare.mockResolvedValue(true);
    mockDb.user.update.mockResolvedValue(mockUser);
    mockJwt.sign.mockReturnValue('mock-token');

    // Act
    await login({
      input,
      ctx: mockContext,
    } as any);

    // Assert
    expect(mockJwt.sign).toHaveBeenCalledWith(
      expect.any(Object),
      env.JWT_SECRET,
      { expiresIn: '30d' }
    );
  });

  it('should throw error when user does not exist', async () => {
    // Arrange
    const input = {
      email: 'nonexistent@example.com',
      password: 'password123',
    };

    mockDb.user.findUnique.mockResolvedValue(null);

    // Act & Assert
    await expect(
      login({
        input,
        ctx: mockContext,
      } as any)
    ).rejects.toThrow('Invalid email or password');

    expect(mockBcrypt.compare).not.toHaveBeenCalled();
    expect(mockDb.user.update).not.toHaveBeenCalled();
    expect(mockJwt.sign).not.toHaveBeenCalled();
  });

  it('should throw error when password is invalid', async () => {
    // Arrange
    const input = {
      email: 'test@example.com',
      password: 'wrongpassword',
    };

    mockDb.user.findUnique.mockResolvedValue(mockUser);
    mockBcrypt.compare.mockResolvedValue(false);

    // Act & Assert
    await expect(
      login({
        input,
        ctx: mockContext,
      } as any)
    ).rejects.toThrow('Invalid email or password');

    expect(mockDb.user.update).not.toHaveBeenCalled();
    expect(mockJwt.sign).not.toHaveBeenCalled();
  });

  it('should sanitize email input', async () => {
    // Arrange
    const input = {
      email: '  TEST@EXAMPLE.COM  ',
      password: 'password123',
    };

    mockDb.user.findUnique.mockResolvedValue(mockUser);
    mockBcrypt.compare.mockResolvedValue(true);
    mockDb.user.update.mockResolvedValue(mockUser);
    mockJwt.sign.mockReturnValue('mock-token');

    // Act
    await login({
      input,
      ctx: mockContext,
    } as any);

    // Assert
    expect(mockDb.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'test@example.com' },
      select: expect.any(Object),
    });
  });

  it('should handle database errors gracefully', async () => {
    // Arrange
    const input = {
      email: 'test@example.com',
      password: 'password123',
    };

    mockDb.user.findUnique.mockRejectedValue(new Error('Database connection failed'));

    // Act & Assert
    await expect(
      login({
        input,
        ctx: mockContext,
      } as any)
    ).rejects.toThrow('Database connection failed');
  });

  it('should validate input schema', async () => {
    // Test invalid email
    const invalidEmailInput = {
      email: 'invalid-email',
      password: 'password123',
    };

    await expect(
      login({
        input: invalidEmailInput,
        ctx: mockContext,
      } as any)
    ).rejects.toThrow();

    // Test missing password
    const missingPasswordInput = {
      email: 'test@example.com',
      password: '',
    };

    await expect(
      login({
        input: missingPasswordInput,
        ctx: mockContext,
      } as any)
    ).rejects.toThrow();
  });
});