import { http, HttpResponse } from 'msw';

const API_URL = process.env.BASE_URL || 'http://localhost:3000';

// Mock user data
const mockUser = {
  id: 1,
  email: 'test@example.com',
  name: 'Test User',
  role: 'ANALYST',
};

const mockToken = 'mock-jwt-token';

export const handlers = [
  // Authentication endpoints
  http.post(`${API_URL}/trpc/login`, async ({ request }) => {
    const body = await request.json();
    
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        result: {
          data: {
            user: mockUser,
            token: mockToken,
          },
        },
      });
    }
    
    return HttpResponse.json(
      { error: { message: 'Invalid credentials' } },
      { status: 401 }
    );
  }),

  http.post(`${API_URL}/trpc/register`, async ({ request }) => {
    const body = await request.json();
    
    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        { error: { message: 'User already exists' } },
        { status: 409 }
      );
    }
    
    return HttpResponse.json({
      result: {
        data: {
          user: { ...mockUser, email: body.email, name: body.name },
          token: mockToken,
        },
      },
    });
  }),

  // Markets endpoints
  http.get(`${API_URL}/trpc/getMarkets`, () => {
    return HttpResponse.json({
      result: {
        data: [
          {
            id: 1,
            name: 'Electric Vehicles',
            description: 'Electric vehicle market analysis',
            industry: 'Automotive',
            size: 500000000000,
            growthRate: 0.25,
          },
          {
            id: 2,
            name: 'Renewable Energy',
            description: 'Renewable energy sector analysis',
            industry: 'Energy',
            size: 1000000000000,
            growthRate: 0.15,
          },
        ],
      },
    });
  }),

  // Opportunities endpoints
  http.get(`${API_URL}/trpc/getOpportunities`, () => {
    return HttpResponse.json({
      result: {
        data: [
          {
            id: 1,
            title: 'EV Charging Infrastructure',
            description: 'Opportunity in EV charging network expansion',
            type: 'BLUE_OCEAN',
            status: 'IDENTIFIED',
            score: 0.85,
            potentialValue: 50000000,
            timeToMarket: 18,
            riskLevel: 'MEDIUM',
          },
        ],
      },
    });
  }),

  // Credit balance
  http.get(`${API_URL}/trpc/getCreditBalance`, () => {
    return HttpResponse.json({
      result: {
        data: {
          balance: 100,
          transactions: [],
        },
      },
    });
  }),

  // Catch-all handler for unhandled requests
  http.all('*', ({ request }) => {
    console.error(`Unhandled request: ${request.method} ${request.url}`);
    return HttpResponse.json(
      { error: { message: 'Not found' } },
      { status: 404 }
    );
  }),
];