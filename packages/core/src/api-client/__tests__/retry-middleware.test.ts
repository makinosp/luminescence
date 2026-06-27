import { describe, it, expect, vi } from 'vitest';
import { RetryMiddleware } from '../retry-middleware.js';
import { NetworkError } from '../../errors/error-types.js';

describe('RetryMiddleware', () => {
  it('should not retry non-idempotent methods', async () => {
    const middleware = new RetryMiddleware();
    const fn = vi.fn().mockRejectedValue(new NetworkError('Connection failed'));

    await expect(middleware.execute('POST', fn)).rejects.toThrow(NetworkError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should not retry POST', () => {
    const middleware = new RetryMiddleware();
    expect(middleware.isIdempotent('POST')).toBe(false);
  });

  it('should not retry PUT', () => {
    const middleware = new RetryMiddleware();
    expect(middleware.isIdempotent('PUT')).toBe(false);
  });

  it('should not retry DELETE', () => {
    const middleware = new RetryMiddleware();
    expect(middleware.isIdempotent('DELETE')).toBe(false);
  });

  it('should retry GET on network error', async () => {
    const middleware = new RetryMiddleware({ maxRetries: 1, initialBackoffMs: 10 });
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new NetworkError('First attempt failed'))
      .mockResolvedValueOnce('success');

    const result = await middleware.execute('GET', fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after exhausting retries', async () => {
    const middleware = new RetryMiddleware({ maxRetries: 1, initialBackoffMs: 10 });
    const fn = vi.fn().mockRejectedValue(new NetworkError('Always fails'));

    await expect(middleware.execute('GET', fn)).rejects.toThrow(NetworkError);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should succeed on first attempt without retry', async () => {
    const middleware = new RetryMiddleware();
    const fn = vi.fn().mockResolvedValue('success');

    const result = await middleware.execute('GET', fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
