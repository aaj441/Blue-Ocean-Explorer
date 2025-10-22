import { faker } from '@faker-js/faker';

// User fixtures
export const createMockUser = (overrides = {}) => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  email: faker.internet.email(),
  name: faker.person.fullName(),
  role: faker.helpers.arrayElement(['ANALYST', 'STRATEGIST', 'EXECUTIVE']),
  lastLogin: faker.date.recent(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Market fixtures
export const createMockMarket = (overrides = {}) => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: faker.company.name(),
  description: faker.lorem.paragraph(),
  industry: faker.helpers.arrayElement(['Technology', 'Healthcare', 'Finance', 'Retail', 'Energy']),
  size: faker.number.float({ min: 1000000, max: 1000000000000 }),
  growthRate: faker.number.float({ min: -0.1, max: 0.5, precision: 0.01 }),
  userId: faker.number.int({ min: 1, max: 100 }),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Opportunity fixtures
export const createMockOpportunity = (overrides = {}) => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  title: faker.company.catchPhrase(),
  description: faker.lorem.paragraph(),
  type: faker.helpers.arrayElement(['BLUE_OCEAN', 'MARKET_GAP', 'DISRUPTION', 'INNOVATION', 'PARTNERSHIP', 'EXPANSION']),
  status: faker.helpers.arrayElement(['IDENTIFIED', 'EVALUATING', 'VALIDATED', 'PURSUING', 'IMPLEMENTED', 'ARCHIVED']),
  score: faker.number.float({ min: 0, max: 1, precision: 0.01 }),
  potentialValue: faker.number.float({ min: 10000, max: 100000000 }),
  timeToMarket: faker.number.int({ min: 1, max: 60 }),
  riskLevel: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  marketId: faker.number.int({ min: 1, max: 100 }),
  segmentId: faker.number.int({ min: 1, max: 100 }),
  userId: faker.number.int({ min: 1, max: 100 }),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Segment fixtures
export const createMockSegment = (overrides = {}) => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: faker.commerce.department(),
  description: faker.lorem.paragraph(),
  size: faker.number.float({ min: 1000000, max: 1000000000 }),
  growthRate: faker.number.float({ min: -0.1, max: 0.3, precision: 0.01 }),
  characteristics: {
    demographics: faker.helpers.arrayElements(['Young Adults', 'Families', 'Seniors', 'Professionals'], 2),
    psychographics: faker.helpers.arrayElements(['Tech-savvy', 'Price-conscious', 'Quality-focused', 'Eco-friendly'], 2),
  },
  marketId: faker.number.int({ min: 1, max: 100 }),
  userId: faker.number.int({ min: 1, max: 100 }),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Board fixtures
export const createMockBoard = (overrides = {}) => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: faker.lorem.words(3),
  description: faker.lorem.sentence(),
  type: faker.helpers.arrayElement(['GENERAL', 'STRATEGIC', 'INNOVATION', 'MARKET_ANALYSIS', 'COMPETITIVE']),
  userId: faker.number.int({ min: 1, max: 100 }),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Scenario fixtures
export const createMockScenario = (overrides = {}) => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: faker.lorem.words(3),
  description: faker.lorem.paragraph(),
  assumptions: {
    marketGrowth: faker.number.float({ min: 0, max: 0.3, precision: 0.01 }),
    competitorEntry: faker.datatype.boolean(),
    regulatoryChange: faker.datatype.boolean(),
  },
  outcomes: {
    revenue: faker.number.float({ min: 1000000, max: 100000000 }),
    marketShare: faker.number.float({ min: 0, max: 0.5, precision: 0.01 }),
    profitability: faker.number.float({ min: -0.1, max: 0.3, precision: 0.01 }),
  },
  probability: faker.number.float({ min: 0, max: 1, precision: 0.01 }),
  impact: faker.number.float({ min: 0, max: 1, precision: 0.01 }),
  opportunityId: faker.number.int({ min: 1, max: 100 }),
  userId: faker.number.int({ min: 1, max: 100 }),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Trend fixtures
export const createMockTrend = (overrides = {}) => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  name: faker.lorem.words(3),
  description: faker.lorem.paragraph(),
  category: faker.helpers.arrayElement(['Technology', 'Social', 'Economic', 'Environmental', 'Political']),
  impact: faker.number.float({ min: 0, max: 1, precision: 0.01 }),
  timeframe: faker.helpers.arrayElement(['Short-term', 'Medium-term', 'Long-term']),
  marketId: faker.number.int({ min: 1, max: 100 }),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Challenge fixtures
export const createMockChallenge = (overrides = {}) => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  title: faker.lorem.sentence(),
  description: faker.lorem.paragraph(),
  criteria: {
    innovation: 0.3,
    feasibility: 0.3,
    impact: 0.4,
  },
  prize: faker.number.float({ min: 1000, max: 50000 }),
  deadline: faker.date.future(),
  status: faker.helpers.arrayElement(['DRAFT', 'OPEN', 'EVALUATING', 'COMPLETED', 'CANCELLED']),
  userId: faker.number.int({ min: 1, max: 100 }),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});

// Marketplace listing fixtures
export const createMockListing = (overrides = {}) => ({
  id: faker.number.int({ min: 1, max: 1000 }),
  title: faker.commerce.productName(),
  description: faker.lorem.paragraph(),
  category: faker.helpers.arrayElement(['MARKET_REPORT', 'STRATEGY_TEMPLATE', 'DATA_SET', 'ANALYSIS_TOOL', 'COURSE', 'CONSULTATION']),
  price: faker.number.float({ min: 10, max: 1000, precision: 0.01 }),
  files: [faker.system.fileName()],
  previewImages: [faker.image.url()],
  userId: faker.number.int({ min: 1, max: 100 }),
  status: faker.helpers.arrayElement(['DRAFT', 'ACTIVE', 'PAUSED', 'SOLD_OUT', 'ARCHIVED']),
  featured: faker.datatype.boolean(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  ...overrides,
});