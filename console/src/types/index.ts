export type VerdictStatus = 'SAFE' | 'SUSPICIOUS' | 'HIGH RISK';

export type FindingSeverity = 'high' | 'medium' | 'low';
export type FindingCategory = 'url' | 'payment' | 'html' | 'code' | 'brand' | 'network' | 'security';

export interface ModelScores {
  urlScore: number;
  htmlProbability: number;
  paymentProbability: number;
}

export interface SecurityFinding {
  severity: FindingSeverity;
  category: FindingCategory;
  title: string;
  description: string;
}

export interface PaymentAnalysis {
  paymentDetected: boolean;
  cardInput: boolean;
  cvvInput: boolean;
  expiryInput: boolean;
  upiInput: boolean;
  otpInput: boolean;
  externalForm: boolean;
  externalIframe: boolean;
  providerDetected: string | null;
  detectedProviders: string[];
  providerMismatch: boolean;
  sensitivePaymentCombo: boolean;
  otpPaymentCombo: boolean;
}

export interface FeedEvent {
  id: string;
  timestamp: number;
  url: string;
  finalUrl: string;
  hostname: string;
  verdict: VerdictStatus;
  riskScore: number;
  models: ModelScores;
  findings: SecurityFinding[];
  analysis: PaymentAnalysis;
  telemetry?: {
    url?: {
      hostname?: string;
      scheme?: string;
      length?: number;
      num_dots?: number;
      num_hyphens?: number;
      has_ip_host?: boolean;
      is_https?: boolean;
      subdomain_count?: number;
      url_score?: number;
    };
    html?: {
      length?: number;
      formCount?: number;
      inputCount?: number;
      iframeCount?: number;
      scriptCount?: number;
    };
    httpStatus?: number;
    fetchDurationSeconds?: number;
  };
  scanDuration: number;
  initiator?: string;
}

export interface AnalyzeResponse {
  success: boolean;
  id?: string;
  requestId?: string;
  url: string;
  finalUrl: string;
  verdict: VerdictStatus;
  riskScore: number;
  models: ModelScores;
  findings: SecurityFinding[];
  analysis: PaymentAnalysis;
  telemetry?: Record<string, any>;
  scanDuration: number;
}

export interface BenchmarkMetrics {
  url_model: {
    name: string;
    roc_auc: number;
    features: number;
    type: string;
  };
  html_model: {
    name: string;
    roc_auc: number;
    features: number;
    type: string;
  };
  payment_model: {
    name: string;
    roc_auc: number;
    features: number;
    type: string;
  };
  risk_engine: {
    name: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
    features: number;
    type: string;
  };
}

export interface HealthResponse {
  status: string;
  version: string;
  modelsLoaded: boolean;
  models: Record<string, string>;
  benchmarkMetrics: BenchmarkMetrics;
}

export interface EventsResponse {
  success: boolean;
  total: number;
  events: FeedEvent[];
}
