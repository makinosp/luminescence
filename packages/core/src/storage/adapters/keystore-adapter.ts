import type { ISecureStorage } from '../interfaces/secure-storage.js';
import { StorageError } from '../../errors/error-types.js';

/**
 * Android Keystore adapter stub.
 * Implements ISecureStorage using Android Keystore.
 *
 * This is a stub — actual implementation requires React Native Keystore library.
 * Replace with real implementation in the mobile client package.
 */
export class KeystoreAdapter implements ISecureStorage {
  private store = new Map<string, string>();

  async setToken(key: string, value: string): Promise<void> {
    try {
      this.store.set(key, value);
    } catch {
      throw new StorageError('Failed to write to Android Keystore', 'write', 'secure');
    }
  }

  async getToken(key: string): Promise<string | null> {
    try {
      return this.store.get(key) ?? null;
    } catch {
      throw new StorageError('Failed to read from Android Keystore', 'read', 'secure');
    }
  }

  async removeToken(key: string): Promise<void> {
    try {
      this.store.delete(key);
    } catch {
      throw new StorageError('Failed to remove from Android Keystore', 'delete', 'secure');
    }
  }

  async clear(): Promise<void> {
    try {
      this.store.clear();
    } catch {
      throw new StorageError('Failed to clear Android Keystore', 'clear', 'secure');
    }
  }
}
