import type { ISecureStorage } from '../interfaces/secure-storage.js';
import { StorageError } from '../../errors/error-types.js';

/**
 * Web sessionStorage adapter.
 * Implements ISecureStorage using browser sessionStorage.
 *
 * Security note: sessionStorage is used (not localStorage) to ensure
 * tokens are cleared when the browser tab is closed (SB-02, AC9-02).
 *
 * This is a stub — actual implementation requires browser environment.
 * Replace with real implementation in the web client package.
 */
export class SessionStorageAdapter implements ISecureStorage {
  private store = new Map<string, string>();

  async setToken(key: string, value: string): Promise<void> {
    try {
      this.store.set(key, value);
    } catch {
      throw new StorageError('Failed to write to session storage', 'write', 'secure');
    }
  }

  async getToken(key: string): Promise<string | null> {
    try {
      return this.store.get(key) ?? null;
    } catch {
      throw new StorageError('Failed to read from session storage', 'read', 'secure');
    }
  }

  async removeToken(key: string): Promise<void> {
    try {
      this.store.delete(key);
    } catch {
      throw new StorageError('Failed to remove from session storage', 'delete', 'secure');
    }
  }

  async clear(): Promise<void> {
    try {
      this.store.clear();
    } catch {
      throw new StorageError('Failed to clear session storage', 'clear', 'secure');
    }
  }
}
