/**
 * Analytics Opt-Out Persistence Tests
 * Verifies that user preference persists across sessions via localStorage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock PostHog before importing analytics
vi.mock('posthog-js', () => ({
  default: {
    init: vi.fn(),
    capture: vi.fn(),
    identify: vi.fn(),
    reset: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
    people: { set: vi.fn() },
  },
}));

// Mock localStorage for Node environment
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (i: number) => Object.keys(store)[i] ?? null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

// Import after mocks are set up
import { isAnalyticsEnabled, setAnalyticsEnabled } from '../analytics';

describe('Analytics Opt-Out Persistence', () => {
  const STORAGE_KEY = 'aspiral_analytics_enabled';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  it('defaults to enabled when no preference is set', () => {
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(isAnalyticsEnabled()).toBe(true);
  });

  it('persists opt-out preference to localStorage', () => {
    setAnalyticsEnabled(false);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false');
  });

  it('persists opt-in preference to localStorage', () => {
    setAnalyticsEnabled(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true');
  });

  it('reads persisted opt-out preference correctly', () => {
    localStorage.setItem(STORAGE_KEY, 'false');
    expect(isAnalyticsEnabled()).toBe(false);
  });

  it('reads persisted opt-in preference correctly', () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    expect(isAnalyticsEnabled()).toBe(true);
  });

  it('survives simulated session restart (localStorage persistence)', () => {
    // User opts out
    setAnalyticsEnabled(false);
    expect(isAnalyticsEnabled()).toBe(false);

    // Simulate "new session" by clearing module state but keeping localStorage
    // In real app, this is a page refresh
    const storedValue = localStorage.getItem(STORAGE_KEY);

    // Verify localStorage still has the value
    expect(storedValue).toBe('false');

    // Function should read from localStorage
    expect(isAnalyticsEnabled()).toBe(false);
  });

  it('allows toggling preference multiple times', () => {
    expect(isAnalyticsEnabled()).toBe(true); // default

    setAnalyticsEnabled(false);
    expect(isAnalyticsEnabled()).toBe(false);

    setAnalyticsEnabled(true);
    expect(isAnalyticsEnabled()).toBe(true);

    setAnalyticsEnabled(false);
    expect(isAnalyticsEnabled()).toBe(false);
  });

  it('handles localStorage unavailable gracefully', () => {
    // Mock localStorage to throw
    const originalGetItem = localStorageMock.getItem;
    localStorageMock.getItem = () => {
      throw new Error('localStorage unavailable');
    };

    // Should default to true (enabled) when localStorage fails
    expect(isAnalyticsEnabled()).toBe(true);

    // Restore
    localStorageMock.getItem = originalGetItem;
  });
});
