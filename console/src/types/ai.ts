export interface EvidenceItem {
  id: string;
  category: 'DOMAIN' | 'SANDBOX' | 'PAYMENT' | 'BRAND' | 'CONTENT' | 'HEURISTIC';
  title: string;
  weight: 'CRITICAL' | 'HIGH' | 'SUPPORTING' | 'NEUTRAL';
  description: string;
}

export interface ConflictingSignal {
  id: string;
  title: string;
  benignInterpretation: string;
  maliciousInterpretation: string;
  resolutionRationale: string;
}

export interface RiskFactor {
  name: string;
  category: string;
  score: number; // 0 - 100
  impact: 'SEVERE' | 'MODERATE' | 'LOW';
}

export interface AIAnalysis {
  investigationId: string;
  assessmentSummary: string;
  keyFindings: string[];
  evidenceSupplied: EvidenceItem[];
  conflictingSignals: ConflictingSignal[];
  riskFactors: RiskFactor[];
  confidenceScore: number; // 0 - 100
  reasoningBriefing: string;
  recommendedAction: string;
  modelIdentifier: string;
  latencyMs: number;
}
