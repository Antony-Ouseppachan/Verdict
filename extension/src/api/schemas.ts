import { z } from 'zod';
import {
  VerdictDecisionSchema,
  VerdictSignalsSchema,
} from '../security/validation.ts';

export const AnalyzePageRequestSchema = z.object({
  signals: VerdictSignalsSchema,
  clientTimestamp: z.number(),
});

export const AnalyzePageResponseSchema = z.preprocess(
  (val: unknown) => {
    if (typeof val === 'object' && val !== null) {
      const obj = val as Record<string, unknown>;
      if (obj.status && obj.title && obj.message && obj.action && !obj.decision) {
        return {
          decision: {
            status: obj.status,
            title: obj.title,
            message: obj.message,
            action: obj.action,
            explanationAvailable: Boolean(obj.explanationAvailable),
            decisionId: typeof obj.decisionId === 'string' ? obj.decisionId : undefined,
            timestamp: typeof obj.timestamp === 'number' ? obj.timestamp : Date.now(),
          },
          requestId: typeof obj.requestId === 'string' ? obj.requestId : `req-${Date.now()}`,
          cached: Boolean(obj.cached),
        };
      }
    }
    return val;
  },
  z.object({
    decision: VerdictDecisionSchema,
    requestId: z.string(),
    cached: z.boolean().optional(),
  })
);

export const RegisterDeviceRequestSchema = z.object({
  deviceId: z.string(),
  extensionVersion: z.string(),
  platform: z.string(),
});

export const RegisterDeviceResponseSchema = z.object({
  registered: z.boolean(),
  deviceId: z.string(),
});

export const ProtectionEventRequestSchema = z.object({
  eventType: z.enum(['WARNING_SHOWN', 'WARNING_DISMISSED', 'NAVIGATE_BACK']),
  decisionId: z.string().optional(),
  url: z.string(),
  timestamp: z.number(),
});

export const ProtectionEventResponseSchema = z.object({
  acknowledged: z.boolean(),
});
