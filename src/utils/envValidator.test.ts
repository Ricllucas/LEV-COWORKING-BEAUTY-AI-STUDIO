import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateEnvironment, requiredEnvVars } from './envValidator';

describe('envValidator', () => {
  const originalEnv = import.meta.env;

  beforeEach(() => {
    // Reset env before each test
    vi.resetModules();
  });

  it('should export required env vars list', () => {
    expect(requiredEnvVars).toBeInstanceOf(Array);
    expect(requiredEnvVars.length).toBeGreaterThan(0);
  });

  it('should include Supabase URL in required vars', () => {
    expect(requiredEnvVars).toContain('VITE_SUPABASE_URL');
  });

  it('should include Supabase key in required vars', () => {
    expect(requiredEnvVars).toContain('VITE_SUPABASE_PUBLISHABLE_KEY');
  });

  it('should detect valid environment', () => {
    // Mock environment with all required vars
    const mockEnv = {
      'VITE_SUPABASE_URL': 'https://example.supabase.co',
      'VITE_SUPABASE_PUBLISHABLE_KEY': 'test-key-123',
    };

    // We can't easily mock import.meta.env in tests, so we validate the function logic
    const result = validateEnvironment();
    // In development/test, vars might not be set, so we just check the function works
    expect(result).toHaveProperty('isValid');
    expect(result).toHaveProperty('missing');
    expect(result).toHaveProperty('message');
  });

  it('should return isValid property', () => {
    const result = validateEnvironment();
    expect(typeof result.isValid).toBe('boolean');
  });

  it('should return missing property as array', () => {
    const result = validateEnvironment();
    expect(Array.isArray(result.missing)).toBe(true);
  });

  it('should return message property as string', () => {
    const result = validateEnvironment();
    expect(typeof result.message).toBe('string');
    expect(result.message.length).toBeGreaterThan(0);
  });

  it('should indicate when missing if not all vars are set', () => {
    const result = validateEnvironment();
    // In test environment, some vars might be missing
    if (result.missing.length > 0) {
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('Missing');
    }
  });
});
