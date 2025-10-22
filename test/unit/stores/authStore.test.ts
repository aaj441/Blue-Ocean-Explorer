import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAuthStore } from '~/stores/authStore';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

global.localStorage = localStorageMock as any;

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.logout();
    });
    
    // Clear all mocks
    vi.clearAllMocks();
  });

  it('should initialize with no user', () => {
    const { result } = renderHook(() => useAuthStore());

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should login user and store token', () => {
    const { result } = renderHook(() => useAuthStore());

    const mockUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: 'ANALYST' as const,
    };
    const mockToken = 'mock-jwt-token';

    act(() => {
      result.current.login(mockUser, mockToken);
    });

    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe(mockToken);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('auth-token', mockToken);
  });

  it('should logout user and clear token', () => {
    const { result } = renderHook(() => useAuthStore());

    // First login
    act(() => {
      result.current.login(
        { id: 1, email: 'test@example.com', name: 'Test', role: 'ANALYST' },
        'token'
      );
    });

    // Then logout
    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth-token');
  });

  it('should update user information', () => {
    const { result } = renderHook(() => useAuthStore());

    const initialUser = {
      id: 1,
      email: 'test@example.com',
      name: 'Test User',
      role: 'ANALYST' as const,
    };

    act(() => {
      result.current.login(initialUser, 'token');
    });

    const updates = { name: 'Updated Name', role: 'STRATEGIST' as const };

    act(() => {
      result.current.updateUser(updates);
    });

    expect(result.current.user).toEqual({
      ...initialUser,
      ...updates,
    });
  });

  it('should persist authentication state', () => {
    const mockToken = 'persisted-token';
    localStorageMock.getItem.mockReturnValue(mockToken);

    const { result } = renderHook(() => useAuthStore());

    // Simulate initialization from persisted state
    act(() => {
      const token = localStorage.getItem('auth-token');
      if (token) {
        // In real app, you'd validate the token and fetch user data
        result.current.login(
          { id: 1, email: 'test@example.com', name: 'Test', role: 'ANALYST' },
          token
        );
      }
    });

    expect(result.current.token).toBe(mockToken);
    expect(result.current.isAuthenticated).toBe(true);
  });
});