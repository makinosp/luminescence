/**
 * Secure storage interface (Port).
 *
 * Tokens and sensitive data are stored exclusively through this interface.
 * Platform-specific adapters implement this interface.
 *
 * Security constraints:
 * - SB-02: Tokens stored ONLY in secure storage
 * - NFR-02: Never use AsyncStorage/localStorage for tokens
 * - NFR-07: Fail-closed when storage is unavailable
 */
export interface ISecureStorage {
  /**
   * Store a token securely.
   * @param key - Storage key (e.g., 'ff3-token')
   * @param value - Token value (opaque string)
   * @throws StorageError if write fails
   */
  setToken(key: string, value: string): Promise<void>;

  /**
   * Retrieve a token from secure storage.
   * @param key - Storage key
   * @returns Token value, or null if not found
   * @throws StorageError if read fails
   */
  getToken(key: string): Promise<string | null>;

  /**
   * Remove a token from secure storage.
   * @param key - Storage key to remove
   * @throws StorageError if delete fails
   */
  removeToken(key: string): Promise<void>;

  /**
   * Clear all tokens from secure storage.
   * Used during logout.
   * @throws StorageError if clear fails
   */
  clear(): Promise<void>;
}

/**
 * Secure storage key constants.
 * Keys use kebab-case, namespaced with 'ff3-' prefix.
 */
export const SECURE_STORAGE_KEYS = {
  TOKEN: 'ff3-token',
} as const;
