import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ErrorHandlingService } from '../error-categorization.js';
import {
  APIError,
  NetworkError,
  ValidationError,
  StorageError,
  AuthError,
} from '../error-types.js';

const service = new ErrorHandlingService();

describe('ErrorHandlingService — Property-Based Tests', () => {
  describe('redact never leaks sensitive patterns', () => {
    it('should never contain URLs after redaction', () => {
      fc.assert(
        fc.property(fc.string(), fc.webUrl(), (prefix, url) => {
          const message = `${prefix} ${url}`;
          const redacted = service.redact(message);
          // After redaction, no https:// or http:// should remain
          expect(redacted).not.toMatch(/https?:\/\/[^\s]+/);
        }),
      );
    });

    it('should never contain Bearer tokens after redaction', () => {
      fc.assert(
        fc.property(fc.string({ minLength: 1 }), (token) => {
          const message = `Authorization: Bearer ${token}`;
          const redacted = service.redact(message);
          // The token value should be redacted
          expect(redacted).not.toContain(token);
          expect(redacted).toContain('[REDACTED]');
        }),
      );
    });
  });

  describe('categorize is deterministic', () => {
    it('should return same category for same error type', () => {
      fc.assert(
        fc.property(fc.integer({ min: 100, max: 599 }), fc.string(), (statusCode, message) => {
          const error = new APIError(message, statusCode);
          const cat1 = service.categorize(error);
          const cat2 = service.categorize(error);
          expect(cat1).toBe(cat2);
          expect(cat1).toBe('api');
        }),
      );
    });
  });

  describe('toRedactedError invariants', () => {
    it('should always produce a message without sensitive data', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(new APIError('test', 500)),
            fc.constant(new NetworkError('test')),
            fc.constant(new ValidationError('test', new Map())),
            fc.constant(new StorageError('test', 'read', 'secure')),
            fc.constant(new AuthError('test', 'missing')),
          ),
          (error) => {
            const redacted = service.toRedactedError(error);
            expect(redacted.message).toBeTruthy();
            expect(redacted.category).toBeTruthy();
            expect(typeof redacted.isRetryable).toBe('boolean');
            // Message should never contain URLs
            expect(redacted.message).not.toMatch(/https?:\/\//);
          },
        ),
      );
    });
  });
});
