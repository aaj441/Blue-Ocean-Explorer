import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createTRPCMsw } from 'msw-trpc';
import { setupServer } from 'msw/node';
import { appRouter } from '~/server/trpc/root';
import { db } from '~/server/db';
import bcrypt from 'bcryptjs';

// Create tRPC MSW handlers
const trpcMsw = createTRPCMsw(appRouter);

// Setup MSW server
const server = setupServer();

describe('Authentication Integration Tests', () => {
  beforeAll(() => {
    server.listen();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    server.resetHandlers();
    jest.clearAllMocks();
  });

  describe('User Registration and Login Flow', () => {
    const testUser = {
      email: 'integration@test.com',
      password: 'TestPassword123!',
      name: 'Integration Test User',
    };

    it('should complete full registration and login flow', async () => {
      // Mock database calls for registration
      const hashedPassword = await bcrypt.hash(testUser.password, 12);
      const createdUser = {
        id: 'user-integration-123',
        email: testUser.email,
        password: hashedPassword,
        name: testUser.name,
        avatar: null,
        subscriptionTier: 'free',
        creditBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Mock user creation
      jest.spyOn(db.user, 'findUnique').mockResolvedValue(null); // User doesn't exist
      jest.spyOn(db.user, 'create').mockResolvedValue(createdUser);

      // Test registration
      const caller = appRouter.createCaller({
        req: { ip: '127.0.0.1', headers: {} },
        res: {},
      });

      const registrationResult = await caller.register({
        email: testUser.email,
        password: testUser.password,
        name: testUser.name,
        acceptTerms: true,
      });

      expect(registrationResult).toMatchObject({
        user: {
          id: expect.any(String),
          email: testUser.email,
          name: testUser.name,
          subscriptionTier: 'free',
        },
        token: expect.any(String),
      });

      // Mock user lookup for login
      jest.spyOn(db.user, 'findUnique').mockResolvedValue(createdUser);
      jest.spyOn(db.user, 'update').mockResolvedValue(createdUser);

      // Test login with created user
      const loginResult = await caller.login({
        email: testUser.email,
        password: testUser.password,
      });

      expect(loginResult).toMatchObject({
        user: {
          id: createdUser.id,
          email: testUser.email,
          name: testUser.name,
        },
        token: expect.any(String),
        expiresIn: '7d',
      });
    });

    it('should prevent duplicate user registration', async () => {
      // Mock existing user
      const existingUser = {
        id: 'existing-user-123',
        email: testUser.email,
        password: 'hashed-password',
        name: 'Existing User',
        subscriptionTier: 'free',
        creditBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(db.user, 'findUnique').mockResolvedValue(existingUser);

      const caller = appRouter.createCaller({
        req: { ip: '127.0.0.1', headers: {} },
        res: {},
      });

      await expect(
        caller.register({
          email: testUser.email,
          password: testUser.password,
          name: testUser.name,
          acceptTerms: true,
        })
      ).rejects.toThrow('User already exists');
    });

    it('should handle invalid login credentials', async () => {
      jest.spyOn(db.user, 'findUnique').mockResolvedValue(null);

      const caller = appRouter.createCaller({
        req: { ip: '127.0.0.1', headers: {} },
        res: {},
      });

      await expect(
        caller.login({
          email: 'nonexistent@test.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('Protected Route Access', () => {
    const mockUser = {
      id: 'auth-user-123',
      email: 'auth@test.com',
      name: 'Auth Test User',
      subscriptionTier: 'pro',
      creditBalance: 100,
    };

    it('should allow access to protected routes with valid token', async () => {
      // Mock authentication
      jest.spyOn(db.user, 'findUnique').mockResolvedValue({
        ...mockUser,
        password: 'hashed-password',
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Mock market creation
      const mockMarket = {
        id: 'market-123',
        name: 'Test Market',
        description: 'Test Description',
        industry: 'Technology',
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
        _count: {
          opportunities: 0,
          competitors: 0,
          segments: 0,
        },
      };

      jest.spyOn(db.market, 'create').mockResolvedValue(mockMarket);

      const caller = appRouter.createCaller({
        req: { 
          ip: '127.0.0.1', 
          headers: { authorization: 'Bearer valid-token' } 
        },
        res: {},
        user: mockUser,
      });

      const result = await caller.createMarket({
        name: 'Test Market',
        industry: 'Technology',
      });

      expect(result).toMatchObject({
        id: expect.any(String),
        name: 'Test Market',
        industry: 'Technology',
        userId: mockUser.id,
      });
    });

    it('should deny access to protected routes without token', async () => {
      const caller = appRouter.createCaller({
        req: { ip: '127.0.0.1', headers: {} },
        res: {},
      });

      await expect(
        caller.createMarket({
          name: 'Test Market',
          industry: 'Technology',
        })
      ).rejects.toThrow('Authentication token required');
    });

    it('should deny access with invalid token', async () => {
      const caller = appRouter.createCaller({
        req: { 
          ip: '127.0.0.1', 
          headers: { authorization: 'Bearer invalid-token' } 
        },
        res: {},
      });

      await expect(
        caller.createMarket({
          name: 'Test Market',
          industry: 'Technology',
        })
      ).rejects.toThrow('Invalid or expired token');
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits on login attempts', async () => {
      jest.spyOn(db.user, 'findUnique').mockResolvedValue(null);

      const caller = appRouter.createCaller({
        req: { ip: '127.0.0.1', headers: {} },
        res: {},
      });

      // Make multiple failed login attempts
      const loginAttempts = Array(101).fill(null).map(() =>
        caller.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        }).catch(err => err)
      );

      const results = await Promise.all(loginAttempts);
      
      // Should have some rate limit errors
      const rateLimitErrors = results.filter(result => 
        result instanceof Error && result.message.includes('rate limit')
      );

      expect(rateLimitErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should sanitize malicious input', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        subscriptionTier: 'pro',
        creditBalance: 100,
      };

      jest.spyOn(db.market, 'create').mockResolvedValue({
        id: 'market-123',
        name: 'Sanitized Market Name',
        description: 'Sanitized description',
        industry: 'Technology',
        userId: mockUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        user: mockUser,
        _count: { opportunities: 0, competitors: 0, segments: 0 },
      });

      const caller = appRouter.createCaller({
        req: { 
          ip: '127.0.0.1', 
          headers: { authorization: 'Bearer valid-token' } 
        },
        res: {},
        user: mockUser,
      });

      const result = await caller.createMarket({
        name: '<script>alert("xss")</script>Malicious Market',
        description: 'Description with <script>malicious</script> content',
        industry: 'Technology',
      });

      // Verify that the input was sanitized
      expect(db.market.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: expect.not.stringContaining('<script>'),
          description: expect.not.stringContaining('<script>'),
        }),
        include: expect.any(Object),
      });
    });

    it('should validate input schemas strictly', async () => {
      const caller = appRouter.createCaller({
        req: { ip: '127.0.0.1', headers: {} },
        res: {},
      });

      // Test invalid email format
      await expect(
        caller.login({
          email: 'invalid-email-format',
          password: 'password123',
        })
      ).rejects.toThrow();

      // Test weak password
      await expect(
        caller.register({
          email: 'test@example.com',
          password: 'weak',
          name: 'Test User',
          acceptTerms: true,
        })
      ).rejects.toThrow();
    });
  });
});