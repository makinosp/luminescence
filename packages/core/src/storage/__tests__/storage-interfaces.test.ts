import type { ILocalSettings } from '../interfaces/local-settings.js';
import type { ISecureStorage } from '../interfaces/secure-storage.js';
import { describe, it, expect } from 'vitest';

/**
 * Contract tests for ISecureStorage implementations.
 * Platform adapters should pass these tests.
 */
export function testSecureStorageContract(factory: () => ISecureStorage): void {
  describe('ISecureStorage contract', () => {
    let storage: ISecureStorage;

    beforeEach(() => {
      storage = factory();
    });

    it('should return null for non-existent key', async () => {
      const result = await storage.getToken('non-existent-key');
      expect(result).toBeNull();
    });

    it('should store and retrieve a token', async () => {
      await storage.setToken('test-key', 'test-token-value');
      const result = await storage.getToken('test-key');
      expect(result).toBe('test-token-value');
    });

    it('should remove a token', async () => {
      await storage.setToken('test-key', 'test-token-value');
      await storage.removeToken('test-key');
      const result = await storage.getToken('test-key');
      expect(result).toBeNull();
    });

    it('should clear all tokens', async () => {
      await storage.setToken('key1', 'value1');
      await storage.setToken('key2', 'value2');
      await storage.clear();
      expect(await storage.getToken('key1')).toBeNull();
      expect(await storage.getToken('key2')).toBeNull();
    });
  });
}

/**
 * Contract tests for ILocalSettings implementations.
 * Platform adapters should pass these tests.
 */
export function testLocalSettingsContract(factory: () => ILocalSettings): void {
  describe('ILocalSettings contract', () => {
    let settings: ILocalSettings;

    beforeEach(() => {
      settings = factory();
    });

    it('should return null for non-existent key', async () => {
      const result = await settings.get('non-existent-key');
      expect(result).toBeNull();
    });

    it('should store and retrieve a setting', async () => {
      await settings.set('test-key', 'test-value');
      const result = await settings.get('test-key');
      expect(result).toBe('test-value');
    });

    it('should remove a setting', async () => {
      await settings.set('test-key', 'test-value');
      await settings.remove('test-key');
      const result = await settings.get('test-key');
      expect(result).toBeNull();
    });

    it('should clear all settings', async () => {
      await settings.set('key1', 'value1');
      await settings.set('key2', 'value2');
      await settings.clear();
      expect(await settings.get('key1')).toBeNull();
      expect(await settings.get('key2')).toBeNull();
    });
  });
}

// Verify contract test functions are callable
describe('Storage contract tests', () => {
  it('should export testSecureStorageContract', () => {
    expect(typeof testSecureStorageContract).toBe('function');
  });

  it('should export testLocalSettingsContract', () => {
    expect(typeof testLocalSettingsContract).toBe('function');
  });
});
