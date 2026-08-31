import { describe, expect, it, beforeEach, vi } from 'vitest';
import { RealVerdictClient } from '../../src/api/client.ts';
import { ProtectionCoordinator } from '../../src/background/protection.ts';
import { WarningOverlayManager } from '../../src/content/warning/WarningOverlay.ts';
import { setProtectionState } from '../../src/storage/protectionState.ts';

describe('End-to-End: Extension to Express Backend Flow', () => {
  const backendBaseUrl = 'http://localhost:3000';

  beforeEach(async () => {
    await setProtectionState(true);
  });

  it('should handle SAFE response from backend by remaining silent', async () => {
    // Mock backend returning SAFE
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'SAFE',
        title: 'Safe',
        message: 'No threat detected.',
        action: 'NONE',
        decisionId: 'dec-safe-1',
        requestId: 'req-1',
      }),
    });

    const client = new RealVerdictClient(backendBaseUrl);
    const coordinator = new ProtectionCoordinator(client);

    const decision = await coordinator.analyzeUrl(1, 'https://legitimate-store.com/item');

    expect(decision).not.toBeNull();
    expect(decision?.status).toBe('SAFE');
    expect(decision?.action).toBe('NONE');
    expect(document.querySelector('verdict-warning-container')).toBeNull();
  });

  it('should handle CAUTION response from backend and render warning banner', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'CAUTION',
        title: 'Be careful here',
        message: "This shop is very new and we couldn't verify who operates it.",
        action: 'WARN',
        decisionId: 'dec-caution-1',
        requestId: 'req-2',
      }),
    });

    const client = new RealVerdictClient(backendBaseUrl);
    const coordinator = new ProtectionCoordinator(client);

    const decision = await coordinator.analyzeUrl(2, 'https://suspicious-unverified-store.com/checkout');

    expect(decision?.status).toBe('CAUTION');
    expect(decision?.action).toBe('WARN');

    const overlay = new WarningOverlayManager();
    overlay.render(
      decision!,
      () => {},
      () => {}
    );

    const container = document.querySelector('verdict-warning-container');
    expect(container).not.toBeNull();
    overlay.removeWarning();
  });

  it('should handle DANGER response from backend and render safety intervention', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        status: 'DANGER',
        title: "Don't pay here",
        message: 'This looks like a fake shop. Your money may not be safe.',
        action: 'GO_BACK',
        decisionId: 'dec-danger-1',
        requestId: 'req-3',
      }),
    });

    const client = new RealVerdictClient(backendBaseUrl);
    const coordinator = new ProtectionCoordinator(client);

    const decision = await coordinator.analyzeUrl(3, 'https://fake-shop-danger.com/login');

    expect(decision?.status).toBe('DANGER');
    expect(decision?.action).toBe('GO_BACK');

    const overlay = new WarningOverlayManager();
    overlay.render(
      decision!,
      () => {},
      () => {}
    );

    const container = document.querySelector('verdict-warning-container');
    expect(container).not.toBeNull();
    overlay.removeWarning();
  });

  it('should fail gracefully without breaking browsing when backend is unavailable', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch: Connection refused'));

    const client = new RealVerdictClient(backendBaseUrl);
    const coordinator = new ProtectionCoordinator(client);

    // Browsing should continue unimpeded (decision is null, no unhandled exception)
    const decision = await coordinator.analyzeUrl(4, 'https://any-website.com');
    expect(decision).toBeNull();
    expect(document.querySelector('verdict-warning-container')).toBeNull();
  });
});
