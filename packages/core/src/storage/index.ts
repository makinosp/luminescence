// Storage — barrel exports
export type { ISecureStorage } from './interfaces/secure-storage.js';
export { SECURE_STORAGE_KEYS } from './interfaces/secure-storage.js';
export type { ILocalSettings } from './interfaces/local-settings.js';
export { LOCAL_SETTINGS_KEYS } from './interfaces/local-settings.js';

// Platform adapters (stubs — replace with real implementations in client packages)
export { KeychainAdapter } from './adapters/keychain-adapter.js';
export { KeystoreAdapter } from './adapters/keystore-adapter.js';
export { SessionStorageAdapter } from './adapters/session-storage-adapter.js';
export { KeyringAdapter } from './adapters/keyring-adapter.js';
export { AsyncStorageAdapter } from './adapters/async-storage-adapter.js';
export { LocalStorageAdapter } from './adapters/local-storage-adapter.js';
export { JSONConfigAdapter } from './adapters/json-config-adapter.js';
