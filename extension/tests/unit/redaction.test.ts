import { describe, expect, it } from 'vitest';
import { sanitizeSignals } from '../../src/collectors/normalization.ts';
import {
  isSensitiveKey,
  isSensitiveValue,
  redactObject,
} from '../../src/security/redaction.ts';
import { mockSafeSignals } from '../fixtures/signals.fixture.ts';

describe('Security & Data Minimization: Redaction Engine', () => {
  it('should detect sensitive property keys', () => {
    const sensitiveKeys = [
      'password',
      'currentPassword',
      'user_password',
      'secret',
      'clientSecret',
      'token',
      'access_token',
      'authToken',
      'bearer',
      'cardNumber',
      'cc_number',
      'card_no',
      'cvv',
      'cvc',
      'expDate',
      'expiration_month',
      'pin',
      'ssn',
      'cookie',
      'sessionId',
      'jwt',
      'apiKey',
      'privateKey',
    ];

    for (const key of sensitiveKeys) {
      expect(isSensitiveKey(key), `Expected ${key} to be detected as sensitive`).toBe(true);
    }
  });

  it('should detect sensitive string values like credit card numbers and CVVs', () => {
    // 16 digit card numbers (with and without spaces/dashes)
    expect(isSensitiveValue('4532 0156 7890 1234')).toBe(true);
    expect(isSensitiveValue('4532-0156-7890-1234')).toBe(true);
    expect(isSensitiveValue('4532015678901234')).toBe(true);

    // 3 or 4 digit CVV/CVC
    expect(isSensitiveValue('982')).toBe(true);
    expect(isSensitiveValue('1234')).toBe(true);

    // JWT token
    expect(
      isSensitiveValue(
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgN_pG_W_O'
      )
    ).toBe(true);

    // Non-sensitive values should pass
    expect(isSensitiveValue('Example Store')).toBe(false);
    expect(isSensitiveValue('https://example.com')).toBe(false);
    expect(isSensitiveValue('checkout')).toBe(false);
  });

  it('should strip sensitive keys and redact sensitive values from deep objects', () => {
    const dangerousPayload = {
      safeTitle: 'Shopping Cart',
      password: 'MySecretPassword123!',
      nested: {
        card_number: '4111 2222 3333 4444',
        cvv: '123',
        safeMeta: 'Stripe Gateway',
        auth: {
          token: 'secret-token-xyz',
          bearer: 'bearer-val',
        },
      },
      arrayItems: [
        { name: 'Item 1', price: '$20' },
        { session_id: 'session-abc-123' },
      ],
    };

    const sanitized = redactObject(dangerousPayload);

    // Ensure sensitive keys are stripped
    expect(sanitized).not.toHaveProperty('password');
    expect(sanitized.nested).not.toHaveProperty('card_number');
    expect(sanitized.nested).not.toHaveProperty('cvv');
    expect(sanitized.nested).not.toHaveProperty('auth');
    expect(sanitized.arrayItems[1]).not.toHaveProperty('session_id');

    // Ensure safe fields are intact
    expect(sanitized.safeTitle).toBe('Shopping Cart');
    expect(sanitized.nested.safeMeta).toBe('Stripe Gateway');
    expect(sanitized.arrayItems[0].name).toBe('Item 1');
  });

  it('CRITICAL PROOF: sanitizeSignals guarantees passwords, card numbers, and tokens cannot enter payload', () => {
    // Construct a signal object that accidentally had malicious or sensitive test data injected
    const contaminatedSignals = {
      ...mockSafeSignals,
      page: {
        ...mockSafeSignals.page,
        url: 'https://example.com/checkout?token=secret123&password=pass&utm_source=ad',
      },
      forms: [
        {
          action: 'https://example.com/login?auth_token=jwt123',
          method: 'POST',
          isHttpsAction: true,
          hasPasswordField: true,
          hasPaymentFields: true,
          inputs: [
            {
              type: 'password',
              nameAttribute: 'password',
              autocomplete: 'current-password',
              isRequired: true,
            },
          ],
        },
      ],
    };

    const outboundPayload = sanitizeSignals(contaminatedSignals);

    // 1. Check URL query stripping
    expect(outboundPayload.page.url).toBe('https://example.com/checkout');
    expect(outboundPayload.page.url).not.toContain('token');
    expect(outboundPayload.page.url).not.toContain('password');
    expect(outboundPayload.page.url).not.toContain('utm_source');

    // 2. Check form action URL stripping
    expect(outboundPayload.forms[0].action).toBe('https://example.com/login');
    expect(outboundPayload.forms[0].action).not.toContain('auth_token');

    // 3. Ensure no input element in the payload has a 'value' property
    for (const form of outboundPayload.forms) {
      for (const input of form.inputs) {
        expect(input).not.toHaveProperty('value');
      }
    }
  });
});
