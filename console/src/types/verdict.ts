export type VerdictClassification = 'SAFE' | 'CAUTION' | 'DANGER';

export interface VerdictPolicyRule {
  ruleId: string;
  name: string;
  matched: boolean;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';
  description: string;
}

export interface VerdictRecord {
  investigationId: string;
  classification: VerdictClassification;
  threatScore: number; // 0 - 100
  confidence: number; // 0 - 100
  title: string;
  message: string;
  primaryReasons: string[];
  supportingEvidenceIds: string[];
  recommendedUserAction: 'BLOCK_AND_RETURN' | 'WARN_AND_PROCEED' | 'ALLOW_BROWSING';
  decisionPolicyRules: VerdictPolicyRule[];
  timestamp: number;
  extensionNotified: boolean;
  notifiedAt?: number;
}
