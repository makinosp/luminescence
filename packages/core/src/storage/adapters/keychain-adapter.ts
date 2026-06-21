import type { ISecureStorage } from '../interfaces/secure-storage.js';
import { StorageError } from '../../errors/error-types.js';

/**
 * iOS Keychain adapter stub.
 * Implements ISecureStorage using iOS Keychain Services.
 *
 * This is a stub — actual implementation requires React Native Keychain library.
 * Replace with real implementation in the mobile client package.
 */
export class KeychainAdapter implements ISecureStorage {
  private store = new Map<string, string>();

  async setToken(key: string, value: string): Promise<void> {
    try {
      this.store.set(key, value);
    } catch {
      throw new StorageError('Failed to write to iOS Keychain', 'write', 'secure');
    }
  }

  async getToken(key: string): Promise<string | null> {
    try {
      return this.store.get(key) ?? null;
    } catch {
      throw new StorageError('Failed to read from iOS Keychain', 'read', 'secure');
    }
  }

  async removeToken(key: string): Promise<void> {
    try {
      this.store.delete(key);
    } catch {
      throw new StorageError('Failed to remove from iOS Keychain', 'delete', 'secure');
    }
  }

  async clear(): Promise<void> {
    try {
      this.store.clear();
    } catch {
      throw new StorageError('Failed to clear iOS Keychain', 'clear', 'secure');
    }
  }
}
