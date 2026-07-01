import { describe, it, expect } from 'vitest';
import { ErrorHandlingService, errorHandlingService } from '../error-categorization.js';
import { APIError, NetworkError, ValidationError, StorageError, AuthError } from '../error-types.js';

describe('ErrorHandlingService', () => {
  const service = new ErrorHandlingService();

  describe('categorize', () => {
    it('should categorize APIError as api', () => {
      expect(service.categorize(new APIError('test', 500))).toBe('api');
    });

    it('should categorize NetworkError as network', () => {
      expect(service.categorize(new NetworkError('test'))).toBe('network');
    });

    it('should categorize ValidationError as validation', () => {
      expect(service.categorize(new ValidationError('test', new Map()))).toBe('validation');
    });

    it('should categorize StorageError as storage', () => {
      expect(service.categorize(new StorageError('test', 'read', 'secure'))).toBe('storage');
    });

    it('should categorize AuthError as auth', () => {
      expect(service.categorize(new AuthError('test', 'missing'))).toBe('auth');
    });

    it('should categorize unknown errors as unknown', () => {
      expect(service.categorize(new Error('test'))).toBe('unknown');
      expect(service.categorize('string error')).toBe('unknown');
    });
  });

  describe('getUserMessage', () => {
    it('should return userMessage for LuminescenceError subtypes', () => {
      const error = new APIError('test', 500);
      expect(service.getUserMessage(error)).toBe(error.userMessage);
    });

    it('should redact URLs from generic Error messages', () => {
      const error = new Error('Failed to fetch https://firefly.example.com/api');
      const message = service.getUserMessage(error);
      expect(message).not.toContain('https://firefly.example.com');
      expect(message).toContain('[REDACTED_URL]');
    });

    it('should redact Bearer tokens from generic Error messages', () => {
      const error = new Error('Invalid token: Bearer abc123xyz');
      const message = service.getUserMessage(error);
      expect(message).not.toContain('abc123xyz');
      expect(message).toContain('[REDACTED]');
    });

    it('should return generic message for non-Error types', () => {
      expect(service.getUserMessage(null)).toContain('unexpected error');
      expect(service.getUserMessage(undefined)).toContain('unexpected error');
    });
  });

  describe('isRetryable', () => {
    it('should return true for retryable errors', () => {
      expect(service.isRetryable(new NetworkError('test'))).toBe(true);
      expect(service.isRetryable(new APIError('test', 500))).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      expect(service.isRetryable(new ValidationError('test', new Map()))).toBe(false);
      expect(service.isRetryable(new AuthError('test', 'missing'))).toBe(false);
    });
  });

  describe('redact', () => {
    it('should redact URLs', () => {
      const result = service.redact('Error at https://firefly.example.com/api/v1/transactions');
      expect(result).not.toContain('https://');
      expect(result).toContain('[REDACTED_URL]');
    });

    it('should redact Bearer tokens', () => {
      const result = service.redact('Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.abc');
      expect(result).not.toContain('eyJhbGci');
      expect(result).toContain('[REDACTED]');
    });

    it('should return unchanged message if nothing to redact', () => {
      const result = service.redact('A simple error message');
      expect(result).toBe('A simple error message');
    });
  });

  describe('toRedactedError', () => {
    it('should produce a safe redacted error object', () => {
      const error = new APIError('Server error at https://example.com', 500);
      const redacted = service.toRedactedError(error);
      expect(redacted.category).toBe('api');
      expect(redacted.isRetryable).toBe(true);
      expect(redacted.message).not.toContain('https://');
    });
  });
});

describe('errorHandlingService singleton', () => {
  it('should be an instance of ErrorHandlingService', () => {
    expect(errorHandlingService).toBeInstanceOf(ErrorHandlingService);
  });
});
