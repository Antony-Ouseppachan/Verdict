/**
 * Security Data Redaction Utility
 * Strictly masks sensitive financial and personal credentials in telemetry and sandbox inspectors.
 */

// Matches common 13-19 digit card formats (Visa, MasterCard, Amex, Discover, etc.)
const CREDIT_CARD_REGEX = /\b(?:\d[ -]*?){13,19}\b/g;

// Matches Bearer / API / JWT Tokens
const BEARER_TOKEN_REGEX = /Bearer\s+[A-Za-z0-9\-_.]+/gi;
const JWT_REGEX = /eyJ[A-Za-z0-9-_]+\.eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g;

// Matches sensitive key-value pairs in URLs/query params or form payloads
const SENSITIVE_KV_REGEX = /(password|passwd|pwd|cvv|cvc|card_num|secret|auth_token|api_key)=([^&\s]+)/gi;

export function redactSensitiveText(input: string | undefined | null): string {
  if (!input) return '';

  let sanitized = String(input);

  // 1. Redact credit card numbers
  sanitized = sanitized.replace(CREDIT_CARD_REGEX, (match) => {
    const digitsOnly = match.replace(/\D/g, '');
    if (digitsOnly.length >= 13 && digitsOnly.length <= 19) {
      const last4 = digitsOnly.slice(-4);
      return `•••• •••• •••• ${last4}`;
    }
    return match;
  });

  // 2. Redact Bearer / JWT authentication tokens
  sanitized = sanitized.replace(BEARER_TOKEN_REGEX, 'Bearer [REDACTED_AUTH_TOKEN]');
  sanitized = sanitized.replace(JWT_REGEX, '[REDACTED_JWT_SIGNATURE]');

  // 3. Redact query params / form fields
  sanitized = sanitized.replace(SENSITIVE_KV_REGEX, '$1=••••••••');

  return sanitized;
}

export function redactHeaders(headers: Record<string, string> | undefined): Record<string, string> {
  if (!headers) return {};
  const cleaned: Record<string, string> = {};

  for (const [key, value] of Object.entries(headers)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('authorization') ||
      lowerKey.includes('cookie') ||
      lowerKey.includes('set-cookie') ||
      lowerKey.includes('x-api-key') ||
      lowerKey.includes('secret')
    ) {
      cleaned[key] = '[REDACTED_SECURITY_HEADER]';
    } else {
      cleaned[key] = redactSensitiveText(value);
    }
  }

  return cleaned;
}
