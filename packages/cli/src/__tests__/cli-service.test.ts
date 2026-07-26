import type { JSONConfigAdapter } from '../storage/json-config-adapter.js';
import type { KeyringAdapter } from '../storage/keyring-adapter.js';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CLIService } from '../services/cli-service.js';

describe('CLIService', () => {
  let cliService: CLIService;
  let mockKeyring: KeyringAdapter;
  let mockConfig: JSONConfigAdapter;

  beforeEach(() => {
    mockKeyring = {
      setToken: vi.fn().mockResolvedValue(undefined),
      getToken: vi.fn().mockResolvedValue('test-token'),
      removeToken: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    } as unknown as KeyringAdapter;

    mockConfig = {
      set: vi.fn().mockResolvedValue(undefined),
      get: vi.fn().mockResolvedValue('https://test.firefly.com'),
      remove: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    } as unknown as JSONConfigAdapter;

    cliService = new CLIService(mockKeyring, mockConfig);
  });

  describe('configure', () => {
    it('should return error code for invalid URL', async () => {
      const exitCode = await cliService.configure({
        url: 'http://insecure.com',
        token: 'test-token',
      });

      expect(exitCode).toBe(1);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const exitCode = await cliService.logout();
      expect(exitCode).toBe(0);
    });
  });

  describe('createTransaction', () => {
    it('should return error code for invalid input', async () => {
      const exitCode = await cliService.createTransaction({
        type: 'invalid-type',
        amount: '-50',
        description: '',
        date: 'not-a-date',
        fromAccount: '',
        toAccount: '',
        category: '',
      });

      expect(exitCode).toBe(1);
    });
  });

  describe('updateTransaction', () => {
    it('should return error code when no fields provided', async () => {
      const exitCode = await cliService.updateTransaction('', {});

      expect(exitCode).toBe(1);
    });
  });

  describe('deleteTransaction', () => {
    it('should return error code for empty ID', async () => {
      const exitCode = await cliService.deleteTransaction('', { force: true });

      expect(exitCode).toBe(1);
    });
  });

  describe('reportSpending', () => {
    it('should return error code when server not configured', async () => {
      const exitCode = await cliService.reportSpending({ period: 'current_month' });

      expect(exitCode).toBe(1);
    });
  });

  describe('reportIncomeExpenses', () => {
    it('should return error code when server not configured', async () => {
      const exitCode = await cliService.reportIncomeExpenses({ period: 'last_month' });

      expect(exitCode).toBe(1);
    });
  });

  describe('reportTrend', () => {
    it('should return error code when server not configured', async () => {
      const exitCode = await cliService.reportTrend({});

      expect(exitCode).toBe(1);
    });
  });
});
