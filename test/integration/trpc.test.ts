import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCallerFactory } from '~/server/trpc/main';
import { appRouter } from '~/server/trpc/root';
import { db } from '~/server/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock database
vi.mock('~/server/db', () => ({
  db: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    market: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    opportunity: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    creditBalance: {
      findUnique: vi.fn(),
    },
  },
}));

const createCaller = createCallerFactory(appRouter);
const caller = createCaller({});

describe('tRPC API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_SECRET = 'test-secret';
  });

  describe('Authentication Procedures', () => {
    it('should register a new user', async () => {
      const mockUser = {
        id: 1,
        email: 'new@example.com',
        name: 'New User',
        role: 'ANALYST',
        passwordHash: 'hashed',
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(null);
      vi.mocked(db.user.create).mockResolvedValue(mockUser as any);
      vi.spyOn(bcrypt, 'hash').mockResolvedValue('hashed' as any);
      vi.spyOn(jwt, 'sign').mockReturnValue('mock-token' as any);

      const result = await caller.register({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
        role: 'ANALYST',
      });

      expect(result.user).toMatchObject({
        email: 'new@example.com',
        name: 'New User',
        role: 'ANALYST',
      });
      expect(result.token).toBe('mock-token');
    });

    it('should login existing user', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'ANALYST',
        passwordHash: 'hashed',
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any);
      vi.spyOn(bcrypt, 'compare').mockResolvedValue(true as any);
      vi.spyOn(jwt, 'sign').mockReturnValue('mock-token' as any);

      const result = await caller.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user.email).toBe('test@example.com');
      expect(result.token).toBe('mock-token');
    });

    it('should reject login with invalid credentials', async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      await expect(
        caller.login({
          email: 'wrong@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('Market Procedures', () => {
    it('should get markets list', async () => {
      const mockMarkets = [
        {
          id: 1,
          name: 'Electric Vehicles',
          description: 'EV market analysis',
          industry: 'Automotive',
          size: 500000000000,
          growthRate: 0.25,
          userId: 1,
        },
        {
          id: 2,
          name: 'Renewable Energy',
          description: 'Renewable energy sector',
          industry: 'Energy',
          size: 1000000000000,
          growthRate: 0.15,
          userId: 1,
        },
      ];

      vi.mocked(db.market.findMany).mockResolvedValue(mockMarkets as any);

      const result = await caller.getMarkets();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Electric Vehicles');
      expect(result[1].name).toBe('Renewable Energy');
    });

    it('should create a new market', async () => {
      const newMarket = {
        id: 3,
        name: 'Quantum Computing',
        description: 'Quantum computing market',
        industry: 'Technology',
        size: 10000000000,
        growthRate: 0.5,
        userId: 1,
      };

      vi.mocked(db.market.create).mockResolvedValue(newMarket as any);

      const result = await caller.createMarket({
        name: 'Quantum Computing',
        description: 'Quantum computing market',
        industry: 'Technology',
        size: 10000000000,
        growthRate: 0.5,
        userId: 1,
      });

      expect(result.name).toBe('Quantum Computing');
      expect(result.industry).toBe('Technology');
    });
  });

  describe('Opportunities Procedures', () => {
    it('should get opportunities with filters', async () => {
      const mockOpportunities = [
        {
          id: 1,
          title: 'EV Charging Network',
          description: 'Build EV charging infrastructure',
          type: 'BLUE_OCEAN',
          status: 'IDENTIFIED',
          score: 0.85,
          potentialValue: 50000000,
          timeToMarket: 18,
          riskLevel: 'MEDIUM',
          marketId: 1,
          userId: 1,
        },
      ];

      vi.mocked(db.opportunity.findMany).mockResolvedValue(mockOpportunities as any);

      const result = await caller.getOpportunities({
        type: 'BLUE_OCEAN',
        status: 'IDENTIFIED',
      });

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('EV Charging Network');
      expect(result[0].type).toBe('BLUE_OCEAN');
    });
  });

  describe('Credit System', () => {
    it('should get user credit balance', async () => {
      const mockBalance = {
        id: 1,
        userId: 1,
        balance: 100,
        transactions: [],
      };

      vi.mocked(db.creditBalance.findUnique).mockResolvedValue(mockBalance as any);

      const result = await caller.getCreditBalance({ userId: 1 });

      expect(result.balance).toBe(100);
      expect(result.transactions).toEqual([]);
    });
  });
});