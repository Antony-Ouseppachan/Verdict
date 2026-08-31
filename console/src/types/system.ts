export interface WorkerNode {
  id: string;
  name: string;
  type: 'SANDBOX_RUNNER' | 'STATIC_PARSER' | 'AI_INFERENCE' | 'WHOIS_SCRAPER';
  status: 'ONLINE' | 'BUSY' | 'DEGRADED' | 'OFFLINE';
  activeSessions: number;
  maxCapacity: number;
  cpuPercent: number;
  memoryMb: number;
  uptimeSeconds: number;
  version: string;
}

export interface ServiceHealth {
  service: 'API_GATEWAY' | 'DECISION_ENGINE' | 'SANDBOX_POOL' | 'DATABASE' | 'AI_SERVICE' | 'THREAT_FEED';
  status: 'HEALTHY' | 'DEGRADED' | 'OUTAGE';
  latencyMs: number;
  p99LatencyMs: number;
  errorRatePercent: number;
  lastChecked: number;
}

export interface QueueMetrics {
  pendingCount: number;
  processingCount: number;
  completedToday: number;
  failedToday: number;
  avgWaitMs: number;
  avgProcessMs: number;
  throughputPerMinute: number;
}

export interface TelemetryLog {
  id: string;
  timestamp: number;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  source: string;
  message: string;
  investigationId?: string;
}

export interface SystemHealth {
  overallStatus: 'OPERATIONAL' | 'DEGRADED' | 'OUTAGE';
  services: ServiceHealth[];
  workers: WorkerNode[];
  queue: QueueMetrics;
  recentLogs: TelemetryLog[];
  requestsToday: {
    total: number;
    safe: number;
    caution: number;
    danger: number;
  };
}
