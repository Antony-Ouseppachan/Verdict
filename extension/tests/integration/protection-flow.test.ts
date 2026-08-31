import { describe, expect, it } from 'vitest';
import { MockVerdictClient } from '../../src/api/client.ts';
import { ProtectionCoordinator } from '../../src/background/protection.ts';
import { WarningOverlayManager } from '../../src/content/warning/WarningOverlay.ts';
import { setProtectionState } from '../../src/storage/protectionState.ts';
import {
  mockCautionSignals,
  mockDangerSignals,
  mockSafeSignals,
} from '../fixtures/signals.fixture.ts';

describe('Integration Flow: Autonomous Protection Cycle', () => {
  it('should remain completely silent when page is SAFE', async () => {
    await setProtectionState(true);
    const client = new MockVerdictClient();
    const coordinator = new ProtectionCoordinator(client);

    const decision = await coordinator.analyzeSignals(1, mockSafeSignals);

    expect(decision).not.toBeNull();
    expect(decision?.status).toBe('SAFE');
    expect(decision?.action).toBe('NONE');
  });

  it('should render non-blocking caution banner on CAUTION site', async () => {
    await setProtectionState(true);
    const client = new MockVerdictClient();
    const coordinator = new ProtectionCoordinator(client);

    const decision = await coordinator.analyzeSignals(2, mockCautionSignals);

    expect(decision?.status).toBe('CAUTION');
    expect(decision?.action).toBe('WARN');

    // Test warning overlay rendering
    const overlay = new WarningOverlayManager();
    overlay.render(
      decision!,
      () => {},
      () => {}
    );

    const container = document.querySelector('verdict-warning-container');
    expect(container).not.toBeNull();

    overlay.removeWarning();
    expect(document.querySelector('verdict-warning-container')).toBeNull();
  });

  it('should render strong safety intervention on DANGER site', async () => {
    await setProtectionState(true);
    const client = new MockVerdictClient();
    const coordinator = new ProtectionCoordinator(client);

    const decision = await coordinator.analyzeSignals(3, mockDangerSignals);

    expect(decision?.status).toBe('DANGER');
    expect(decision?.action).toBe('GO_BACK');
    expect(decision?.title).toBe("Don't pay here");

    const overlay = new WarningOverlayManager();
    let tookBack = false;
    let dismissed = false;

    overlay.render(
      decision!,
      () => {
        tookBack = true;
      },
      () => {
        dismissed = true;
      }
    );

    const container = document.querySelector('verdict-warning-container');
    expect(container).not.toBeNull();

    overlay.removeWarning();
    expect(tookBack).toBe(false);
    expect(dismissed).toBe(false);
  });

  it('should skip analysis when protection is disabled (OFF)', async () => {
    await setProtectionState(false);
    const client = new MockVerdictClient();
    const coordinator = new ProtectionCoordinator(client);

    const decision = await coordinator.analyzeSignals(4, mockDangerSignals);
    expect(decision).toBeNull();
  });
});
