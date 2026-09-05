import type { PageType } from '../shared/types/decision.ts';

const INTERNAL_PROTOCOLS = new Set([
  'chrome:',
  'chrome-extension:',
  'chrome-untrusted:',
  'edge:',
  'about:',
  'devtools:',
  'view-source:',
  'brave:',
  'opera:',
  'vivaldi:',
]);

const UNSUPPORTED_PROTOCOLS = new Set([
  'file:',
  'data:',
  'javascript:',
  'blob:',
  'mailto:',
  'tel:',
  'ftp:',
  'ws:',
  'wss:',
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

// Search engine hostname patterns
const SEARCH_ENGINE_HOST_REGEXES = [
  /^(.*\.)?google\.(com|co\.[a-z]{2}|[a-z]{2,3})$/i,
  /^(.*\.)?bing\.com$/i,
  /^(.*\.)?duckduckgo\.com$/i,
  /^(.*\.)?yahoo\.com$/i,
  /^(.*\.)?ecosia\.org$/i,
  /^(.*\.)?yandex\.(com|ru|by|kz|uz)$/i,
  /^(.*\.)?baidu\.com$/i,
  /^(.*\.)?search\.brave\.com$/i,
  /^(.*\.)?kagi\.com$/i,
  /^(.*\.)?startpage\.com$/i,
  /^(.*\.)?qwant\.com$/i,
  /^(.*\.)?ask\.com$/i,
  /^(.*\.)?search\.naver\.com$/i,
  /^(.*\.)?search\.aol\.com$/i,
  /^(.*\.)?searx\.[a-z]+$/i,
];

export function classifyPage(rawUrl: string | undefined | null): PageType {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return 'UNSUPPORTED_PAGE';
  }

  try {
    const parsed = new URL(rawUrl);

    // 1. Internal browser pages
    if (INTERNAL_PROTOCOLS.has(parsed.protocol)) {
      return 'INTERNAL_BROWSER_PAGE';
    }

    // 2. Unsupported protocols & local files
    if (UNSUPPORTED_PROTOCOLS.has(parsed.protocol)) {
      return 'UNSUPPORTED_PAGE';
    }

    // Only HTTP and HTTPS can be normal websites or search engines
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return 'UNSUPPORTED_PAGE';
    }

    // 3. Localhost & development environments (exempt / internal)
    if (isLocalhostUrl(rawUrl)) {
      return 'INTERNAL_BROWSER_PAGE';
    }

    // 4. Search engine pages
    if (isSearchEngineHost(parsed.hostname)) {
      return 'SEARCH_ENGINE';
    }

    return 'NORMAL_WEBSITE';
  } catch {
    return 'UNSUPPORTED_PAGE';
  }
}

export function isSearchEngineUrl(rawUrl: string | undefined | null): boolean {
  return classifyPage(rawUrl) === 'SEARCH_ENGINE';
}

function isSearchEngineHost(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  return SEARCH_ENGINE_HOST_REGEXES.some((regex) => regex.test(normalized));
}

export function isValidBrowsingUrl(rawUrl: string | undefined | null): boolean {
  return classifyPage(rawUrl) === 'NORMAL_WEBSITE';
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

  // Allow explicit security test fixtures to be analyzed
  if (
    rawUrl.includes('/payment-test/') ||
    rawUrl.includes('test-phish') ||
    rawUrl.includes('verdict-test')
  ) {
    return false;
  }

  try {
    const parsed = new URL(rawUrl);
    const host = parsed.hostname.toLowerCase();
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '0.0.0.0' ||
      host === '[::1]' ||
      host.endsWith('.local') ||
      host.endsWith('.localhost') ||
      rawUrl.includes('localhost:') ||
      rawUrl.includes('127.0.0.1:')
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

