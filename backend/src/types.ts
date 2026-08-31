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

export interface AnalyzePayload {
  url?: string;
  hostname?: string;
  timestamp?: number;
  signals?: {
    page?: {
      url?: string;
      hostname?: string;
    };
  };
}
