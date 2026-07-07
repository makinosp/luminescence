import type { ISecureStorage } from '@luminescence/core';
import keytar from 'keytar';

export class KeyringAdapter implements ISecureStorage {
  private readonly SERVICE_NAME = 'luminescence-cli';
  private readonly ACCOUNT_NAME = 'firefly-iii-token';

  async setToken(key: string, value: string): Promise<void> {
    try {
      await keytar.setPassword(this.SERVICE_NAME, `${this.ACCOUNT_NAME}-${key}`, value);
    } catch (error) {
      throw new Error(`Failed to store secure value: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getToken(key: string): Promise<string | null> {
    try {
      return await keytar.getPassword(this.SERVICE_NAME, `${this.ACCOUNT_NAME}-${key}`);
    } catch (error) {
      throw new Error(`Failed to retrieve secure value: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async removeToken(key: string): Promise<void> {
    try {
      await keytar.deletePassword(this.SERVICE_NAME, `${this.ACCOUNT_NAME}-${key}`);
    } catch (error) {
      throw new Error(`Failed to remove secure value: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async clear(): Promise<void> {
    try {
      // Keytar doesn't have a clear method, so we need to track keys
      // For simplicity, we'll just delete the known account
      await keytar.deletePassword(this.SERVICE_NAME, this.ACCOUNT_NAME);
    } catch {
      // Ignore errors if no passwords exist
    }
  }
}
