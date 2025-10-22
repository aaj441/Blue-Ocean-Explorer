import { z } from 'zod';
import { emailSchema, passwordSchema } from './security';

/**
 * Common validation schemas
 */

// Base schemas
export const idSchema = z.string().cuid('Invalid ID format');
export const uuidSchema = z.string().uuid('Invalid UUID format');
export const slugSchema = z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format');
export const urlSchema = z.string().url('Invalid URL format');
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number');

// Pagination
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Search and filtering
export const searchSchema = z.object({
  query: z.string().min(1).max(200).optional(),
  filters: z.record(z.any()).optional(),
});

/**
 * Authentication schemas
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  acceptTerms: z.boolean().refine(val => val === true, 'You must accept the terms and conditions'),
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * User schemas
 */
export const updateUserProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar: z.string().url().optional(),
  bio: z.string().max(500).optional(),
});

export const userPreferencesSchema = z.object({
  emailNotifications: z.boolean().default(true),
  pushNotifications: z.boolean().default(true),
  marketingEmails: z.boolean().default(false),
  theme: z.enum(['light', 'dark', 'auto']).default('light'),
  language: z.string().length(2).default('en'),
  timezone: z.string().default('UTC'),
  aiInsightsEnabled: z.boolean().default(true),
  autoGenerateReports: z.boolean().default(false),
});

/**
 * Market schemas
 */
export const createMarketSchema = z.object({
  name: z.string().min(1, 'Market name is required').max(200, 'Market name is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
  industry: z.string().min(1, 'Industry is required').max(100, 'Industry name is too long'),
  size: z.string().max(50).optional(),
  growth: z.number().min(-1).max(10).optional(), // -100% to 1000% growth
  trends: z.array(z.string()).max(20).optional(),
});

export const updateMarketSchema = createMarketSchema.partial();

/**
 * Opportunity schemas
 */
export const createOpportunitySchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description is too long'),
  category: z.string().min(1, 'Category is required').max(100),
  priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  status: z.enum(['identified', 'analyzing', 'validated', 'pursuing', 'completed']).default('identified'),
  potential: z.number().min(0).max(1).optional(), // 0-1 scale
  difficulty: z.number().min(0).max(1).optional(), // 0-1 scale
  timeframe: z.string().max(100).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  marketId: idSchema,
});

export const updateOpportunitySchema = createOpportunitySchema.partial().omit({ marketId: true });

export const scoreOpportunitySchema = z.object({
  opportunityId: idSchema,
  score: z.number().min(0).max(1),
  criteria: z.record(z.number().min(0).max(1)).optional(),
});

/**
 * Competitor schemas
 */
export const createCompetitorSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
  strengths: z.array(z.string().max(200)).max(20).default([]),
  weaknesses: z.array(z.string().max(200)).max(20).default([]),
  marketShare: z.number().min(0).max(1).optional(), // 0-100%
  revenue: z.number().min(0).optional(),
  website: urlSchema.optional(),
  marketId: idSchema,
});

export const updateCompetitorSchema = createCompetitorSchema.partial().omit({ marketId: true });

/**
 * Segment schemas
 */
export const createSegmentSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
  size: z.number().int().min(0).optional(),
  needs: z.array(z.string().max(200)).max(20).default([]),
  painPoints: z.array(z.string().max(200)).max(20).default([]),
  demographics: z.record(z.any()).optional(),
  psychographics: z.record(z.any()).optional(),
  marketId: idSchema,
});

export const updateSegmentSchema = createSegmentSchema.partial().omit({ marketId: true });

/**
 * Board schemas
 */
export const createBoardSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  isPublic: z.boolean().default(false),
});

export const updateBoardSchema = createBoardSchema.partial();

export const addOpportunityToBoardSchema = z.object({
  boardId: idSchema,
  opportunityId: idSchema,
  position: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * Radar schemas
 */
export const createRadarSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
  criteria: z.record(z.object({
    weight: z.number().min(0).max(1),
    threshold: z.number().min(0).max(1),
  })),
  isActive: z.boolean().default(true),
});

export const updateRadarSchema = createRadarSchema.partial();

/**
 * Strategy session schemas
 */
export const createStrategySessionSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(2000).optional(),
  context: z.record(z.any()).optional(),
});

export const updateStrategySessionSchema = createStrategySessionSchema.partial();

export const chatMessageSchema = z.object({
  sessionId: idSchema,
  message: z.string().min(1, 'Message is required').max(5000),
  context: z.record(z.any()).optional(),
});

/**
 * Scenario schemas
 */
export const createScenarioSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  assumptions: z.record(z.any()),
  probability: z.number().min(0).max(1).optional(),
  impact: z.number().min(0).max(1).optional(),
  timeframe: z.string().max(100).optional(),
  opportunityId: idSchema,
});

export const updateScenarioSchema = createScenarioSchema.partial().omit({ opportunityId: true });

export const simulateScenarioSchema = z.object({
  scenarioId: idSchema,
  parameters: z.record(z.any()),
});

/**
 * Blue Ocean Canvas schemas
 */
export const createBlueOceanCanvasSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
  eliminate: z.array(z.string().max(200)).max(20).default([]),
  reduce: z.array(z.string().max(200)).max(20).default([]),
  raise: z.array(z.string().max(200)).max(20).default([]),
  create: z.array(z.string().max(200)).max(20).default([]),
});

export const updateBlueOceanCanvasSchema = createBlueOceanCanvasSchema.partial();

/**
 * Marketplace schemas
 */
export const createMarketplaceListingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000),
  category: z.string().min(1, 'Category is required').max(100),
  price: z.number().min(0, 'Price must be positive'),
  currency: z.string().length(3).default('USD'),
  type: z.enum(['template', 'strategy', 'analysis', 'tool', 'data']),
  content: z.record(z.any()),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export const updateMarketplaceListingSchema = createMarketplaceListingSchema.partial();

export const createMarketplaceReviewSchema = z.object({
  listingId: idSchema,
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const purchaseMarketplaceListingSchema = z.object({
  listingId: idSchema,
  paymentMethodId: z.string().optional(),
});

/**
 * Challenge schemas
 */
export const submitChallengeSchema = z.object({
  challengeId: idSchema,
  content: z.record(z.any()),
});

export const voteOnSubmissionSchema = z.object({
  submissionId: idSchema,
  type: z.enum(['upvote', 'downvote']),
});

/**
 * Problem schemas
 */
export const createProblemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  category: z.string().min(1, 'Category is required').max(100),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  bounty: z.number().int().min(0).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
});

export const createProblemSolutionSchema = z.object({
  problemId: idSchema,
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000),
  implementation: z.record(z.any()).optional(),
});

/**
 * Crowdfunded idea schemas
 */
export const createCrowdfundedIdeaSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(100, 'Description must be at least 100 characters').max(10000),
  category: z.string().min(1, 'Category is required').max(100),
  targetAmount: z.number().min(1, 'Target amount must be positive'),
  currency: z.string().length(3).default('USD'),
  deadline: z.date().min(new Date(), 'Deadline must be in the future'),
  rewards: z.record(z.any()).optional(),
});

/**
 * Ecosystem schemas
 */
export const createEcosystemSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['business', 'innovation', 'market', 'technology', 'social']),
  stakeholders: z.record(z.any()),
  relationships: z.record(z.any()),
  dynamics: z.record(z.any()).optional(),
});

/**
 * Payment schemas
 */
export const createPaymentIntentSchema = z.object({
  amount: z.number().min(1, 'Amount must be positive'),
  currency: z.string().length(3).default('USD'),
  type: z.enum(['credits', 'subscription', 'marketplace']),
  metadata: z.record(z.any()).optional(),
});

export const purchaseCreditsSchema = z.object({
  amount: z.number().int().min(1, 'Must purchase at least 1 credit'),
  paymentMethodId: z.string().optional(),
});

/**
 * File upload schemas
 */
export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mimetype: z.string(),
  size: z.number().max(10 * 1024 * 1024), // 10MB max
});

/**
 * AI generation schemas
 */
export const generateVibeCheckSchema = z.object({
  marketId: idSchema,
  focus: z.enum(['opportunities', 'threats', 'trends', 'overall']).default('overall'),
});

export const generatePitchDeckSchema = z.object({
  opportunityId: idSchema,
  template: z.enum(['standard', 'investor', 'internal', 'brief']).default('standard'),
  sections: z.array(z.string()).optional(),
});

export const analyzeTrendIntersectionsSchema = z.object({
  trends: z.array(z.string().max(100)).min(2).max(10),
  timeframe: z.enum(['short', 'medium', 'long']).default('medium'),
});

/**
 * Validation middleware for tRPC
 */
export function createValidationMiddleware<T extends z.ZodSchema>(schema: T) {
  return (opts: any) => {
    try {
      const validatedInput = schema.parse(opts.input);
      return opts.next({
        ctx: opts.ctx,
        input: validatedInput,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.errors
          .map(err => `${err.path.join('.')}: ${err.message}`)
          .join(', ');
        throw new Error(`Validation error: ${message}`);
      }
      throw error;
    }
  };
}