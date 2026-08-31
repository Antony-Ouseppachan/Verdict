import React from 'react';
import type { Investigation, PipelineStageId, StageStatus } from '../../types/index.ts';
import type { LucideIcon } from 'lucide-react';
import {
  Globe,
  Zap,
  Terminal,
  Activity,
  CreditCard,
  Fingerprint,
  Layers,
  BrainCircuit,
  ShieldCheck,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import { formatDuration } from '../../utils/formatters.ts';

interface StagePipelineProps {
  investigation: Investigation;
  selectedStage: PipelineStageId | null;
  onSelectStage: (stage: PipelineStageId) => void;
}

const STAGE_CONFIG: Array<{
  id: PipelineStageId;
  label: string;
  sub: string;
  icon: LucideIcon;
}> = [
  { id: 'URL_RECEIVED', label: 'URL Received', sub: 'Ingestion & Normalization', icon: Globe },
  { id: 'FAST_ANALYSIS', label: 'Fast Intelligence', sub: 'DNS & WHOIS Reputation', icon: Zap },
  { id: 'SANDBOX', label: 'Sandbox Dispatch', sub: 'Headless Browser Run', icon: Terminal },
  { id: 'BEHAVIOR_ANALYSIS', label: 'Behavioral Analysis', sub: 'DOM & Script Hooks', icon: Activity },
  { id: 'PAYMENT_ANALYSIS', label: 'Payment Forensics', sub: 'Gateway & Tokenization', icon: CreditCard },
  { id: 'BRAND_ANALYSIS', label: 'Brand & Trademark', sub: 'Typo-squatting & Spoofing', icon: Fingerprint },
  { id: 'EVIDENCE_AGGREGATION', label: 'Evidence Aggregation', sub: 'Signal Synthesis', icon: Layers },
  { id: 'AI_REASONING', label: 'AI Investigator', sub: 'Forensic Evaluation', icon: BrainCircuit },
  { id: 'DECISION_POLICY', label: 'Decision Policy', sub: 'Rule Matrix Enforcement', icon: ShieldCheck },
  { id: 'EXTENSION_RESPONSE', label: 'Extension Response', sub: 'Live Client Advisory', icon: Send },
];

export const StagePipeline: React.FC<StagePipelineProps> = ({
  investigation,
  selectedStage,
  onSelectStage,
}) => {
  const getStatusIcon = (status: StageStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 size={14} className="text-emerald-400" />;
      case 'RUNNING':
        return <Loader2 size={14} className="text-sky-400 animate-spin" />;
      case 'FAILED':
        return <AlertCircle size={14} className="text-crimson-400" />;
      case 'PENDING':
      default:
        return <Clock size={14} className="text-slate-500" />;
    }
  };

  const completedCount = STAGE_CONFIG.filter(
    (c) => investigation.stages[c.id]?.status === 'COMPLETED'
  ).length;

  const totalDuration = Object.values(investigation.stages).reduce(
    (acc, curr) => acc + (curr.durationMs || 0),
    0
  );

  return (
    <div className="console-pipeline-container">
      <div className="console-pipeline-header">
        <div className="console-pipeline-title-group">
          <Layers size={16} className="text-sky-400" />
          <h3 className="console-pipeline-title">Pipeline Execution Stages</h3>
          <span className="console-pipeline-count-pill font-mono">
            {completedCount}/{STAGE_CONFIG.length} COMPLETED
          </span>
          {totalDuration > 0 && (
            <span className="console-pipeline-time-pill font-mono">
              {formatDuration(totalDuration)}
            </span>
          )}
        </div>

        <div className="console-pipeline-legend">
          <span className="legend-item"><span className="legend-dot status-completed" /> Completed</span>
          <span className="legend-item"><span className="legend-dot status-running" /> Running</span>
          <span className="legend-item"><span className="legend-dot status-pending" /> Pending</span>
        </div>
      </div>

      <div className="console-pipeline-track">
        {STAGE_CONFIG.map((config, index) => {
          const stageInfo = investigation.stages[config.id] || { status: 'PENDING' };
          const Icon = config.icon;
          const isSelected = selectedStage === config.id;
          const status = stageInfo.status;

          return (
            <React.Fragment key={config.id}>
              <div
                className={`console-stage-node status-${status.toLowerCase()} ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onSelectStage(config.id)}
                role="button"
                tabIndex={0}
                title={`Click to inspect forensic telemetry for: ${config.label}`}
              >
                <div className="console-stage-card-top">
                  <span className="console-stage-num font-mono">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div className="console-stage-mini-status">
                    {getStatusIcon(status)}
                  </div>
                </div>

                <div className="console-stage-icon-circle">
                  <Icon size={16} />
                </div>

                <div className="console-stage-info">
                  <div className="console-stage-label">{config.label}</div>
                  <div className="console-stage-sub">{config.sub.split('&')[0].trim()}</div>
                  <div className="console-stage-duration font-mono">
                    {stageInfo.durationMs !== undefined ? formatDuration(stageInfo.durationMs) : status}
                  </div>
                </div>

                {isSelected && <div className="console-stage-indicator-bar" />}
              </div>

              {index < STAGE_CONFIG.length - 1 && (
                <div
                  className={`console-pipeline-connector status-${status.toLowerCase()}`}
                  aria-hidden="true"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

