import React from 'react';
import type { PipelineStageId, Investigation } from '../../types/index.ts';
import {
  X,
  FileCode,
  ArrowRight,
} from 'lucide-react';
import { formatDuration, formatTimestamp } from '../../utils/formatters.ts';

interface StageEvidenceDrawerProps {
  stageId: PipelineStageId;
  investigation: Investigation;
  onClose: () => void;
  onNavigateToModule?: (module: string) => void;
}

export const StageEvidenceDrawer: React.FC<StageEvidenceDrawerProps> = ({
  stageId,
  investigation,
  onClose,
  onNavigateToModule,
}) => {
  const stageInfo = investigation.stages[stageId] || {
    id: stageId,
    name: stageId,
    shortName: stageId,
    status: 'PENDING',
  };

  const renderStageEvidenceContent = () => {
    switch (stageId) {
      case 'URL_RECEIVED':
        return (
          <div className="console-evidence-content">
            <h4 className="console-evidence-subheading">URL Ingestion &amp; Normalization Parameters</h4>
            <div className="console-key-val-table">
              <div className="console-kv-row"><span className="kv-key">Raw Target URL:</span><span className="kv-val font-mono">{investigation.url}</span></div>
              <div className="console-kv-row"><span className="kv-key">Normalized Hostname:</span><span className="kv-val font-mono">{investigation.hostname}</span></div>
              <div className="console-kv-row"><span className="kv-key">Initiator Source:</span><span className="kv-val">{investigation.initiator}</span></div>
              <div className="console-kv-row"><span className="kv-key">Ingestion Timestamp:</span><span className="kv-val font-mono">{formatTimestamp(investigation.createdAt)}</span></div>
            </div>
          </div>
        );

      case 'FAST_ANALYSIS':
        return (
          <div className="console-evidence-content">
            <h4 className="console-evidence-subheading">Fast Threat Intelligence Lookups</h4>
            <ul className="console-evidence-list">
              <li>DNS A/AAAA records resolved: 198.51.100.42 (Hostinger Panama)</li>
              <li>Top-Level Domain (.xyz) checked against high-risk disposable registrar lists</li>
              <li>WHOIS Privacy Shield detected: NameCheap Withheld for Privacy</li>
              <li>Initial threat score heuristic baseline computed: 35/100</li>
            </ul>
          </div>
        );

      case 'SANDBOX':
        return (
          <div className="console-evidence-content">
            <h4 className="console-evidence-subheading">Headless Sandbox Execution Summary</h4>
            <div className="console-key-val-table">
              <div className="console-kv-row"><span className="kv-key">Sandbox Worker Node:</span><span className="kv-val font-mono">worker-node-us-east-04</span></div>
              <div className="console-kv-row"><span className="kv-key">Execution Duration:</span><span className="kv-val">{formatDuration(stageInfo.durationMs)}</span></div>
              <div className="console-kv-row"><span className="kv-key">Redirects Observed:</span><span className="kv-val">2 external HTTP redirects</span></div>
              <div className="console-kv-row"><span className="kv-key">Network Requests Intercepted:</span><span className="kv-val font-mono">24 HTTP requests (3 third-party)</span></div>
            </div>
            {onNavigateToModule && (
              <button
                type="button"
                className="console-drawer-action-btn"
                onClick={() => onNavigateToModule('SANDBOX')}
              >
                <span>Open Full Sandbox Telemetry &amp; Timeline</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        );

      case 'BEHAVIOR_ANALYSIS':
        return (
          <div className="console-evidence-content">
            <h4 className="console-evidence-subheading">DOM &amp; Script Behavioral Anomalies</h4>
            <ul className="console-evidence-list">
              <li>Manipulative countdown urgency script detected with auto-looping timers</li>
              <li>Store-wide 85% liquidation pricing anomaly flagged against catalog average</li>
              <li>Missing physical registered business address and generic Gmail contact support</li>
              <li>Stolen policy boilerplate text matching known fraud cluster #994</li>
            </ul>
          </div>
        );

      case 'PAYMENT_ANALYSIS':
        return (
          <div className="console-evidence-content">
            <h4 className="console-evidence-subheading">Payment Forensics &amp; Gateway Analysis</h4>
            <div className="console-key-val-table">
              <div className="console-kv-row"><span className="kv-key">Gateway Classification:</span><span className="kv-val text-crimson-400 font-bold">SUSPICIOUS (Raw Input Form)</span></div>
              <div className="console-kv-row"><span className="kv-key">PCI-DSS Tokenized Iframe:</span><span className="kv-val text-crimson-400 font-semibold">NOT DETECTED</span></div>
              <div className="console-kv-row"><span className="kv-key">Card Data Exfiltration Target:</span><span className="kv-val font-mono text-amber-400">fast-pay-gateway.top/api/collect</span></div>
            </div>
            {onNavigateToModule && (
              <button
                type="button"
                className="console-drawer-action-btn"
                onClick={() => onNavigateToModule('PAYMENT')}
              >
                <span>Inspect Payment Gateway Forensics</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        );

      case 'BRAND_ANALYSIS':
        return (
          <div className="console-evidence-content">
            <h4 className="console-evidence-subheading">Brand Impersonation &amp; Typo-Squatting</h4>
            <div className="console-key-val-table">
              <div className="console-kv-row"><span className="kv-key">Claimed Trademark:</span><span className="kv-val font-bold text-crimson-400">NIKE</span></div>
              <div className="console-kv-row"><span className="kv-key">Official Trademark Domain:</span><span className="kv-val font-mono">nike.com</span></div>
              <div className="console-kv-row"><span className="kv-key">Visual Asset Similarity:</span><span className="kv-val font-mono font-bold text-crimson-400">94% (Scraped Vector Logos)</span></div>
              <div className="console-kv-row"><span className="kv-key">Brand / Domain Mismatch:</span><span className="kv-val text-crimson-400 font-semibold">TRUE</span></div>
            </div>
            {onNavigateToModule && (
              <button
                type="button"
                className="console-drawer-action-btn"
                onClick={() => onNavigateToModule('BRAND_CONTENT')}
              >
                <span>Inspect Brand &amp; Content Analysis</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        );

      case 'EVIDENCE_AGGREGATION':
        return (
          <div className="console-evidence-content">
            <h4 className="console-evidence-subheading">Aggregated Forensic Evidence Matrix</h4>
            <ul className="console-evidence-list">
              <li>Infrastructure: Domain age 4 days with WHOIS concealment</li>
              <li>Brand: Unauthorized Nike trademark appropriation in .xyz zone</li>
              <li>Payment: Insecure raw credit card harvesting without verified tokenization</li>
              <li>Behavior: Auto-restarting countdown urgency timer to coerce rapid checkout</li>
            </ul>
          </div>
        );

      case 'AI_REASONING':
        return (
          <div className="console-evidence-content">
            <h4 className="console-evidence-subheading">Autonomous AI Investigator Synthesis</h4>
            <p className="console-evidence-paragraph">
              Synthesized evidence across network telemetry, DOM analysis, and registrar heuristics decisively flags this domain as a non-delivery counterfeit storefront designed to harvest credit cards.
            </p>
            {onNavigateToModule && (
              <button
                type="button"
                className="console-drawer-action-btn"
                onClick={() => onNavigateToModule('AI_INVESTIGATOR')}
              >
                <span>View Full AI Investigation Briefing</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        );

      case 'DECISION_POLICY':
        return (
          <div className="console-evidence-content">
            <h4 className="console-evidence-subheading">Policy Rule Matrix Evaluation</h4>
            <div className="console-key-val-table">
              <div className="console-kv-row"><span className="kv-key">Rule POL-CRIT-01:</span><span className="kv-val text-crimson-400 font-semibold">TRIGGERED (Insecure Card Capture)</span></div>
              <div className="console-kv-row"><span className="kv-key">Rule POL-BRAND-04:</span><span className="kv-val text-crimson-400 font-semibold">TRIGGERED (Trademark Lookalike &gt;85%)</span></div>
              <div className="console-kv-row"><span className="kv-key">Final Policy Verdict:</span><span className="kv-val text-crimson-400 font-bold">DANGER (BLOCK &amp; WARN)</span></div>
            </div>
            {onNavigateToModule && (
              <button
                type="button"
                className="console-drawer-action-btn"
                onClick={() => onNavigateToModule('VERDICT')}
              >
                <span>View Verdict &amp; Enforcement Policy</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>
        );

      case 'EXTENSION_RESPONSE':
        return (
          <div className="console-evidence-content">
            <h4 className="console-evidence-subheading">Browser Extension Dispatch &amp; Enforcement</h4>
            <div className="console-key-val-table">
              <div className="console-kv-row"><span className="kv-key">Dispatched Payload:</span><span className="kv-val font-mono">&#123; status: &quot;DANGER&quot;, action: &quot;GO_BACK&quot; &#125;</span></div>
              <div className="console-kv-row"><span className="kv-key">Overlay Display Status:</span><span className="kv-val text-emerald-400 font-semibold">Rendered in DOM</span></div>
              <div className="console-kv-row"><span className="kv-key">Client Acknowledged:</span><span className="kv-val text-emerald-400 font-semibold">YES</span></div>
            </div>
          </div>
        );

      default:
        return <div>No evidence details available for this stage.</div>;
    }
  };

  return (
    <div className="console-stage-drawer">
      <div className="console-drawer-header">
        <div className="console-drawer-title-group">
          <FileCode size={16} className="text-sky-400" />
          <div>
            <h3 className="console-drawer-title">Stage Evidence: {stageInfo.name}</h3>
            <span className="console-drawer-sub">
              Status: <strong>{stageInfo.status}</strong> • Duration: {stageInfo.durationMs ? formatDuration(stageInfo.durationMs) : '—'}
            </span>
          </div>
        </div>

        <button
          type="button"
          className="console-drawer-close-btn"
          onClick={onClose}
          aria-label="Close evidence drawer"
        >
          <X size={16} />
        </button>
      </div>

      <div className="console-drawer-body">
        {renderStageEvidenceContent()}
      </div>
    </div>
  );
};
