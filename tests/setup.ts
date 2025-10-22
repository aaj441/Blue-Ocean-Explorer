import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
process.env.NODE_ENV = "development";
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only";
process.env.ADMIN_PASSWORD = "test-admin-password";
process.env.OPENROUTER_API_KEY = "test-openrouter-key";
process.env.DEFAULT_COMMISSION_RATE = "0.70";
process.env.REFERRAL_REWARD_AMOUNT = "10";

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => "mock-url");
global.URL.revokeObjectURL = vi.fn();
