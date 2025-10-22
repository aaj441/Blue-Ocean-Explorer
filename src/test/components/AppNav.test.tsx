import { describe, it, expect, beforeEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppNav } from '~/components/AppNav';
import { useAuthStore } from '~/stores/authStore';

// Mock the auth store
jest.mock('~/stores/authStore', () => ({
  useAuthStore: jest.fn(),
}));

// Mock React Router
jest.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, ...props }: any) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useRouter: () => ({
    navigate: jest.fn(),
  }),
  useLocation: () => ({
    pathname: '/',
  }),
}));

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('AppNav Component', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    avatar: null,
    subscriptionTier: 'pro',
    creditBalance: 150,
  };

  const mockAuthStore = {
    user: null,
    isAuthenticated: false,
    logout: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuthStore.mockReturnValue(mockAuthStore);
  });

  describe('Unauthenticated State', () => {
    it('should render login and register links when user is not authenticated', () => {
      render(<AppNav />);

      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
      expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    });

    it('should have correct navigation links for unauthenticated users', () => {
      render(<AppNav />);

      const loginLink = screen.getByText('Login').closest('a');
      const registerLink = screen.getByText('Register').closest('a');

      expect(loginLink).toHaveAttribute('href', '/auth/login');
      expect(registerLink).toHaveAttribute('href', '/auth/register');
    });
  });

  describe('Authenticated State', () => {
    beforeEach(() => {
      mockUseAuthStore.mockReturnValue({
        ...mockAuthStore,
        user: mockUser,
        isAuthenticated: true,
      });
    });

    it('should render user navigation when authenticated', () => {
      render(<AppNav />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Markets')).toBeInTheDocument();
      expect(screen.getByText('Opportunities')).toBeInTheDocument();
      expect(screen.getByText('Boards')).toBeInTheDocument();
      expect(screen.getByText('Strategy')).toBeInTheDocument();
      expect(screen.queryByText('Login')).not.toBeInTheDocument();
      expect(screen.queryByText('Register')).not.toBeInTheDocument();
    });

    it('should display user information', () => {
      render(<AppNav />);

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('150 credits')).toBeInTheDocument();
      expect(screen.getByText('PRO')).toBeInTheDocument();
    });

    it('should have correct navigation links for authenticated users', () => {
      render(<AppNav />);

      const dashboardLink = screen.getByText('Dashboard').closest('a');
      const marketsLink = screen.getByText('Markets').closest('a');
      const opportunitiesLink = screen.getByText('Opportunities').closest('a');

      expect(dashboardLink).toHaveAttribute('href', '/dashboard');
      expect(marketsLink).toHaveAttribute('href', '/markets');
      expect(opportunitiesLink).toHaveAttribute('href', '/opportunities');
    });

    it('should show user dropdown menu on click', async () => {
      const user = userEvent.setup();
      render(<AppNav />);

      const userButton = screen.getByText('Test User');
      await user.click(userButton);

      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Logout')).toBeInTheDocument();
      });
    });

    it('should call logout function when logout is clicked', async () => {
      const user = userEvent.setup();
      render(<AppNav />);

      const userButton = screen.getByText('Test User');
      await user.click(userButton);

      const logoutButton = await screen.findByText('Logout');
      await user.click(logoutButton);

      expect(mockAuthStore.logout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Subscription Tiers', () => {
    it('should display FREE badge for free tier users', () => {
      mockUseAuthStore.mockReturnValue({
        ...mockAuthStore,
        user: { ...mockUser, subscriptionTier: 'free' },
        isAuthenticated: true,
      });

      render(<AppNav />);

      expect(screen.getByText('FREE')).toBeInTheDocument();
    });

    it('should display ENTERPRISE badge for enterprise tier users', () => {
      mockUseAuthStore.mockReturnValue({
        ...mockAuthStore,
        user: { ...mockUser, subscriptionTier: 'enterprise' },
        isAuthenticated: true,
      });

      render(<AppNav />);

      expect(screen.getByText('ENTERPRISE')).toBeInTheDocument();
    });
  });

  describe('Credit Balance Display', () => {
    it('should display credit balance with proper formatting', () => {
      mockUseAuthStore.mockReturnValue({
        ...mockAuthStore,
        user: { ...mockUser, creditBalance: 1250 },
        isAuthenticated: true,
      });

      render(<AppNav />);

      expect(screen.getByText('1,250 credits')).toBeInTheDocument();
    });

    it('should show low credit warning when balance is low', () => {
      mockUseAuthStore.mockReturnValue({
        ...mockAuthStore,
        user: { ...mockUser, creditBalance: 5 },
        isAuthenticated: true,
      });

      render(<AppNav />);

      const creditsElement = screen.getByText('5 credits');
      expect(creditsElement).toHaveClass('text-red-600'); // Assuming low balance styling
    });
  });

  describe('Mobile Navigation', () => {
    it('should show mobile menu toggle button on small screens', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      });

      render(<AppNav />);

      const mobileMenuButton = screen.getByLabelText('Open menu');
      expect(mobileMenuButton).toBeInTheDocument();
    });

    it('should toggle mobile menu when button is clicked', async () => {
      const user = userEvent.setup();
      
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      });

      mockUseAuthStore.mockReturnValue({
        ...mockAuthStore,
        user: mockUser,
        isAuthenticated: true,
      });

      render(<AppNav />);

      const mobileMenuButton = screen.getByLabelText('Open menu');
      await user.click(mobileMenuButton);

      // Mobile menu should be visible
      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeVisible();
      });
    });
  });

  describe('Active Link Highlighting', () => {
    it('should highlight active navigation link', () => {
      // Mock current location
      jest.doMock('@tanstack/react-router', () => ({
        ...jest.requireActual('@tanstack/react-router'),
        useLocation: () => ({
          pathname: '/markets',
        }),
      }));

      mockUseAuthStore.mockReturnValue({
        ...mockAuthStore,
        user: mockUser,
        isAuthenticated: true,
      });

      render(<AppNav />);

      const marketsLink = screen.getByText('Markets').closest('a');
      expect(marketsLink).toHaveClass('active'); // Assuming active link styling
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<AppNav />);

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByLabelText('Main navigation')).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      
      mockUseAuthStore.mockReturnValue({
        ...mockAuthStore,
        user: mockUser,
        isAuthenticated: true,
      });

      render(<AppNav />);

      // Tab through navigation items
      await user.tab();
      expect(screen.getByText('Dashboard')).toHaveFocus();

      await user.tab();
      expect(screen.getByText('Markets')).toHaveFocus();
    });

    it('should have proper semantic HTML structure', () => {
      render(<AppNav />);

      const nav = screen.getByRole('navigation');
      const list = nav.querySelector('ul');
      const listItems = nav.querySelectorAll('li');

      expect(list).toBeInTheDocument();
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing user data gracefully', () => {
      mockUseAuthStore.mockReturnValue({
        ...mockAuthStore,
        user: null,
        isAuthenticated: true, // Edge case: authenticated but no user data
      });

      expect(() => render(<AppNav />)).not.toThrow();
    });

    it('should handle auth store errors gracefully', () => {
      mockUseAuthStore.mockImplementation(() => {
        throw new Error('Auth store error');
      });

      expect(() => render(<AppNav />)).not.toThrow();
    });
  });
});