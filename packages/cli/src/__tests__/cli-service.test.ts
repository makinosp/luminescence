import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CLIService } from '../services/cli-service.js';
import { JSONConfigAdapter } from '../storage/json-config-adapter.js';
import { KeyringAdapter } from '../storage/keyring-adapter.js';

vi.mock('keytar', () => ({
  default: {
    setPassword: vi.fn().mockResolvedValue(undefined),
    getPassword: vi.fn().mockResolvedValue(null),
    deletePassword: vi.fn().mockResolvedValue(true),
  },
}));
vi.mock('../storage/keyring-adapter.js');
vi.mock('../storage/json-config-adapter.js');

describe('CLIService', () => {
  let cliService: CLIService;

  beforeEach(() => {
    const mockKeyring = vi.mocked(new KeyringAdapter());
    const mockConfig = vi.mocked(new JSONConfigAdapter());

    mockKeyring.getToken.mockResolvedValue('test-token');
    mockConfig.get.mockResolvedValue('https://test.firefly.com');

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
});
