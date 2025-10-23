import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { jwtDecode } from "jwt-decode";

type User = {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar?: string;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
    language: string;
  };
};

type AuthState = {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isInitialized: boolean;
  lastActivity: number;
  sessionTimeout: number; // in milliseconds
};

type AuthActions = {
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  clearAuth: () => void;
  updateUser: (updates: Partial<User>) => void;
  refreshToken: () => Promise<boolean>;
  isAuthenticated: () => boolean;
  isTokenValid: () => boolean;
  isSessionExpired: () => boolean;
  updateActivity: () => void;
  initialize: () => void;
};

type AuthStore = AuthState & AuthActions;

// Token validation helper
function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwtDecode<{ exp: number }>(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
}

// Session timeout helper (30 minutes)
const SESSION_TIMEOUT = 30 * 60 * 1000;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      token: null,
      refreshToken: null,
      isInitialized: false,
      lastActivity: Date.now(),
      sessionTimeout: SESSION_TIMEOUT,

      // Actions
      setAuth: (user: User, token: string, refreshToken?: string) => {
        set({
          user,
          token,
          refreshToken: refreshToken || null,
          lastActivity: Date.now(),
        });
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          lastActivity: Date.now(),
        });
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, ...updates },
            lastActivity: Date.now(),
          });
        }
      },

      refreshToken: async () => {
        const { refreshToken, token } = get();
        
        if (!refreshToken || !token) {
          return false;
        }

        try {
          // In a real app, you'd call your refresh endpoint here
          // const response = await fetch('/api/auth/refresh', {
          //   method: 'POST',
          //   headers: { 'Authorization': `Bearer ${refreshToken}` }
          // });
          // const { token: newToken, refreshToken: newRefreshToken } = await response.json();
          
          // For now, just check if current token is still valid
          if (!isTokenExpired(token)) {
            set({ lastActivity: Date.now() });
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('Token refresh failed:', error);
          return false;
        }
      },

      isAuthenticated: () => {
        const { token, user } = get();
        return !!(token && user && !isTokenExpired(token));
      },

      isTokenValid: () => {
        const { token } = get();
        return !!(token && !isTokenExpired(token));
      },

      isSessionExpired: () => {
        const { lastActivity, sessionTimeout } = get();
        return Date.now() - lastActivity > sessionTimeout;
      },

      updateActivity: () => {
        set({ lastActivity: Date.now() });
      },

      initialize: () => {
        const { token, user, isSessionExpired } = get();
        
        if (token && user) {
          if (isTokenExpired(token) || isSessionExpired()) {
            get().clearAuth();
          } else {
            get().updateActivity();
          }
        }
        
        set({ isInitialized: true });
      },
    }),
    {
      name: "blue-ocean-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        lastActivity: state.lastActivity,
        sessionTimeout: state.sessionTimeout,
      }),
    },
  ),
);

// Auto-initialize auth store
if (typeof window !== 'undefined') {
  useAuthStore.getState().initialize();
}

// Activity tracking
if (typeof window !== 'undefined') {
  const updateActivity = () => useAuthStore.getState().updateActivity();
  
  // Track user activity
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, updateActivity, true);
  });
  
  // Check for session expiry every minute
  setInterval(() => {
    const { isSessionExpired, clearAuth } = useAuthStore.getState();
    if (isSessionExpired()) {
      clearAuth();
      // Optionally redirect to login or show session expired modal
      window.location.href = '/auth/login?expired=true';
    }
  }, 60000);
}
