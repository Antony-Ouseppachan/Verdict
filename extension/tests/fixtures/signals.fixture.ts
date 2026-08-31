import type { VerdictSignals } from '../../src/shared/types/signals.ts';

export const mockSafeSignals: VerdictSignals = {
  schemaVersion: '1.0.0',
  collectorVersion: '0.1.0',
  timestamp: 1710000000000,
  deviceId: 'device-test-1234',
  page: {
    url: 'https://example-shop.com/products/item-1?utm_source=google',
    origin: 'https://example-shop.com',
    hostname: 'example-shop.com',
    protocol: 'https:',
    title: 'Example Store - Official Products',
    canonicalUrl: 'https://example-shop.com/products/item-1',
    metaDescription: 'Buy official high quality items safely.',
    hasSsl: true,
  },
  forms: [
    {
      action: 'https://example-shop.com/checkout',
      method: 'POST',
      isHttpsAction: true,
      hasPasswordField: false,
      hasPaymentFields: false,
      inputs: [
        {
          type: 'text',
          nameAttribute: 'shipping_address',
          autocomplete: 'street-address',
          isRequired: true,
        },
      ],
    },
  ],
  payment: {
    hasPaymentForm: true,
    detectedGateways: ['Stripe'],
    hasCheckoutButton: true,
    hasCartIndicator: true,
    currencySymbolsDetected: ['$', '€'],
  },
  navigation: {
    referrer: 'https://google.com',
    isIframe: false,
    frameDepth: 0,
    hasHistoryTransitions: true,
  },
  brand: {
    claimedBrandName: 'Example Store',
    copyrightClaim: 'Example Store Inc.',
    logoAltTexts: ['Example Store Logo'],
    faviconUrl: 'https://example-shop.com/favicon.ico',
  },
  security: {
    isSecureContext: true,
    protocol: 'https:',
    hasMixedContentWarnings: false,
    hasCertificateIssue: false,
  },
};

export const mockDangerSignals: VerdictSignals = {
  ...mockSafeSignals,
  page: {
    ...mockSafeSignals.page,
    url: 'https://fake-shop-phishing-deal.com/login',
    origin: 'https://fake-shop-phishing-deal.com',
    hostname: 'fake-shop-phishing-deal.com',
    title: 'Brand Impersonator Store - 99% Discount',
  },
};

export const mockCautionSignals: VerdictSignals = {
  ...mockSafeSignals,
  page: {
    ...mockSafeSignals.page,
    url: 'https://suspicious-unverified-store.com/checkout',
    origin: 'https://suspicious-unverified-store.com',
    hostname: 'suspicious-unverified-store.com',
    title: 'Unverified New Shop',
  },
};
