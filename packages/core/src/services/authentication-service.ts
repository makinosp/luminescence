import type { IFireflyIIIClient } from '../api-client/firefly-client.js';
import type { ILocalSettings } from '../storage/interfaces/local-settings.js';
import type { ISecureStorage } from '../storage/interfaces/secure-storage.js';
import { AuthError, StorageError } from '../errors/error-types.js';
import type { AuthStore } from '../stores/auth-store.js';
import type { ValidationService } from './validation-service.js';

/**
 * Authentication service.
 * Orchestrates authentication flow: validate, store token, test connectivity.
 *
 * NFR Security §1.1, §1.3, §1.4; NFR Reliability §2.3.
 * Fail-closed: If ISecureStorage unavailable, operation fails with StorageError.
 */
export class AuthenticationService {
  constructor(
    private readonly secureStorage: ISecureStorage,
    private readonly localSettings: ILocalSettings,
    private readonly apiClient: IFireflyIIIClient,
    private readonly validationService: ValidationService,
    private readonly authStore: AuthStore,
  ) {}

  /**
   * Check if the user is configured (baseURL + token exist).
   */
  isConfigured(): boolean {
    return this.authStore.isConfigured;
  }

  /**
   * Configure the server with base URL and token.
   *
   * Flow:
   * 1. Validate URL (HTTPS, well-formed) — SB-03
   * 2. Validate token (non-empty)
   * 3. Test Firefly III connectivity
   * 4. Store token in SecureStorage — SB-02
   * 5. Store URL in LocalSettings — SB-01
   * 6. Update AuthStore state
   */
  async configureServer(baseURL: string, token: string): Promise<void> {
    this.authStore.setLoading(true);
    this.authStore.setError(null);

    try {
      // Validate inputs
      this.validationService.throwIfInvalid(this.validationService.validateURL(baseURL));
      this.validationService.throwIfInvalid(this.validationService.validateToken(token));

      // Configure API client
      this.apiClient.setBaseURL(baseURL);
      this.apiClient.setToken(token);

      // Test connectivity
      const isConnected = await this.apiClient.validateConnectivity();
      if (!isConnected) {
        throw new AuthError('Unable to connect to the Firefly III server', 'invalid');
      }

      // Store credentials
      await this.secureStorage.setToken('ff3-token', token);
      await this.localSettings.set('server-base-url', baseURL);

      // Update store
      this.authStore.setConfigured(baseURL);
      this.authStore.setTokenValid(true);
    } catch (error) {
      if (error instanceof AuthError || error instanceof StorageError) {
        this.authStore.setError(error);
      } else {
        this.authStore.setError(new AuthError('Configuration failed', 'invalid'));
      }
      throw error;
    } finally {
      this.authStore.setLoading(false);
    }
  }

  /**
   * Reconfigure with new credentials.
   * Clears existing data before configuring.
   */
  async reconfigure(baseURL: string, token: string): Promise<void> {
    await this.logout();
    await this.configureServer(baseURL, token);
  }

  /**
   * Get a valid token for API requests.
   * Retrieves from SecureStorage.
   */
  async getValidToken(): Promise<string> {
    try {
      const token = await this.secureStorage.getToken('ff3-token');
      if (!token) {
        throw new AuthError('No access token found', 'missing');
      }
      return token;
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new StorageError('Failed to read token from secure storage', 'read', 'secure');
    }
  }

  /**
   * Log out the user.
   * Clears credentials and resets all stores.
   */
  async logout(): Promise<void> {
    try {
      await this.secureStorage.clear();
      await this.localSettings.clear();
    } catch {
      // Continue with logout even if storage clear fails
    }

    this.authStore.reset();
  }

  /**
   * Validate API connectivity and token.
   */
  async validateConnectivity(): Promise<boolean> {
    try {
      const token = await this.getValidToken();
      this.apiClient.setToken(token);

      const baseURL = await this.localSettings.get('server-base-url');
      if (baseURL) {
        this.apiClient.setBaseURL(baseURL);
      }

      const isConnected = await this.apiClient.validateConnectivity();
      this.authStore.setTokenValid(isConnected);
      return isConnected;
    } catch {
      this.authStore.setTokenValid(false);
      return false;
    }
  }
}
