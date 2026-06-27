import { describe, it, expect } from 'vitest';
import { HTTPSEnforcer } from '../https-enforcer.js';
import { ValidationError } from '../../errors/error-types.js';

describe('HTTPSEnforcer', () => {
  let enforcer: HTTPSEnforcer;

  beforeEach(() => {
    enforcer = new HTTPSEnforcer();
  });

  it('should accept valid HTTPS URLs', () => {
    enforcer.setBaseURL('https://firefly.example.com');
    expect(enforcer.getBaseURL()).toBe('https://firefly.example.com');
  });

  it('should strip trailing slash', () => {
    enforcer.setBaseURL('https://firefly.example.com/');
    expect(enforcer.getBaseURL()).toBe('https://firefly.example.com');
  });

  it('should reject HTTP URLs', () => {
    expect(() => enforcer.setBaseURL('http://firefly.example.com')).toThrow(ValidationError);
  });

  it('should reject non-URL strings', () => {
    expect(() => enforcer.setBaseURL('not-a-url')).toThrow(ValidationError);
  });

  it('should reject empty strings', () => {
    expect(() => enforcer.setBaseURL('')).toThrow(ValidationError);
  });

  it('should build API URLs correctly', () => {
    enforcer.setBaseURL('https://firefly.example.com');
    expect(enforcer.buildURL('/transactions')).toBe('https://firefly.example.com/api/v1/transactions');
  });

  it('should handle paths without leading slash', () => {
    enforcer.setBaseURL('https://firefly.example.com');
    expect(enforcer.buildURL('transactions')).toBe('https://firefly.example.com/api/v1/transactions');
  });

  it('should throw when building URL without base URL', () => {
    expect(() => enforcer.buildURL('/transactions')).toThrow(ValidationError);
  });
});
