export type ConsoleEventType =
  | 'REQUEST_RECEIVED'
  | 'ANALYSIS_STARTED'
  | 'SIGNALS_COLLECTED'
  | 'SANDBOX_STARTED'
  | 'SANDBOX_EVENT'
  | 'PAYMENT_DETECTED'
  | 'BRAND_DETECTED'
  | 'ANALYSIS_COMPLETED'
  | 'AI_ANALYSIS_STARTED'
  | 'AI_ANALYSIS_COMPLETED'
  | 'VERDICT_GENERATED'
  | 'EXTENSION_NOTIFIED'
  | 'REQUEST_FAILED';

export interface ConsoleEvent {
  id: string;
  investigationId: string;
  type: ConsoleEventType;
  timestamp: number;
  message: string;
  payload?: Record<string, unknown>;
  severity?: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
}
