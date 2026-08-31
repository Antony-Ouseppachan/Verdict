import { describe, expect, it } from 'vitest';
import { MockVerdictClient } from '../../src/api/client.ts';
import { ProtectionCoordinator } from '../../src/background/protection.ts';
import { setProtectionState } from '../../src/storage/protectionState.ts';
import { mockSafeSignals } from '../fixtures/signals.fixture.ts';

describe('Integration Flow: Graceful Engine Failure Handling', () => {
  it('should not break or throw when decision engine is unavailable', async () => {
    await setProtectionState(true);
    const client = new MockVerdictClient();
    const coordinator = new ProtectionCoordinator(client);

    const offlineSignals = {
      ...mockSafeSignals,
      page: {
        ...mockSafeSignals.page,
        hostname: 'engine-down.example.com',
      },
    };

    // Should resolve smoothly to null without throwing unhandled exceptions
    const decision = await coordinator.analyzeSignals(5, offlineSignals);
    expect(decision).toBeNull();
  });
});
