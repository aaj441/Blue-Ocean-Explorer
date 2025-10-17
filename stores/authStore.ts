import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type User = {
  id: number;
  email: string;
  name: string;
  role: string;
};

type AuthStore = {
  user: User | null;
  token: string | null;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setAuth: (user: User, token: string) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
      isAuthenticated: () => get().token !== null,
    }),
    {
      name: "blue-ocean-auth",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
