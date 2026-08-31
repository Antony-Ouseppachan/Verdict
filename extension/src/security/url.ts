const UNSUPPORTED_PROTOCOLS = new Set([
  'chrome:',
  'chrome-extension:',
  'chrome-untrusted:',
  'edge:',
  'about:',
  'file:',
  'data:',
  'javascript:',
  'devtools:',
  'blob:',
  'view-source:',
]);

const SENSITIVE_QUERY_PARAM_PATTERNS = [
  /token/i,
  /auth/i,
  /key/i,
  /pass(word)?/i,
  /pwd/i,
  /secret/i,
  /session/i,
  /jwt/i,
  /code/i,
  /state/i,
  /bearer/i,
  /credential/i,
];

const TRACKING_QUERY_PARAMS_PREFIXES = ['utm_', 'fbclid', 'gclid', 'msclkid', 'mc_eid'];

export function isValidBrowsingUrl(rawUrl: string | undefined | null): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;

  try {
    const parsed = new URL(rawUrl);
    if (UNSUPPORTED_PROTOCOLS.has(parsed.protocol)) {
      return false;
    }
    // Completely skip localhost and local development targets from detection
    if (isLocalhostUrl(rawUrl)) {
      return false;
    }
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function sanitizeAndNormalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);

    // Filter sensitive and tracking query parameters
    const searchParams = new URLSearchParams(parsed.search);
    const keysToRemove: string[] = [];

    searchParams.forEach((_, key) => {
      const lowerKey = key.toLowerCase();
      if (
        SENSITIVE_QUERY_PARAM_PATTERNS.some((pattern) => pattern.test(lowerKey)) ||
        TRACKING_QUERY_PARAMS_PREFIXES.some((prefix) => lowerKey.startsWith(prefix))
      ) {
        keysToRemove.push(key);
      }
    });

    keysToRemove.forEach((k) => searchParams.delete(k));

    parsed.search = searchParams.toString();
    parsed.hash = ''; // Remove hash fragments

    return parsed.toString();
  } catch {
    return rawUrl;
  }
}

export function isLocalhostUrl(rawUrl: string | undefined | null): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '[::1]' ||
      host.endsWith('.local') ||
      host.endsWith('.localhost')
    );
  } catch {
    return false;
  }
}

export function getDomainFromUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    return parsed.hostname.toLowerCase();
  } catch {
    return '';
  }
}
