import { AuthError } from '../errors/error-types.js';

/**
 * Auth Gate (Token Injector).
 * Manages the Bearer token session cache and injects it into outgoing requests.
 *
 * NFR Security §1.1, §1.6, SB-02:
 * - Token cached in memory for session lifetime
 * - Refreshed on 401 or logout
 * - Token is NEVER stored in MobX observable state
 */
export class AuthGate {
  private tokenCache: string | null = null;

  /**
   * Set the token in the session cache.
   * Called after successful authentication or token retrieval from secure storage.
   */
  setToken(token: string): void {
    if (!token || token.trim().length === 0) {
      throw new AuthError('Token must be a non-empty string', 'invalid');
    }
    this.tokenCache = token;
  }

  /**
   * Get the current token from the session cache.
   * @throws AuthError if no token is cached
   */
  getToken(): string {
    if (!this.tokenCache) {
      throw new AuthError('No token available in session cache', 'missing');
    }
    return this.tokenCache;
  }

  /**
   * Check if a token is currently cached.
   */
  hasToken(): boolean {
    return this.tokenCache !== null;
  }

  /**
   * Clear the token from the session cache.
   * Called on 401 response or logout.
   */
  clearToken(): void {
    this.tokenCache = null;
  }

  /**
   * Build authorization headers for an API request.
   * Injects the Bearer token from the session cache.
   */
  getAuthHeaders(): Record<string, string> {
    const token = this.getToken();
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }
}
