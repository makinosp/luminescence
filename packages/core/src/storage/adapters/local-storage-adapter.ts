import type { ILocalSettings } from '../interfaces/local-settings.js';
import { StorageError } from '../../errors/error-types.js';

/**
 * Web localStorage adapter stub.
 * Implements ILocalSettings using browser localStorage.
 *
 * Security: Only non-sensitive settings (SB-01).
 * Never stores tokens or secrets.
 *
 * This is a stub — actual implementation requires browser environment.
 * Replace with real implementation in the web client package.
 */
export class LocalStorageAdapter implements ILocalSettings {
  private store = new Map<string, string>();

  async set(key: string, value: string): Promise<void> {
    try {
      this.store.set(key, value);
    } catch {
      throw new StorageError('Failed to write to localStorage', 'write', 'local');
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return this.store.get(key) ?? null;
    } catch {
      throw new StorageError('Failed to read from localStorage', 'read', 'local');
    }
  }

  async remove(key: string): Promise<void> {
    try {
      this.store.delete(key);
    } catch {
      throw new StorageError('Failed to remove from localStorage', 'delete', 'local');
    }
  }

  async clear(): Promise<void> {
    try {
      this.store.clear();
    } catch {
      throw new StorageError('Failed to clear localStorage', 'clear', 'local');
    }
  }
}
