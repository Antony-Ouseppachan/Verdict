export interface PageSignals {
  url: string;
  origin: string;
  hostname: string;
  protocol: string;
  title: string;
  canonicalUrl?: string;
  metaDescription?: string;
  hasSsl: boolean;
}

export interface FormInputMetadata {
  type: string;
  nameAttribute?: string;
  autocomplete?: string;
  isRequired: boolean;
}

export interface FormMetadata {
  action?: string;
  method?: string;
  isHttpsAction: boolean;
  inputs: FormInputMetadata[];
  hasPasswordField: boolean;
  hasPaymentFields: boolean;
}

export interface PaymentSignals {
  hasPaymentForm: boolean;
  detectedGateways: string[];
  hasCheckoutButton: boolean;
  hasCartIndicator: boolean;
  currencySymbolsDetected: string[];
  isFakeGatewayImpersonation?: boolean;
  claimedGateways?: string[];
}

export interface NavigationSignals {
  referrer: string;
  isIframe: boolean;
  frameDepth: number;
  hasHistoryTransitions: boolean;
}

export interface BrandSignals {
  claimedBrandName?: string;
  copyrightClaim?: string;
  logoAltTexts: string[];
  faviconUrl?: string;
}

export interface SecuritySignals {
  isSecureContext: boolean;
  protocol: string;
  hasMixedContentWarnings: boolean;
  hasCertificateIssue: boolean;
}

export interface VerdictSignals {
  schemaVersion: string;
  collectorVersion: string;
  timestamp: number;
  deviceId?: string;
  page: PageSignals;
  forms: FormMetadata[];
  payment: PaymentSignals;
  navigation: NavigationSignals;
  brand: BrandSignals;
  security: SecuritySignals;
}
