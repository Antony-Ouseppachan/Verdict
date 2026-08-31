// Legitimate metadata and schema keys that should never be stripped
const ALLOWED_METADATA_KEYS = new Set([
  'schemaVersion',
  'collectorVersion',
  'hasPasswordField',
  'hasPaymentFields',
  'hasPaymentForm',
  'detectedGateways',
  'hasCheckoutButton',
  'hasCartIndicator',
  'currencySymbolsDetected',
  'hasHistoryTransitions',
  'hasMixedContentWarnings',
  'hasCertificateIssue',
]);

// Blacklisted key patterns that must NEVER appear in outbound payloads
const SENSITIVE_KEY_PATTERNS = [
  /(^|[_-])pass(word)?([_-]|$)/i,
  /password/i,
  /secret/i,
  /token/i,
  /auth(orization)?/i,
  /bearer/i,
  /card(_)?(number|num|no)?/i,
  /cc(_)?(number|num|no|exp|cvv|cvc)?/i,
  /cvv/i,
  /cvc/i,
  /exp(ir(y|ation))?/i,
  /exp(_)?date/i,
  /(^|[_-])exp([_-]|$)/i,
  /(^|[_-])pan([_-]|$)/i,
  /(^|[_-])ssn([_-]|$)/i,
  /(^|[_-])pin([_-]|$)/i,
  /credit(_)?card/i,
  /account(_)?(number|no)/i,
  /(^|[_-])cookie([_-]|$)/i,
  /session(_)?(id)?/i,
  /jwt/i,
  /api(_)?key/i,
  /private(_)?key/i,
];

// Value patterns representing raw card numbers, CVVs, passwords or tokens
const SENSITIVE_VALUE_PATTERNS = [
  // Credit card format (Luhn candidates with/without dashes)
  /\b(?:\d{4}[ -]?){3}\d{4}\b/,
  // 3 or 4 digit CVV/CVC
  /\b\d{3,4}\b/,
  // Bearer tokens or JWTs (header.payload.signature where parts are base64 >= 10 chars)
  /^[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]+$/,
  // Hex/Base64 API keys or hashes > 24 chars
  /^[a-fA-F0-9]{32,64}$/,
];

export function isSensitiveKey(key: string): boolean {
  if (ALLOWED_METADATA_KEYS.has(key)) {
    return false;
  }
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

export function isSensitiveValue(value: string): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  return SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export function sanitizeString(value: string): string {
  if (!value || typeof value !== 'string') return '';
  let sanitized = value;

  // Mask card numbers
  sanitized = sanitized.replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, '[REDACTED_CARD]');
  
  // Truncate overly long text fields to avoid arbitrary payload dumping
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500) + '...';
  }

  return sanitized;
}

export function redactObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj) as unknown as T;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (isSensitiveKey(key)) {
      // Completely strip sensitive field
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      result[key] = redactObject(value);
    } else if (typeof value === 'string') {
      if (isSensitiveValue(value)) {
        continue;
      }
      result[key] = sanitizeString(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}
