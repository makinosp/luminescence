import fc from 'fast-check';
import { describe, it, expect } from 'vitest';
import { NetworkError } from '../../errors/error-types.js';
import { RetryMiddleware } from '../retry-middleware.js';

describe('RetryMiddleware — Property-Based Tests', () => {
  describe('isIdempotent', () => {
    it('should only return true for GET', () => {
      const middleware = new RetryMiddleware();
      fc.assert(
        fc.property(fc.constantFrom('GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'), (method) => {
          const result = middleware.isIdempotent(method);
          if (method === 'GET') {
            expect(result).toBe(true);
          } else {
            expect(result).toBe(false);
          }
        }),
      );
    });
  });

  describe('non-idempotent methods never retry', () => {
    it('should call the function exactly once for non-GET methods', async () => {
      const middleware = new RetryMiddleware({
        maxRetries: 5,
        initialBackoffMs: 1,
      });
      fc.assert(
        fc.asyncProperty(fc.constantFrom('POST', 'PUT', 'DELETE'), fc.string(), async (method, errorMessage) => {
          let callCount = 0;
          const fn = async (): Promise<never> => {
            callCount++;
            throw new NetworkError(errorMessage);
          };

          await expect(middleware.execute(method, fn)).rejects.toThrow(NetworkError);
          expect(callCount).toBe(1);
        }),
      );
    });
  });
});
