/**
 * Local settings interface (Port).
 *
 * Non-sensitive application settings are stored through this interface.
 * Platform-specific adapters implement this interface.
 *
 * Security constraints:
 * - SB-01: Only non-sensitive settings (base URL, UI preferences)
 * - Never store tokens or secrets
 */
export interface ILocalSettings {
  /**
   * Store a setting value.
   * @param key - Setting key (e.g., 'server-base-url')
   * @param value - Setting value (string)
   * @throws StorageError if write fails
   */
  set(key: string, value: string): Promise<void>;

  /**
   * Retrieve a setting value.
   * @param key - Setting key
   * @returns Setting value, or null if not found
   * @throws StorageError if read fails
   */
  get(key: string): Promise<string | null>;

  /**
   * Remove a setting.
   * @param key - Setting key to remove
   * @throws StorageError if delete fails
   */
  remove(key: string): Promise<void>;

  /**
   * Clear all settings.
   * Used during logout.
   * @throws StorageError if clear fails
   */
  clear(): Promise<void>;
}

/**
 * Local settings key constants.
 * Keys use kebab-case.
 */
export const LOCAL_SETTINGS_KEYS = {
  SERVER_BASE_URL: 'server-base-url',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;
