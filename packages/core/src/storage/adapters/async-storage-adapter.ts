import type { ILocalSettings } from '../interfaces/local-settings.js';
import { StorageError } from '../../errors/error-types.js';

/**
 * Mobile AsyncStorage adapter stub.
 * Implements ILocalSettings using React Native AsyncStorage.
 *
 * Security: Only non-sensitive settings (SB-01).
 * Never stores tokens or secrets.
 *
 * This is a stub — actual implementation requires @react-native-async-storage/async-storage.
 * Replace with real implementation in the mobile client package.
 */
export class AsyncStorageAdapter implements ILocalSettings {
  private store = new Map<string, string>();

  async set(key: string, value: string): Promise<void> {
    try {
      this.store.set(key, value);
    } catch {
      throw new StorageError('Failed to write to AsyncStorage', 'write', 'local');
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return this.store.get(key) ?? null;
    } catch {
      throw new StorageError('Failed to read from AsyncStorage', 'read', 'local');
    }
  }

  async remove(key: string): Promise<void> {
    try {
      this.store.delete(key);
    } catch {
      throw new StorageError('Failed to remove from AsyncStorage', 'delete', 'local');
    }
  }

  async clear(): Promise<void> {
    try {
      this.store.clear();
    } catch {
      throw new StorageError('Failed to clear AsyncStorage', 'clear', 'local');
    }
  }
}
