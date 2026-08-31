import { describe, expect, it } from 'vitest';
import { ExtensionMessageSchema } from '../../src/security/validation.ts';
import { mockSafeSignals } from '../fixtures/signals.fixture.ts';

describe('IPC Messaging Validation', () => {
  it('should accept valid messages', () => {
    const validCollect = { type: 'COLLECT_SIGNALS' };
    const validState = { type: 'GET_PROTECTION_STATE' };
    const validSet = {
      type: 'SET_PROTECTION_STATE',
      payload: { enabled: false },
    };
    const validSignals = {
      type: 'SIGNALS_COLLECTED',
      payload: { signals: mockSafeSignals },
    };

    expect(ExtensionMessageSchema.safeParse(validCollect).success).toBe(true);
    expect(ExtensionMessageSchema.safeParse(validState).success).toBe(true);
    expect(ExtensionMessageSchema.safeParse(validSet).success).toBe(true);
    expect(ExtensionMessageSchema.safeParse(validSignals).success).toBe(true);
  });

  it('should reject malformed or untrusted message payloads', () => {
    const invalidType = { type: 'UNKNOWN_COMMAND' };
    const invalidSet = { type: 'SET_PROTECTION_STATE', payload: { enabled: 'yes' } };
    const missingPayload = { type: 'SIGNALS_COLLECTED' };

    expect(ExtensionMessageSchema.safeParse(invalidType).success).toBe(false);
    expect(ExtensionMessageSchema.safeParse(invalidSet).success).toBe(false);
    expect(ExtensionMessageSchema.safeParse(missingPayload).success).toBe(false);
  });
});
