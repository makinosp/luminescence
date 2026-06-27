import type { ILocalSettings } from '../interfaces/local-settings.js';
import { StorageError } from '../../errors/error-types.js';

/**
 * CLI JSON config adapter stub.
 * Implements ILocalSettings using a JSON config file.
 *
 * Config location: ~/.config/luminescence/config.json
 *
 * Security: Only non-sensitive settings (SB-01).
 * Never stores tokens or secrets.
 *
 * This is a stub — actual implementation requires Node.js fs module.
 * Replace with real implementation in the CLI client package.
 */
export class JSONConfigAdapter implements ILocalSettings {
  private store = new Map<string, string>();

  async set(key: string, value: string): Promise<void> {
    try {
      this.store.set(key, value);
    } catch {
      throw new StorageError('Failed to write to config file', 'write', 'local');
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return this.store.get(key) ?? null;
    } catch {
      throw new StorageError('Failed to read from config file', 'read', 'local');
    }
  }

  async remove(key: string): Promise<void> {
    try {
      this.store.delete(key);
    } catch {
      throw new StorageError('Failed to remove from config file', 'delete', 'local');
    }
  }

  async clear(): Promise<void> {
    try {
      this.store.clear();
    } catch {
      throw new StorageError('Failed to clear config file', 'clear', 'local');
    }
  }
}
