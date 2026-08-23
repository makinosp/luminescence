# Storage Specification

## Purpose

Platform-appropriate secure and local storage abstraction — secure storage for secrets (tokens), local settings for non-sensitive configuration. Implements platform-specific adapters behind unified interfaces.

## Requirements

### Requirement: Secure Storage Interface

The system SHALL provide a unified interface for secure token storage across all platforms.

#### Interface: ISecureStorage

```typescript
interface ISecureStorage {
    setToken(key: string, value: string): Promise<void>;
    getToken(key: string): Promise<string | null>;
    removeToken(key: string): Promise<void>;
    clear(): Promise<void>;
}
```

### Requirement: Local Settings Interface

The system SHALL provide a unified interface for non-sensitive local settings across all platforms.

#### Interface: ILocalSettings

```typescript
interface ILocalSettings {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    remove(key: string): Promise<void>;
    clear(): Promise<void>;
}
```

### Requirement: Mobile Secure Storage Adapter (iOS)

The system SHALL store tokens in iOS Keychain on iOS devices.

#### Scenario: Store token on iOS

- GIVEN the iOS app needs to store a token
- WHEN `setToken` is called
- THEN the token is stored in iOS Keychain with appropriate accessibility
- AND the token is encrypted at rest by the OS

#### Scenario: Retrieve token on iOS

- GIVEN a token is stored in iOS Keychain
- WHEN `getToken` is called
- THEN the token is retrieved from Keychain
- AND the token is never exposed in logs or diagnostics

#### Scenario: Remove token on iOS

- GIVEN a token is stored in iOS Keychain
- WHEN `removeToken` or `clear` is called
- THEN the token is removed from Keychain

### Requirement: Mobile Secure Storage Adapter (Android)

The system SHALL store tokens in Android Keystore on Android devices.

#### Scenario: Store token on Android

- GIVEN the Android app needs to store a token
- WHEN `setToken` is called
- THEN the token is stored in Android Keystore
- AND the token is encrypted at rest by the OS

#### Scenario: Retrieve token on Android

- GIVEN a token is stored in Android Keystore
- WHEN `getToken` is called
- THEN the token is retrieved from Keystore

#### Scenario: Remove token on Android

- GIVEN a token is stored in Android Keystore
- WHEN `removeToken` or `clear` is called
- THEN the token is removed from Keystore

### Requirement: Web Secure Storage Adapter

The system SHALL store tokens in browser sessionStorage (cleared on tab close).

#### Scenario: Store token on Web

- GIVEN the web app needs to store a token
- WHEN `setToken` is called
- THEN the token is stored in sessionStorage
- AND the token is NEVER stored in localStorage

#### Scenario: Retrieve token on Web

- GIVEN a token is stored in sessionStorage
- WHEN `getToken` is called
- THEN the token is retrieved from sessionStorage

#### Scenario: Token cleared on tab close

- GIVEN a token is stored in sessionStorage
- WHEN the user closes the browser tab
- THEN the token is automatically cleared by the browser

#### Scenario: Remove token on Web

- GIVEN a token is stored in sessionStorage
- WHEN `removeToken` or `clear` is called
- THEN the token is removed from sessionStorage

### Requirement: CLI Secure Storage Adapter

The system SHALL store tokens in OS keyring via keytar on CLI.

#### Scenario: Store token on CLI

- GIVEN the CLI needs to store a token
- WHEN `setToken` is called
- THEN the token is stored in OS keyring (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- AND the token is NEVER stored in the JSON config file

#### Scenario: Retrieve token on CLI

- GIVEN a token is stored in OS keyring
- WHEN `getToken` is called
- THEN the token is retrieved from keyring

#### Scenario: Remove token on CLI

- GIVEN a token is stored in OS keyring
- WHEN `removeToken` or `clear` is called
- THEN the token is removed from keyring

### Requirement: Mobile Local Settings Adapter

The system SHALL store non-sensitive settings in React Native AsyncStorage on mobile.

#### Scenario: Store settings on Mobile

- GIVEN the mobile app needs to store a setting (e.g., server URL)
- WHEN `set` is called
- THEN the value is stored in AsyncStorage

#### Scenario: Retrieve settings on Mobile

- GIVEN a setting is stored in AsyncStorage
- WHEN `get` is called
- THEN the value is retrieved from AsyncStorage

### Requirement: Web Local Settings Adapter

The system SHALL store non-sensitive settings in browser localStorage on web.

#### Scenario: Store settings on Web

- GIVEN the web app needs to store a setting
- WHEN `set` is called
- THEN the value is stored in localStorage

#### Scenario: Retrieve settings on Web

- GIVEN a setting is stored in localStorage
- WHEN `get` is called
- THEN the value is retrieved from localStorage

### Requirement: CLI Local Settings Adapter

The system SHALL store non-sensitive settings in JSON config file at `~/.config/luminescence/config.json`.

#### Scenario: Store settings on CLI

- GIVEN the CLI needs to store a setting
- WHEN `set` is called
- THEN the value is written to the JSON config file
- AND the file is created with appropriate permissions if it doesn't exist

#### Scenario: Retrieve settings on CLI

- GIVEN a setting is stored in the JSON config file
- WHEN `get` is called
- THEN the value is read from the JSON config file

### Requirement: Fail-Closed on Storage Unavailable

The system SHALL fail closed when secure storage is unavailable.

#### Scenario: Secure storage unavailable on Mobile

- GIVEN Keychain/Keystore is unavailable (e.g., device not set up)
- WHEN `setToken` or `getToken` is called
- THEN an error is returned indicating secure storage is unavailable
- AND the operation does not fall back to non-secure storage

#### Scenario: Secure storage unavailable on CLI

- GIVEN OS keyring is unavailable (e.g., no keyring daemon)
- WHEN `setToken` or `getToken` is called
- THEN an error is returned with instructions to set up keyring
- AND the operation does not fall back to file storage

### Requirement: Secrets Never in Non-Secure Storage

The system MUST never store tokens in non-secure storage locations.

#### Scenario: Token never in AsyncStorage

- GIVEN any mobile operation
- WHEN tokens are handled
- THEN tokens are never written to AsyncStorage

#### Scenario: Token never in localStorage

- GIVEN any web operation
- WHEN tokens are handled
- THEN tokens are never written to localStorage

#### Scenario: Token never in CLI config file

- GIVEN any CLI operation
- WHEN tokens are handled
- THEN tokens are never written to `~/.config/luminescence/config.json`

### Requirement: Storage Error Handling

The system SHALL handle storage errors gracefully.

#### Scenario: Storage quota exceeded

- GIVEN storage quota is exceeded
- WHEN a write operation is attempted
- THEN a user-friendly error is returned
- AND no partial data is written

#### Scenario: Storage corruption

- GIVEN stored data is corrupted
- WHEN a read operation is attempted
- THEN an error is returned and the user is prompted to reconfigure
