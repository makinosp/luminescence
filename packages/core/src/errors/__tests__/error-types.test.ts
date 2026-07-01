import { describe, it, expect } from 'vitest';
import { LuminescenceError, APIError, NetworkError, ValidationError, StorageError, AuthError } from '../error-types.js';

describe('LuminescenceError', () => {
  it('should set name to constructor name', () => {
    class TestError extends LuminescenceError {
      readonly isRetryable = false;
      readonly userMessage = 'test';
    }
    const error = new TestError('msg');
    expect(error.name).toBe('TestError');
  });

  it('should store context', () => {
    class TestError extends LuminescenceError {
      readonly isRetryable = false;
      readonly userMessage = 'test';
    }
    const error = new TestError('msg', { key: 'value' });
    expect(error.context).toEqual({ key: 'value' });
  });
});

describe('APIError', () => {
  it('should be retryable for 5xx status codes', () => {
    const error = new APIError('Server error', 500);
    expect(error.isRetryable).toBe(true);
  });

  it('should be retryable for 429 status code', () => {
    const error = new APIError('Rate limited', 429);
    expect(error.isRetryable).toBe(true);
  });

  it('should not be retryable for 4xx status codes (except 429)', () => {
    const error = new APIError('Bad request', 400);
    expect(error.isRetryable).toBe(false);
  });

  it('should provide user message for 401', () => {
    const error = new APIError('Unauthorized', 401);
    expect(error.userMessage).toContain('Authentication failed');
  });

  it('should provide user message for 404', () => {
    const error = new APIError('Not found', 404);
    expect(error.userMessage).toContain('not found');
  });

  it('should provide user message for 422', () => {
    const error = new APIError('Unprocessable', 422);
    expect(error.userMessage).toContain('invalid');
  });

  it('should provide user message for 5xx', () => {
    const error = new APIError('Server error', 500);
    expect(error.userMessage).toContain('server encountered an error');
  });
});

describe('NetworkError', () => {
  it('should always be retryable', () => {
    const error = new NetworkError('Connection refused');
    expect(error.isRetryable).toBe(true);
  });

  it('should provide user message about connection', () => {
    const error = new NetworkError('Connection refused');
    expect(error.userMessage).toContain('Unable to connect');
  });

  it('should store original error', () => {
    const original = new Error('DNS failure');
    const error = new NetworkError('Connection failed', original);
    expect(error.originalError).toBe(original);
  });
});

describe('ValidationError', () => {
  it('should not be retryable', () => {
    const error = new ValidationError('Invalid input', new Map([['amount', 'Invalid']]));
    expect(error.isRetryable).toBe(false);
  });

  it('should store field-level errors', () => {
    const fieldErrors = new Map([
      ['amount', 'Amount must be positive'],
      ['description', 'Description is required'],
    ]);
    const error = new ValidationError('Invalid input', fieldErrors);
    expect(error.fieldErrors.size).toBe(2);
    expect(error.fieldErrors.get('amount')).toBe('Amount must be positive');
  });

  it('should include field names in user message', () => {
    const error = new ValidationError('Invalid input', new Map([['amount', 'Invalid']]));
    expect(error.userMessage).toContain('amount');
  });
});

describe('StorageError', () => {
  it('should not be retryable', () => {
    const error = new StorageError('Keychain locked', 'read', 'secure');
    expect(error.isRetryable).toBe(false);
  });

  it('should provide user message for secure storage failure', () => {
    const error = new StorageError('Keychain locked', 'read', 'secure');
    expect(error.userMessage).toContain('secure storage');
  });

  it('should provide user message for local settings failure', () => {
    const error = new StorageError('Write failed', 'write', 'local');
    expect(error.userMessage).toContain('save settings');
  });
});

describe('AuthError', () => {
  it('should not be retryable', () => {
    const error = new AuthError('Token missing', 'missing');
    expect(error.isRetryable).toBe(false);
  });

  it('should provide user message for missing token', () => {
    const error = new AuthError('Token missing', 'missing');
    expect(error.userMessage).toContain('No access token');
  });

  it('should provide user message for invalid token', () => {
    const error = new AuthError('Token invalid', 'invalid');
    expect(error.userMessage).toContain('invalid');
  });

  it('should provide user message for expired token', () => {
    const error = new AuthError('Token expired', 'expired');
    expect(error.userMessage).toContain('expired');
  });

  it('should provide user message for not configured', () => {
    const error = new AuthError('Not configured', 'not_configured');
    expect(error.userMessage).toContain('not configured');
  });
});
