import { describe, expect, it } from 'vitest';
import {
  getDomainFromUrl,
  isValidBrowsingUrl,
  sanitizeAndNormalizeUrl,
} from '../../src/security/url.ts';

describe('URL Security & Sanitization', () => {
  it('should accept valid HTTP and HTTPS URLs', () => {
    expect(isValidBrowsingUrl('https://example.com')).toBe(true);
    expect(isValidBrowsingUrl('http://insecure-store.com/shop')).toBe(true);
    expect(isValidBrowsingUrl('https://sub.domain.co.uk/path?q=1')).toBe(true);
  });

  it('should reject internal browser URLs and non-browsing protocols', () => {
    expect(isValidBrowsingUrl('chrome://settings')).toBe(false);
    expect(isValidBrowsingUrl('chrome-extension://abcdef/popup.html')).toBe(false);
    expect(isValidBrowsingUrl('about:blank')).toBe(false);
    expect(isValidBrowsingUrl('file:///C:/Users/test/doc.html')).toBe(false);
    expect(isValidBrowsingUrl('data:text/html,<h1>Test</h1>')).toBe(false);
    expect(isValidBrowsingUrl('javascript:alert(1)')).toBe(false);
    expect(isValidBrowsingUrl('http://localhost:3000')).toBe(false);
    expect(isValidBrowsingUrl('http://127.0.0.1:5173')).toBe(false);
    expect(isValidBrowsingUrl('')).toBe(false);
    expect(isValidBrowsingUrl(null)).toBe(false);
    expect(isValidBrowsingUrl(undefined)).toBe(false);
  });

  it('should strip tracking and sensitive query parameters', () => {
    const raw =
      'https://example.com/checkout?item=123&utm_source=twitter&utm_medium=cpc&fbclid=IwAR0&token=secret_jwt_token#section2';
    const normalized = sanitizeAndNormalizeUrl(raw);

    expect(normalized).toBe('https://example.com/checkout?item=123');
  });

  it('should extract lowercase domain correctly', () => {
    expect(getDomainFromUrl('https://SUB.Example.COM/path')).toBe('sub.example.com');
    expect(getDomainFromUrl('invalid-url')).toBe('');
  });
});
