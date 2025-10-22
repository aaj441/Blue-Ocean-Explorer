import { http, HttpResponse } from 'msw';

export const handlers = [
  // Mock tRPC endpoints
  http.post('/trpc/:procedure', ({ params }) => {
    const { procedure } = params;
    
    // Mock successful responses for common procedures
    switch (procedure) {
      case 'login':
        return HttpResponse.json({
          result: {
            data: {
              user: {
                id: 'test-user-id',
                email: 'test@example.com',
                name: 'Test User',
              },
              token: 'mock-jwt-token',
            },
          },
        });
      
      case 'getMarkets':
        return HttpResponse.json({
          result: {
            data: [
              {
                id: 'market-1',
                name: 'Test Market',
                description: 'A test market',
                industry: 'Technology',
                size: 'Large',
                growth: 0.15,
              },
            ],
          },
        });
      
      case 'getOpportunities':
        return HttpResponse.json({
          result: {
            data: [
              {
                id: 'opportunity-1',
                title: 'Test Opportunity',
                description: 'A test opportunity',
                category: 'Innovation',
                priority: 'high',
                status: 'identified',
                score: 0.85,
              },
            ],
          },
        });
      
      default:
        return HttpResponse.json({
          result: {
            data: null,
          },
        });
    }
  }),

  // Mock external API calls
  http.post('https://api.openrouter.ai/api/v1/chat/completions', () => {
    return HttpResponse.json({
      choices: [
        {
          message: {
            content: 'Mock AI response for testing',
          },
        },
      ],
    });
  }),

  // Mock Stripe API
  http.post('https://api.stripe.com/v1/payment_intents', () => {
    return HttpResponse.json({
      id: 'pi_mock_payment_intent',
      client_secret: 'pi_mock_client_secret',
      status: 'requires_payment_method',
    });
  }),
];