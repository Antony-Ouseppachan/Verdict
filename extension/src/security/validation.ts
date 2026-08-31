import { z } from 'zod';

export const VerdictEngineStatusSchema = z.enum(['SAFE', 'CAUTION', 'DANGER']);
export const VerdictActionSchema = z.enum(['NONE', 'WARN', 'GO_BACK']);

export const VerdictDecisionSchema = z.object({
  status: VerdictEngineStatusSchema,
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  action: VerdictActionSchema,
  explanationAvailable: z.boolean().optional(),
  decisionId: z.string().optional(),
  timestamp: z.number().optional(),
});

export const PageSignalsSchema = z.object({
  url: z.string().url(),
  origin: z.string(),
  hostname: z.string(),
  protocol: z.string(),
  title: z.string(),
  canonicalUrl: z.string().optional(),
  metaDescription: z.string().optional(),
  hasSsl: z.boolean(),
});

export const FormInputMetadataSchema = z.object({
  type: z.string(),
  nameAttribute: z.string().optional(),
  autocomplete: z.string().optional(),
  isRequired: z.boolean(),
});

export const FormMetadataSchema = z.object({
  action: z.string().optional(),
  method: z.string().optional(),
  isHttpsAction: z.boolean(),
  inputs: z.array(FormInputMetadataSchema),
  hasPasswordField: z.boolean(),
  hasPaymentFields: z.boolean(),
});

export const PaymentSignalsSchema = z.object({
  hasPaymentForm: z.boolean(),
  detectedGateways: z.array(z.string()),
  hasCheckoutButton: z.boolean(),
  hasCartIndicator: z.boolean(),
  currencySymbolsDetected: z.array(z.string()),
});

export const NavigationSignalsSchema = z.object({
  referrer: z.string(),
  isIframe: z.boolean(),
  frameDepth: z.number(),
  hasHistoryTransitions: z.boolean(),
});

export const BrandSignalsSchema = z.object({
  claimedBrandName: z.string().optional(),
  copyrightClaim: z.string().optional(),
  logoAltTexts: z.array(z.string()),
  faviconUrl: z.string().optional(),
});

export const SecuritySignalsSchema = z.object({
  isSecureContext: z.boolean(),
  protocol: z.string(),
  hasMixedContentWarnings: z.boolean(),
  hasCertificateIssue: z.boolean(),
});

export const VerdictSignalsSchema = z.object({
  schemaVersion: z.string(),
  collectorVersion: z.string(),
  timestamp: z.number(),
  deviceId: z.string().optional(),
  page: PageSignalsSchema,
  forms: z.array(FormMetadataSchema),
  payment: PaymentSignalsSchema,
  navigation: NavigationSignalsSchema,
  brand: BrandSignalsSchema,
  security: SecuritySignalsSchema,
});

export const ExtensionMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('COLLECT_SIGNALS') }),
  z.object({
    type: z.literal('SIGNALS_COLLECTED'),
    payload: z.object({ signals: VerdictSignalsSchema }),
  }),
  z.object({ type: z.literal('GET_PROTECTION_STATE') }),
  z.object({
    type: z.literal('SET_PROTECTION_STATE'),
    payload: z.object({ enabled: z.boolean() }),
  }),
  z.object({ type: z.literal('GET_OVERLAY_STATE') }),
  z.object({
    type: z.literal('SET_OVERLAY_STATE'),
    payload: z.object({ enabled: z.boolean() }),
  }),
  z.object({
    type: z.literal('GET_CURRENT_DECISION'),
    payload: z.object({ tabId: z.number().optional() }).optional(),
  }),
  z.object({ type: z.literal('GET_ACTIVE_TAB_INFO') }),
  z.object({ type: z.literal('GET_DASHBOARD_DATA') }),
  z.object({ type: z.literal('CLEAR_HISTORY') }),
  z.object({
    type: z.literal('SHOW_DECISION'),
    payload: z.object({ decision: VerdictDecisionSchema }),
  }),
  z.object({
    type: z.literal('DISMISS_WARNING'),
    payload: z.object({ decisionId: z.string().optional() }).optional(),
  }),
  z.object({ type: z.literal('NAVIGATE_BACK') }),
]);
