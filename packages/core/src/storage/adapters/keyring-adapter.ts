import type { ISecureStorage } from '../interfaces/secure-storage.js';
import { StorageError } from '../../errors/error-types.js';

/**
 * CLI OS keyring adapter stub.
 * Implements ISecureStorage using OS keyring (via keytar).
 *
 * This is a stub — actual implementation requires the keytar library.
 * Replace with real implementation in the CLI client package.
 */
export class KeyringAdapter implements ISecureStorage {
  private store = new Map<string, string>();

  async setToken(key: string, value: string): Promise<void> {
    try {
      this.store.set(key, value);
    } catch {
      throw new StorageError('Failed to write to OS keyring', 'write', 'secure');
    }
  }

  async getToken(key: string): Promise<string | null> {
    try {
      return this.store.get(key) ?? null;
    } catch {
      throw new StorageError('Failed to read from OS keyring', 'read', 'secure');
    }
  }

  async removeToken(key: string): Promise<void> {
    try {
      this.store.delete(key);
    } catch {
      throw new StorageError('Failed to remove from OS keyring', 'delete', 'secure');
    }
  }

  async clear(): Promise<void> {
    try {
      this.store.clear();
    } catch {
      throw new StorageError('Failed to clear OS keyring', 'clear', 'secure');
    }
  }
}
