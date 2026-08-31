import { describe, expect, it, beforeEach, vi } from 'vitest';
import { WarningOverlayManager } from '../../src/content/warning/WarningOverlay.ts';
import type { VerdictDecision } from '../../src/shared/types/decision.ts';

describe('WarningOverlayManager & Security Capsule', () => {
  let manager: WarningOverlayManager;

  beforeEach(() => {
    document.documentElement.innerHTML = '<html><body><div id="content">Website Content</div></body></html>';
    manager = new WarningOverlayManager();
  });

  it('should render floating security capsule when showScanning is called', () => {
    manager.showScanning();

    const host = document.querySelector('verdict-warning-container');
    expect(host).not.toBeNull();
    expect(host?.shadowRoot).not.toBeNull();

    const shadow = host?.shadowRoot;
    const pill = shadow?.querySelector('.verdict-floating-pill');
    expect(pill).not.toBeNull();
    expect(pill?.textContent).toContain('Scanning');
    expect(pill?.textContent).toContain('Verdict');
  });

  it('should morph into Protected capsule when SAFE decision arrives and remain visible', () => {
    manager.showScanning();

    const safeDecision: VerdictDecision = {
      status: 'SAFE',
      title: 'Looks good',
      message: 'Verdict has no concerns about this site.',
      action: 'NONE',
      decisionId: 'test-safe-1',
      timestamp: Date.now(),
    };

    manager.showResult(safeDecision, vi.fn(), vi.fn());

    const host = document.querySelector('verdict-warning-container');
    const shadow = host?.shadowRoot;
    const pill = shadow?.querySelector('.verdict-floating-pill.status-safe');
    expect(pill).not.toBeNull();
    expect(pill?.textContent).toContain('Safe');
    expect(pill?.textContent).toContain('Verdict');
  });

  it('should morph into Caution banner when CAUTION decision arrives', () => {
    const onDismiss = vi.fn();
    const cautionDecision: VerdictDecision = {
      status: 'CAUTION',
      title: 'Be careful here',
      message: 'Unverified merchant. Proceed with care.',
      action: 'WARN',
      decisionId: 'test-caution-1',
      timestamp: Date.now(),
    };

    manager.showResult(cautionDecision, vi.fn(), onDismiss);

    const host = document.querySelector('verdict-warning-container');
    const shadow = host?.shadowRoot;
    const pill = shadow?.querySelector('.verdict-floating-pill.status-caution');
    expect(pill).not.toBeNull();
    expect(pill?.textContent).toContain('Caution');
    expect(pill?.textContent).toContain('Unverified merchant');

    const closeBtn = shadow?.querySelector('#verdict-pill-close-btn') as HTMLButtonElement | null;
    expect(closeBtn).not.toBeNull();
    closeBtn?.click();
    expect(onDismiss).toHaveBeenCalled();
  });

  it('should render high-priority safety intervention when DANGER decision arrives', () => {
    const onTakeMeBack = vi.fn();
    const onDismiss = vi.fn();

    const dangerDecision: VerdictDecision = {
      status: 'DANGER',
      title: "Don't pay here",
      message: 'This looks like a fake shop. Your money may not be safe.',
      action: 'GO_BACK',
      decisionId: 'test-danger-1',
      timestamp: Date.now(),
    };

    manager.showResult(dangerDecision, onTakeMeBack, onDismiss);

    const host = document.querySelector('verdict-warning-container');
    const shadow = host?.shadowRoot;
    const backdrop = shadow?.querySelector('.verdict-danger-backdrop');
    expect(backdrop).not.toBeNull();
    expect(backdrop?.textContent).toContain("Don't pay here");

    const backBtn = shadow?.querySelector('#verdict-back-btn') as HTMLButtonElement | null;
    expect(backBtn).not.toBeNull();
    backBtn?.click();
    expect(onTakeMeBack).toHaveBeenCalled();
  });
});
