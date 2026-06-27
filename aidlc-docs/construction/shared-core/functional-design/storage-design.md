# Shared Core - Storage Interface Design

## 1. Storage Port Interfaces

### 1.1 ISecureStorage (Port)

```typescript
/**
 * Secure storage interface (Port).
 * Tokens and sensitive data are stored here.
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
```

### 1.2 ILocalSettings (Port)

```typescript
/**
 * Local settings interface (Port).
 * Non-sensitive application settings are stored here.
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
```

---

## 2. Storage Key Naming Conventions

### 2.1 Secure Storage Keys

| Key | Purpose | Example Value |
|-----|---------|---------------|
| `ff3-token` | Firefly III personal access token | `abc123...xyz` |

### 2.2 Local Settings Keys

| Key | Purpose | Example Value |
|-----|---------|---------------|
| `server-base-url` | Firefly III server URL | `https://firefly.example.com` |
| `theme` | UI theme preference | `dark` |
| `language` | UI language | `en` |

### 2.3 Key Naming Rules

- Keys use **kebab-case** (lowercase, hyphens).
- Keys are **namespaced** with a prefix (e.g., `ff3-` for Firefly III specific).
- Keys are **stable** — changing a key name breaks existing user data.
- Keys are **not secret** — they are visible in code and logs.

---

## 3. Fail-Closed Behavior (Clarification Q9: B, NFR-07)

### 3.1 Storage Error Handling Strategy

```typescript
/**
 * Storage operation result type.
 * Clarification Q9: B — Fail closed with user-friendly prompt.
 */
export type StorageResult<T> =
  | { success: true; value: T }
  | { success: false; error: StorageError };
```

### 3.2 Fail-Closed Rules

| Operation | On Failure | User Experience |
|-----------|-----------|-----------------|
| `getToken()` | Throw `StorageError` | Prompt user to re-enter credentials |
| `setToken()` | Throw `StorageError` | Prompt user to check device security |
| `removeToken()` | Throw `StorageError` | Prompt user to retry |
| `get()` (settings) | Return `null` (graceful) | Use default value |
| `set()` (settings) | Throw `StorageError` | Inform user settings not saved |

### 3.3 Clarification Q9: B Implementation

When secure storage fails:
1. A `StorageError` is thrown with a user-friendly message.
2. The message prompts the user to check device security settings.
3. The user is guided to re-enter credentials or retry the operation.
4. **No secrets are included in the error message** (SB-04).

```typescript
// Example: Secure storage failure handling
async function handleSecureStorageFailure(error: StorageError): Promise<void> {
  // Log the error (without secrets)
  console.error(`[Storage] ${error.operation} failed: ${error.message}`);

  // Show user-friendly prompt
  // Mobile/Web: Display alert dialog
  // CLI: Print message to stderr
  showUserMessage(
    'Unable to access secure storage. Please check your device security settings and try again.'
  );
}
```

---

## 4. Platform Adapter Specifications

### 4.1 Mobile Adapters

| Interface | Adapter | Platform | Implementation |
|-----------|---------|----------|----------------|
| `ISecureStorage` | `KeychainSecureStorage` | iOS | iOS Keychain Services |
| `ISecureStorage` | `KeystoreSecureStorage` | Android | Android Keystore |
| `ILocalSettings` | `AsyncStorageAdapter` | iOS/Android | React Native AsyncStorage |

### 4.2 Web Adapters

| Interface | Adapter | Platform | Implementation |
|-----------|---------|----------|----------------|
| `ISecureStorage` | `SessionStorageAdapter` | Web | Browser `sessionStorage` |
| `ILocalSettings` | `LocalStorageAdapter` | Web | Browser `localStorage` |

**Web Security Note**: `sessionStorage` is used for tokens (not `localStorage`) to ensure tokens are cleared when the browser tab is closed (SB-02, AC9-02).

### 4.3 CLI Adapters

| Interface | Adapter | Platform | Implementation |
|-----------|---------|----------|----------------|
| `ISecureStorage` | `KeyringSecureStorage` | CLI | OS keyring via `keytar` |
| `ILocalSettings` | `JSONConfigAdapter` | CLI | `~/.config/luminescence/config.json` |

---

## 5. Security Constraints Summary

| Constraint | Rule | Enforced By |
|------------|------|-------------|
| SB-01 | Non-sensitive settings use platform-appropriate local stores | `ILocalSettings` interface |
| SB-02 | Tokens use platform-appropriate secure storage only | `ISecureStorage` interface |
| SB-04 | Error messages and logs redact secrets | `StorageError.userMessage` |
| NFR-02 | Token never stored in AsyncStorage or localStorage | Adapter selection |
| NFR-07 | Fail-closed when storage unavailable | `StorageError` with user prompt |
| Q9-B | Secure storage failure shows user-friendly prompt | `handleSecureStorageFailure()` |
