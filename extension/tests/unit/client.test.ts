import { describe, expect, it, vi } from 'vitest';
import {
  MockVerdictClient,
  RealVerdictClient,
} from '../../src/api/client.ts';
import {
  EngineUnavailableError,
  NetworkError,
  TimeoutError,
  ValidationError,
} from '../../src/api/errors.ts';
import {
  mockCautionSignals,
  mockDangerSignals,
  mockSafeSignals,
} from '../fixtures/signals.fixture.ts';

describe('Verdict API Client', () => {
  describe('MockVerdictClient', () => {
    const mockClient = new MockVerdictClient();

    it('should return SAFE decision for regular sites', async () => {
      const response = await mockClient.analyzePage(mockSafeSignals);
      expect(response.decision.status).toBe('SAFE');
      expect(response.decision.action).toBe('NONE');
    });

    it('should return CAUTION decision for suspicious sites', async () => {
      const response = await mockClient.analyzePage(mockCautionSignals);
      expect(response.decision.status).toBe('CAUTION');
      expect(response.decision.action).toBe('WARN');
      expect(response.decision.title).toBe('Be careful here');
    });

    it('should return DANGER decision for phishing / fake shop sites', async () => {
      const response = await mockClient.analyzePage(mockDangerSignals);
      expect(response.decision.status).toBe('DANGER');
      expect(response.decision.action).toBe('GO_BACK');
      expect(response.decision.title).toBe("Don't pay here");
    });

    it('should throw EngineUnavailableError when host indicates offline', async () => {
      const offlineSignals = {
        ...mockSafeSignals,
        page: {
          ...mockSafeSignals.page,
          hostname: 'engine-down.example.com',
        },
      };

      await expect(mockClient.analyzePage(offlineSignals)).rejects.toThrow(
        EngineUnavailableError
      );
    });
  });

  describe('RealVerdictClient Network and Error Handling', () => {
    it('should handle 500 server error by throwing EngineUnavailableError', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      });
      globalThis.fetch = mockFetch;

      const client = new RealVerdictClient('https://api.test.com', 100);

      await expect(client.analyzePage(mockSafeSignals)).rejects.toThrow(
        EngineUnavailableError
      );
    });

    it('should handle schema validation failure', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ invalid: 'schema' }),
      });
      globalThis.fetch = mockFetch;

      const client = new RealVerdictClient('https://api.test.com', 100);

      await expect(client.analyzePage(mockSafeSignals)).rejects.toThrow(
        ValidationError
      );
    });

    it('should handle network timeout', async () => {
      const mockFetch = vi.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
          const err = new Error('aborted');
          err.name = 'AbortError';
          setTimeout(() => reject(err), 50);
        });
      });
      globalThis.fetch = mockFetch;

      const client = new RealVerdictClient('https://api.test.com', 20);

      await expect(client.analyzePage(mockSafeSignals)).rejects.toThrow(
        TimeoutError
      );
    });

    it('should handle general network error', async () => {
      const mockFetch = vi.fn().mockRejectedValue(new Error('Connection refused'));
      globalThis.fetch = mockFetch;

      const client = new RealVerdictClient('https://api.test.com', 100);

      await expect(client.analyzePage(mockSafeSignals)).rejects.toThrow(
        NetworkError
      );
    });
  });
});
