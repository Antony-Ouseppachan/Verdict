export type VerdictEngineStatus = 'SAFE' | 'CAUTION' | 'DANGER';

export type VerdictAction = 'NONE' | 'WARN' | 'GO_BACK';

export interface VerdictDecision {
  status: VerdictEngineStatus;
  title: string;
  message: string;
  action: VerdictAction;
  explanationAvailable?: boolean;
  decisionId?: string;
  timestamp?: number;
}

export interface VerdictAnalysisResponse {
  decision: VerdictDecision;
  requestId: string;
  cached?: boolean;
}

export interface ProtectionEventItem {
  id: string;
  url: string;
  hostname: string;
  timestamp: number;
  status: VerdictEngineStatus;
  title: string;
  message: string;
  action: VerdictAction;
  actionTaken: 'Allowed' | 'Warned' | 'Blocked' | 'Overridden';
  reasons?: string[];
  recommendation?: string;
  technicalDetails?: {
    requestId?: string;
    protocol?: string;
    latencyMs?: number;
    detectionEngine?: string;
    signalsMatched?: string[];
  };
}

export interface ProtectionStats {
  sitesChecked: number;
  warningsIssued: number;
  threatsPrevented: number;
  lastAnalysisTimestamp?: number;
}

export interface ActiveTabInfo {
  url: string;
  hostname: string;
  title?: string;
  decision?: VerdictDecision;
}
