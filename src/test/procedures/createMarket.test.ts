import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { db } from '~/server/db';
import { createMarket } from '~/server/trpc/procedures/createMarket';

// Mock dependencies
jest.mock('~/server/db', () => ({
  market: {
    create: jest.fn(),
  },
}));

const mockDb = db as jest.Mocked<typeof db>;

describe('createMarket procedure', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    subscriptionTier: 'pro',
  };

  const mockContext = {
    user: mockUser,
    req: {
      ip: '127.0.0.1',
      headers: {
        'user-agent': 'test-agent',
      },
    },
  };

  const mockCreatedMarket = {
    id: 'market-123',
    name: 'Test Market',
    description: 'A test market description',
    industry: 'Technology',
    size: 'Large',
    growth: 0.15,
    trends: ['AI', 'Cloud Computing'],
    userId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    },
    _count: {
      opportunities: 0,
      competitors: 0,
      segments: 0,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should successfully create a market with valid input', async () => {
    // Arrange
    const input = {
      name: 'Test Market',
      description: 'A test market description',
      industry: 'Technology',
      size: 'Large',
      growth: 0.15,
      trends: ['AI', 'Cloud Computing'],
    };

    mockDb.market.create.mockResolvedValue(mockCreatedMarket);

    // Act
    const result = await createMarket({
      input,
      ctx: mockContext,
    } as any);

    // Assert
    expect(mockDb.market.create).toHaveBeenCalledWith({
      data: {
        name: 'Test Market',
        description: 'A test market description',
        industry: 'Technology',
        size: 'Large',
        growth: 0.15,
        trends: ['AI', 'Cloud Computing'],
        userId: 'user-123',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            opportunities: true,
            competitors: true,
            segments: true,
          },
        },
      },
    });

    expect(result).toEqual(mockCreatedMarket);
  });

  it('should create market with minimal required fields', async () => {
    // Arrange
    const input = {
      name: 'Minimal Market',
      industry: 'Healthcare',
    };

    const minimalMarket = {
      ...mockCreatedMarket,
      name: 'Minimal Market',
      industry: 'Healthcare',
      description: undefined,
      size: undefined,
      growth: undefined,
      trends: [],
    };

    mockDb.market.create.mockResolvedValue(minimalMarket);

    // Act
    const result = await createMarket({
      input,
      ctx: mockContext,
    } as any);

    // Assert
    expect(mockDb.market.create).toHaveBeenCalledWith({
      data: {
        name: 'Minimal Market',
        description: undefined,
        industry: 'Healthcare',
        size: undefined,
        growth: undefined,
        trends: [],
        userId: 'user-123',
      },
      include: expect.any(Object),
    });

    expect(result).toEqual(minimalMarket);
  });

  it('should sanitize input data', async () => {
    // Arrange
    const input = {
      name: '  Test Market  <script>alert("xss")</script>  ',
      description: 'Description with <script>malicious</script> content',
      industry: 'Technology',
    };

    mockDb.market.create.mockResolvedValue(mockCreatedMarket);

    // Act
    await createMarket({
      input,
      ctx: mockContext,
    } as any);

    // Assert
    expect(mockDb.market.create).toHaveBeenCalledWith({
      data: {
        name: 'Test Market  alert("xss")',
        description: 'Description with malicious content',
        industry: 'Technology',
        size: undefined,
        growth: undefined,
        trends: [],
        userId: 'user-123',
      },
      include: expect.any(Object),
    });
  });

  it('should validate input schema - missing required fields', async () => {
    // Test missing name
    const missingNameInput = {
      industry: 'Technology',
    };

    await expect(
      createMarket({
        input: missingNameInput,
        ctx: mockContext,
      } as any)
    ).rejects.toThrow();

    // Test missing industry
    const missingIndustryInput = {
      name: 'Test Market',
    };

    await expect(
      createMarket({
        input: missingIndustryInput,
        ctx: mockContext,
      } as any)
    ).rejects.toThrow();
  });

  it('should validate input schema - field length limits', async () => {
    // Test name too long
    const longNameInput = {
      name: 'a'.repeat(201), // Exceeds 200 character limit
      industry: 'Technology',
    };

    await expect(
      createMarket({
        input: longNameInput,
        ctx: mockContext,
      } as any)
    ).rejects.toThrow();

    // Test description too long
    const longDescriptionInput = {
      name: 'Test Market',
      description: 'a'.repeat(2001), // Exceeds 2000 character limit
      industry: 'Technology',
    };

    await expect(
      createMarket({
        input: longDescriptionInput,
        ctx: mockContext,
      } as any)
    ).rejects.toThrow();
  });

  it('should validate growth rate bounds', async () => {
    // Test negative growth below limit
    const negativeGrowthInput = {
      name: 'Test Market',
      industry: 'Technology',
      growth: -2, // Below -1 limit
    };

    await expect(
      createMarket({
        input: negativeGrowthInput,
        ctx: mockContext,
      } as any)
    ).rejects.toThrow();

    // Test growth above limit
    const highGrowthInput = {
      name: 'Test Market',
      industry: 'Technology',
      growth: 11, // Above 10 limit
    };

    await expect(
      createMarket({
        input: highGrowthInput,
        ctx: mockContext,
      } as any)
    ).rejects.toThrow();
  });

  it('should validate trends array limits', async () => {
    // Test too many trends
    const tooManyTrendsInput = {
      name: 'Test Market',
      industry: 'Technology',
      trends: Array(21).fill('trend'), // Exceeds 20 limit
    };

    await expect(
      createMarket({
        input: tooManyTrendsInput,
        ctx: mockContext,
      } as any)
    ).rejects.toThrow();
  });

  it('should handle database errors gracefully', async () => {
    // Arrange
    const input = {
      name: 'Test Market',
      industry: 'Technology',
    };

    mockDb.market.create.mockRejectedValue(new Error('Database connection failed'));

    // Act & Assert
    await expect(
      createMarket({
        input,
        ctx: mockContext,
      } as any)
    ).rejects.toThrow('Database connection failed');
  });

  it('should require authenticated user', async () => {
    // Arrange
    const input = {
      name: 'Test Market',
      industry: 'Technology',
    };

    const unauthenticatedContext = {
      ...mockContext,
      user: null,
    };

    // Act & Assert
    await expect(
      createMarket({
        input,
        ctx: unauthenticatedContext,
      } as any)
    ).rejects.toThrow();
  });
});