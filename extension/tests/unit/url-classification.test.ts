import { describe, expect, it } from 'vitest';
import {
  classifyPage,
  isSearchEngineUrl,
  isValidBrowsingUrl,
  isLocalhostUrl,
} from '../../src/security/url.ts';

describe('Page Classification & Search Engine Isolation', () => {
  describe('Search Engine Result Pages', () => {
    it('should classify Bing search URLs with threat queries as SEARCH_ENGINE', () => {
      const url = 'https://www.bing.com/search?q=scam+shoes+malware';
      expect(classifyPage(url)).toBe('SEARCH_ENGINE');
      expect(isSearchEngineUrl(url)).toBe(true);
      expect(isValidBrowsingUrl(url)).toBe(false);
    });

    it('should classify Google search URLs with payment queries as SEARCH_ENGINE', () => {
      const url = 'https://www.google.com/search?q=fake+payment+shop';
      expect(classifyPage(url)).toBe('SEARCH_ENGINE');
      expect(isSearchEngineUrl(url)).toBe(true);
      expect(isValidBrowsingUrl(url)).toBe(false);
    });

    it('should classify regional Google domains as SEARCH_ENGINE', () => {
      expect(classifyPage('https://google.co.uk/search?q=outlet')).toBe('SEARCH_ENGINE');
      expect(classifyPage('https://www.google.de/search?q=test')).toBe('SEARCH_ENGINE');
    });

    it('should classify DuckDuckGo queries as SEARCH_ENGINE', () => {
      const url = 'https://duckduckgo.com/?q=phishing+test';
      expect(classifyPage(url)).toBe('SEARCH_ENGINE');
      expect(isSearchEngineUrl(url)).toBe(true);
      expect(isValidBrowsingUrl(url)).toBe(false);
    });

    it('should classify Yahoo, Ecosia, Yandex, Baidu, and Brave as SEARCH_ENGINE', () => {
      expect(classifyPage('https://search.yahoo.com/search?p=scam')).toBe('SEARCH_ENGINE');
      expect(classifyPage('https://www.ecosia.org/search?q=counterfeit')).toBe('SEARCH_ENGINE');
      expect(classifyPage('https://yandex.com/search/?text=cheap')).toBe('SEARCH_ENGINE');
      expect(classifyPage('https://www.baidu.com/s?wd=test')).toBe('SEARCH_ENGINE');
      expect(classifyPage('https://search.brave.com/search?q=malicious')).toBe('SEARCH_ENGINE');
      expect(classifyPage('https://startpage.com/sp/search?query=test')).toBe('SEARCH_ENGINE');
      expect(classifyPage('https://kagi.com/search?q=test')).toBe('SEARCH_ENGINE');
    });
  });

  describe('Internal Browser Pages', () => {
    it('should classify chrome:// and edge:// as INTERNAL_BROWSER_PAGE', () => {
      expect(classifyPage('chrome://settings')).toBe('INTERNAL_BROWSER_PAGE');
      expect(classifyPage('chrome-extension://abcdef/popup.html')).toBe('INTERNAL_BROWSER_PAGE');
      expect(classifyPage('edge://extensions')).toBe('INTERNAL_BROWSER_PAGE');
      expect(classifyPage('about:blank')).toBe('INTERNAL_BROWSER_PAGE');
      expect(classifyPage('devtools://devtools/bundled/inspector.html')).toBe('INTERNAL_BROWSER_PAGE');
    });

    it('should classify localhost as INTERNAL_BROWSER_PAGE and exempt it', () => {
      expect(classifyPage('http://localhost:3000')).toBe('INTERNAL_BROWSER_PAGE');
      expect(classifyPage('http://127.0.0.1:5173')).toBe('INTERNAL_BROWSER_PAGE');
      expect(isLocalhostUrl('http://localhost:3000')).toBe(true);
      expect(isValidBrowsingUrl('http://localhost:3000')).toBe(false);
    });

    it('should allow security test fixtures on 127.0.0.1 matching /payment-test/ to be analyzed', () => {
      const testUrl = 'http://127.0.0.1:18452/payment-test/index.html';
      expect(isLocalhostUrl(testUrl)).toBe(false);
      expect(classifyPage(testUrl)).toBe('NORMAL_WEBSITE');
      expect(isValidBrowsingUrl(testUrl)).toBe(true);
    });
  });

  describe('Unsupported Protocols & Formats', () => {
    it('should classify file://, data:, and javascript: as UNSUPPORTED_PAGE', () => {
      expect(classifyPage('file:///C:/Users/test/document.html')).toBe('UNSUPPORTED_PAGE');
      expect(classifyPage('data:text/html,<h1>Malicious</h1>')).toBe('UNSUPPORTED_PAGE');
      expect(classifyPage('javascript:alert(1)')).toBe('UNSUPPORTED_PAGE');
      expect(classifyPage('blob:https://example.com/uuid')).toBe('UNSUPPORTED_PAGE');
      expect(classifyPage('')).toBe('UNSUPPORTED_PAGE');
      expect(classifyPage(null)).toBe('UNSUPPORTED_PAGE');
      expect(classifyPage(undefined)).toBe('UNSUPPORTED_PAGE');
      expect(classifyPage('not-a-valid-url')).toBe('UNSUPPORTED_PAGE');
    });
  });

  describe('Normal Destination Websites', () => {
    it('should classify public e-commerce and normal websites as NORMAL_WEBSITE', () => {
      expect(classifyPage('https://example-shop.com')).toBe('NORMAL_WEBSITE');
      expect(classifyPage('http://suspicious-store.com/checkout')).toBe('NORMAL_WEBSITE');
      expect(classifyPage('https://subdomain.retailer.co.uk/product/45')).toBe('NORMAL_WEBSITE');
      expect(isValidBrowsingUrl('https://example-shop.com')).toBe(true);
      expect(isValidBrowsingUrl('http://suspicious-store.com/checkout')).toBe(true);
    });
  });
});
