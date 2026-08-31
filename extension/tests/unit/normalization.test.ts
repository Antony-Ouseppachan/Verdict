import { describe, expect, it } from 'vitest';
import { sanitizeSignals } from '../../src/collectors/normalization.ts';
import { mockSafeSignals } from '../fixtures/signals.fixture.ts';

describe('Signal Normalization Pipeline', () => {
  it('should normalize and validate valid signals', () => {
    const sanitized = sanitizeSignals(mockSafeSignals);

    expect(sanitized.schemaVersion).toBe('1.0.0');
    expect(sanitized.page.hostname).toBe('example-shop.com');
    expect(sanitized.payment.hasPaymentForm).toBe(true);
    expect(sanitized.payment.detectedGateways).toContain('Stripe');
  });

  it('should truncate overly long titles and claims', () => {
    const signalsWithLongStrings = {
      ...mockSafeSignals,
      page: {
        ...mockSafeSignals.page,
        title: 'A'.repeat(500),
      },
      brand: {
        ...mockSafeSignals.brand,
        claimedBrandName: 'B'.repeat(300),
      },
    };

    const sanitized = sanitizeSignals(signalsWithLongStrings);

    expect(sanitized.page.title.length).toBeLessThanOrEqual(200);
    expect(sanitized.brand.claimedBrandName?.length).toBeLessThanOrEqual(100);
  });
});
