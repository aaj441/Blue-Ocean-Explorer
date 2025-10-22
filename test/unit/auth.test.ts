import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authenticateUser } from '~/server/utils/auth';
import { db } from '~/server/db';
import { TRPCError } from '@trpc/server';

// Mock dependencies
vi.mock('~/server/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
    sign: vi.fn(),
  },
}));

describe('Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('authenticateUser', () => {
    it('should authenticate valid user', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'ANALYST',
      };

      const mockToken = 'valid-token';
      const mockPayload = { userId: 1 };

      vi.mocked(jwt.verify).mockReturnValue(mockPayload as any);
      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await authenticateUser(mockToken);

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, 'test-secret');
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw error for invalid token', async () => {
      const mockToken = 'invalid-token';

      vi.mocked(jwt.verify).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(authenticateUser(mockToken)).rejects.toThrow(TRPCError);
      await expect(authenticateUser(mockToken)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired token',
      });
    });

    it('should throw error when user not found', async () => {
      const mockToken = 'valid-token';
      const mockPayload = { userId: 999 };

      vi.mocked(jwt.verify).mockReturnValue(mockPayload as any);
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      await expect(authenticateUser(mockToken)).rejects.toThrow(TRPCError);
      await expect(authenticateUser(mockToken)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
        message: 'User not found',
      });
    });
  });
});

describe('Password Hashing', () => {
  it('should hash and verify passwords correctly', async () => {
    const password = 'SecurePassword123!';
    const hash = await bcrypt.hash(password, 10);

    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(20);

    const isValid = await bcrypt.compare(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await bcrypt.compare('WrongPassword', hash);
    expect(isInvalid).toBe(false);
  });
});

describe('JWT Token Generation', () => {
  it('should generate and verify JWT tokens', () => {
    const payload = { userId: 1 };
    const secret = 'test-secret';

    vi.mocked(jwt.sign).mockReturnValue('mock-token');

    const token = jwt.sign(payload, secret, { expiresIn: '30d' });

    expect(jwt.sign).toHaveBeenCalledWith(payload, secret, { expiresIn: '30d' });
    expect(token).toBe('mock-token');
  });
});