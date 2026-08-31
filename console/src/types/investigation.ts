export type InvestigationStatus = 'QUEUED' | 'ANALYZING' | 'COMPLETED' | 'FAILED';

export type PipelineStageId =
  | 'URL_RECEIVED'
  | 'FAST_ANALYSIS'
  | 'SANDBOX'
  | 'BEHAVIOR_ANALYSIS'
  | 'PAYMENT_ANALYSIS'
  | 'BRAND_ANALYSIS'
  | 'EVIDENCE_AGGREGATION'
  | 'AI_REASONING'
  | 'DECISION_POLICY'
  | 'EXTENSION_RESPONSE';

export type StageStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface PipelineStageInfo {
  id: PipelineStageId;
  name: string;
  shortName: string;
  status: StageStatus;
  startedAt?: number;
  completedAt?: number;
  durationMs?: number;
  error?: string;
  evidenceSummary?: string;
}

export interface Investigation {
  id: string; // Request ID e.g. req-2026-0831-9041
  url: string;
  hostname: string;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  durationMs?: number;
  status: InvestigationStatus;
  currentStage: PipelineStageId;
  stages: Record<PipelineStageId, PipelineStageInfo>;
  verdict?: 'SAFE' | 'CAUTION' | 'DANGER';
  threatScore?: number; // 0 - 100
  confidence?: number; // 0 - 100
  initiator: 'EXTENSION' | 'OPERATOR_REPLAY' | 'API';
  tags: string[];
}
