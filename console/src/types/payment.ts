export type PaymentProviderStatus = 'VERIFIED' | 'SUSPICIOUS' | 'UNVERIFIED' | 'NOT_DETECTED';

export interface PaymentSDK {
  name: string; // e.g. "Stripe.js", "PayPal JS SDK", "Adyen Web", "Direct Unverified Form"
  version?: string;
  sourceUrl: string;
  isAuthenticOrigin: boolean;
  integrityHashValid?: boolean;
}

export interface PaymentIframe {
  src: string;
  origin: string;
  isSandboxed: boolean;
  allowsPaymentRequest: boolean;
  isOfficialGatewayDomain: boolean;
}

export interface PaymentAnomaly {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
}

export interface PaymentFinding {
  investigationId: string;
  status: PaymentProviderStatus;
  detectedGateways: string[];
  sdks: PaymentSDK[];
  iframes: PaymentIframe[];
  paymentDomains: string[];
  checkoutUrls: string[];
  redirectChains: string[];
  anomalies: PaymentAnomaly[];
  collectsRawCardDataDirectly: boolean;
  cryptoWalletDetected: boolean;
  offPlatformTransferDetected: boolean;
  notes: string[];
}
