import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Globe,
  Code,
  CreditCard,
  Cpu,
  Copy,
  ExternalLink,
  Check,
  ChevronDown,
  ChevronUp,
  Activity,
  Zap,
} from 'lucide-react';
import type { FeedEvent } from '../types';

interface InvestigationPanelProps {
  event: FeedEvent | null;
  events?: FeedEvent[];
  totalEventsCount: number;
  stats: {
    safe: number;
    suspicious: number;
    highRisk: number;
    payment: number;
  };
  onClearSelection: () => void;
  onQuickIngestPreset?: (url: string) => void;
}

export const InvestigationPanel: React.FC<InvestigationPanelProps> = ({
  event,
  events = [],
  totalEventsCount,
  stats,
  onClearSelection,
}) => {
  const [animatedScore, setAnimatedScore] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  const targetScorePercent = event ? (event.riskScore > 1 ? Math.round(event.riskScore) : Math.round(event.riskScore * 100)) : 0;

  // Animated risk score counter
  useEffect(() => {
    if (!event) return;
    let start = 0;
    const duration = 600;
    const stepTime = 16;
    const steps = duration / stepTime;
    const stepValue = targetScorePercent / steps;

    const timer = setInterval(() => {
      start += stepValue;
      if (start >= targetScorePercent) {
        setAnimatedScore(targetScorePercent);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [event, targetScorePercent]);

  const handleCopyUrl = () => {
    if (event?.url) {
      navigator.clipboard.writeText(event.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getVerdictTheme = (v: string) => {
    if (v === 'SAFE') return { color: '#10B981', label: 'SAFE', icon: <ShieldCheck size={20} /> };
    if (v === 'SUSPICIOUS') return { color: '#F59E0B', label: 'SUSPICIOUS', icon: <AlertTriangle size={20} /> };
    return { color: '#EF4444', label: 'HIGH RISK', icon: <ShieldAlert size={20} /> };
  };

  // ============================================================================
  // EMPTY / OVERVIEW MODE (When no event is selected)
  // ============================================================================
  if (!event) {
    const total = Math.max(totalEventsCount, events.length);
    const safePercent = total > 0 ? Math.round((stats.safe / total) * 100) : 0;
    const suspPercent = total > 0 ? Math.round((stats.suspicious / total) * 100) : 0;
    const riskPercent = total > 0 ? Math.round((stats.highRisk / total) * 100) : 0;

    // 1. Multi-Tier Severity Buckets Histogram (0-19%, 20-39%, 40-59%, 60-79%, 80-100%)
    const scoreBuckets = [
      { range: '0-19%', label: 'Clean / Nominal', color: '#10B981', count: 0, class: 'bucket-clean' },
      { range: '20-39%', label: 'Low Risk', color: '#34D399', count: 0, class: 'bucket-low' },
      { range: '40-59%', label: 'Suspicious', color: '#F59E0B', count: 0, class: 'bucket-susp' },
      { range: '60-79%', label: 'Elevated Threat', color: '#F97316', count: 0, class: 'bucket-elevated' },
      { range: '80-100%', label: 'Critical / Phish', color: '#EF4444', count: 0, class: 'bucket-crit' },
    ];

    events.forEach((e) => {
      const score = e.riskScore > 1 ? e.riskScore : e.riskScore * 100;
      if (score < 20) scoreBuckets[0].count++;
      else if (score < 40) scoreBuckets[1].count++;
      else if (score < 60) scoreBuckets[2].count++;
      else if (score < 80) scoreBuckets[3].count++;
      else scoreBuckets[4].count++;
    });

    const maxBucketCount = Math.max(...scoreBuckets.map((b) => b.count), 1);

    // 2. Multi-Model Detection Vector Breakdown
    let urlSvmThreats = 0;
    let htmlXgbThreats = 0;
    let paymentXgbThreats = 0;
    let crossModelConsensus = 0;

    events.forEach((e) => {
      if (e.models.urlScore > 0 || (e.models as any).urlProbability >= 0.5) urlSvmThreats++;
      if (e.models.htmlProbability >= 0.5) htmlXgbThreats++;
      if (e.models.paymentProbability >= 0.5 || e.analysis.paymentDetected) paymentXgbThreats++;
      if (e.verdict === 'HIGH RISK' && (e.models.htmlProbability >= 0.5 || e.models.urlScore > 0)) {
        crossModelConsensus++;
      }
    });

    // 3. Threat Surface Attack Vector Statistics
    let httpsCount = 0;
    let rawIpCount = 0;
    let externalFormCount = 0;
    let paymentFieldCount = 0;
    let totalScanLatency = 0;

    events.forEach((e) => {
      if (e.telemetry?.url?.is_https !== false) httpsCount++;
      if (e.telemetry?.url?.has_ip_host) rawIpCount++;
      if (e.analysis.externalForm) externalFormCount++;
      if (e.analysis.cardInput || e.analysis.cvvInput || e.analysis.paymentDetected) paymentFieldCount++;
      totalScanLatency += e.scanDuration || 0.02;
    });

    const avgLatency = total > 0 ? (totalScanLatency / total).toFixed(3) : '0.024';
    const httpsCompliance = total > 0 ? Math.round((httpsCount / total) * 100) : 100;
    const consensusRate = stats.highRisk > 0 ? Math.round((crossModelConsensus / stats.highRisk) * 100) : 100;

    return (
      <main className="investigation-panel overview-mode">
        <div className="overview-header">
          <div>
            <span className="overview-tag font-mono">SOC WORKSTATION</span>
            <h1 className="overview-title">Operations Monitoring & Threat Intelligence</h1>
            <p className="overview-subtitle">
              Real-time multi-modal statistical telemetry, risk distribution, and threat surface telemetry
            </p>
          </div>
        </div>

        {/* Aggregate KPI Grid */}
        <div className="soc-metrics-grid">
          <div className="soc-metric-card">
            <span className="soc-metric-label">Observed Events</span>
            <span className="soc-metric-val font-mono">{total}</span>
            <span className="soc-metric-foot text-muted">Total requests inspected</span>
          </div>

          <div className="soc-metric-card border-safe">
            <span className="soc-metric-label">Clean / Safe</span>
            <span className="soc-metric-val text-emerald-400 font-mono">{stats.safe}</span>
            <span className="soc-metric-foot text-emerald-500/80">{safePercent}% nominal baseline</span>
          </div>

          <div className="soc-metric-card border-suspicious">
            <span className="soc-metric-label">Suspicious</span>
            <span className="soc-metric-val text-amber-400 font-mono">{stats.suspicious}</span>
            <span className="soc-metric-foot text-amber-500/80">{suspPercent}% anomaly rate</span>
          </div>

          <div className="soc-metric-card border-danger">
            <span className="soc-metric-label">High Risk / Phish</span>
            <span className="soc-metric-val text-red-400 font-mono">{stats.highRisk}</span>
            <span className="soc-metric-foot text-red-500/80">{riskPercent}% threat rate</span>
          </div>
        </div>

        {/* Live Risk Distribution Threat Spectrum Bar */}
        <div className="risk-dist-section">
          <div className="section-label-row">
            <span className="text-xs font-semibold uppercase text-muted tracking-wider">
              Session Threat Spectrum
            </span>
            <span className="text-xs font-mono text-secondary">{total} Total Requests</span>
          </div>

          <div className="threat-spectrum-bar">
            <div style={{ width: `${safePercent}%` }} className="spectrum-segment safe" title={`Safe: ${stats.safe}`} />
            <div style={{ width: `${suspPercent}%` }} className="spectrum-segment suspicious" title={`Suspicious: ${stats.suspicious}`} />
            <div style={{ width: `${riskPercent}%` }} className="spectrum-segment danger" title={`High Risk: ${stats.highRisk}`} />
          </div>
        </div>

        {/* GRAPHICAL REPRESENTATION 1: Threat Severity Histogram */}
        <div className="soc-stat-panel">
          <div className="soc-stat-panel-header">
            <div className="flex items-center gap-2">
              <Activity size={15} className="text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Risk Score Distribution Histogram
              </span>
            </div>
            <span className="text-xs font-mono text-muted">5-Tier Severity Granularity</span>
          </div>

          <div className="histogram-grid">
            {scoreBuckets.map((bucket, idx) => {
              const bucketPct = total > 0 ? Math.round((bucket.count / total) * 100) : 0;
              const barHeightPct = total > 0 ? Math.max(Math.round((bucket.count / maxBucketCount) * 100), 8) : 8;

              return (
                <div key={idx} className="histogram-col">
                  <div className="histogram-bar-track">
                    <div
                      className={`histogram-bar-fill ${bucket.class}`}
                      style={{ height: `${barHeightPct}%` }}
                    >
                      <span className="histogram-bar-count font-mono">{bucket.count}</span>
                    </div>
                  </div>
                  <div className="histogram-meta">
                    <span className="histogram-range font-mono">{bucket.range}</span>
                    <span className="histogram-pct font-mono text-muted">{bucketPct}%</span>
                    <span className="histogram-label">{bucket.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* GRAPHICAL REPRESENTATION 2: Multi-Model Threat Vector Concordance & Threat Surface Breakdown */}
        <div className="soc-dual-stats-grid">
          {/* Left: AI Vector Concordance */}
          <div className="soc-stat-panel">
            <div className="soc-stat-panel-header">
              <div className="flex items-center gap-2">
                <Cpu size={15} className="text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Multi-Model Detection Concordance
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-400">{consensusRate}% Consensus</span>
            </div>

            <div className="model-vectors-list">
              <div className="vector-row">
                <div className="vector-label-row font-mono text-xs">
                  <span className="text-secondary">URL SVM (Lexical & TF-IDF)</span>
                  <span className="text-emerald-400 font-bold">{urlSvmThreats} / {total}</span>
                </div>
                <div className="vector-meter-track">
                  <div
                    className="vector-meter-fill bg-emerald-500"
                    style={{ width: `${total > 0 ? Math.round((urlSvmThreats / total) * 100) : 0}%` }}
                  />
                </div>
                <span className="vector-subtext text-muted">Character TF-IDF n-gram token anomalies</span>
              </div>

              <div className="vector-row">
                <div className="vector-label-row font-mono text-xs">
                  <span className="text-secondary">HTML XGBoost V2 (DOM Intel)</span>
                  <span className="text-emerald-400 font-bold">{htmlXgbThreats} / {total}</span>
                </div>
                <div className="vector-meter-track">
                  <div
                    className="vector-meter-fill bg-teal-400"
                    style={{ width: `${total > 0 ? Math.round((htmlXgbThreats / total) * 100) : 0}%` }}
                  />
                </div>
                <span className="vector-subtext text-muted">56 DOM credential & structural security features</span>
              </div>

              <div className="vector-row">
                <div className="vector-label-row font-mono text-xs">
                  <span className="text-secondary">Payment XGBoost (Checkout Risk)</span>
                  <span className="text-emerald-400 font-bold">{paymentXgbThreats} / {total}</span>
                </div>
                <div className="vector-meter-track">
                  <div
                    className="vector-meter-fill bg-amber-400"
                    style={{ width: `${total > 0 ? Math.round((paymentXgbThreats / total) * 100) : 0}%` }}
                  />
                </div>
                <span className="vector-subtext text-muted">35 payment form, CVV, and gateway vectors</span>
              </div>
            </div>
          </div>

          {/* Right: Security Surface Indicators & Telemetry KPIs */}
          <div className="soc-stat-panel">
            <div className="soc-stat-panel-header">
              <div className="flex items-center gap-2">
                <ShieldAlert size={15} className="text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Threat Surface Vector Indicators
                </span>
              </div>
              <span className="text-xs font-mono text-muted">Session Landscape</span>
            </div>

            <div className="surface-indicators-grid">
              <div className="surface-indicator-card">
                <span className="surface-ind-label font-mono text-muted">TLS / HTTPS RATE</span>
                <span className="surface-ind-val text-emerald-400 font-mono">{httpsCompliance}%</span>
                <span className="surface-ind-sub text-muted">{httpsCount} Secure Transports</span>
              </div>

              <div className="surface-indicator-card">
                <span className="surface-ind-label font-mono text-muted">EXTERNAL FORMS</span>
                <span className={`surface-ind-val font-mono ${externalFormCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {externalFormCount}
                </span>
                <span className="surface-ind-sub text-muted">Third-party Action Targets</span>
              </div>

              <div className="surface-indicator-card">
                <span className="surface-ind-label font-mono text-muted">RAW IP HOSTS</span>
                <span className={`surface-ind-val font-mono ${rawIpCount > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {rawIpCount}
                </span>
                <span className="surface-ind-sub text-muted">Direct IP Access Bypasses</span>
              </div>

              <div className="surface-indicator-card">
                <span className="surface-ind-label font-mono text-muted">PAYMENT SURFACES</span>
                <span className="surface-ind-val text-amber-400 font-mono">{paymentFieldCount}</span>
                <span className="surface-ind-sub text-muted">Card / Checkout Vectors</span>
              </div>
            </div>

            {/* Ingestion & Performance Telemetry Row */}
            <div className="telemetry-bar-row font-mono text-xs">
              <div className="flex items-center gap-2">
                <Zap size={13} className="text-emerald-400" />
                <span className="text-secondary">Mean Inference Latency:</span>
                <span className="text-emerald-400 font-bold">{avgLatency}s</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted">Pipeline Pipeline:</span>
                <span className="text-emerald-400 font-bold">ACTIVE (4/4 NODES)</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ============================================================================
  // SELECTED EVENT INVESTIGATION VIEW
  // ============================================================================
  const verdictTheme = getVerdictTheme(event.verdict);
  const verdictLower = event.verdict.toLowerCase().replace(' ', '-');
  const isPayment = event.analysis?.paymentDetected;

  return (
    <main className="investigation-panel active-investigation">
      {/* Top Banner with Close / Breadcrumb */}
      <div className="investigation-top-bar">
        <div className="investigation-breadcrumb">
          <span className="font-mono text-xs text-muted">INVESTIGATION</span>
          <span className="text-muted">/</span>
          <span className="font-mono text-xs text-emerald-400">{event.id}</span>
        </div>

        <button className="btn-close-investigation" onClick={onClearSelection} title="Close Investigation (Esc)">
          ✕ Close
        </button>
      </div>

      {/* Target URL Header */}
      <div className="target-card">
        <div className="target-url-row">
          <Globe size={18} className="text-emerald-400 shrink-0 mt-1" />
          <div className="target-url-text font-mono" title={event.url}>
            {event.url}
          </div>
        </div>

        <div className="target-actions-row">
          <div className="target-badges">
            <span className="badge-hostname font-mono">{event.hostname}</span>
            <span className="badge-meta font-mono">
              {new Date(event.timestamp).toLocaleTimeString()} · {event.scanDuration}s latency
            </span>
            {event.initiator && (
              <span className="badge-initiator font-mono">VIA {event.initiator}</span>
            )}
          </div>

          <div className="target-buttons">
            <button className="btn-action-icon" onClick={handleCopyUrl} title="Copy URL">
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-action-icon"
              title="Open in new tab"
            >
              <ExternalLink size={14} />
              <span>Open</span>
            </a>
          </div>
        </div>
      </div>

      {/* Verdict & Score Banner */}
      <div className={`verdict-summary-card verdict-${verdictLower}`}>
        <div className="verdict-main-left">
          <div className={`verdict-tag ${verdictLower}`}>
            {verdictTheme.icon}
            <span>{event.verdict}</span>
          </div>

          <div className="verdict-explain-text">
            {event.verdict === 'SAFE' && 'Zero confirmed credential exfiltration or deceptive payment signatures detected.'}
            {event.verdict === 'SUSPICIOUS' && 'Lexical or DOM patterns deviate from verified enterprise standards. Caution advised.'}
            {event.verdict === 'HIGH RISK' && 'High-probability phishing or payment credential exfiltration signals detected.'}
          </div>
        </div>

        <div className="verdict-score-right">
          <div className="verdict-score-num font-mono" style={{ color: verdictTheme.color }}>
            {animatedScore}
            <span className="verdict-score-denom">/ 100</span>
          </div>
          <span className="verdict-score-label">FUSION RISK SCORE</span>
        </div>
      </div>

      {/* 4-Stage AI Pipeline Breakdown */}
      <div className="pipeline-breakdown-card">
        <div className="pipeline-breakdown-title font-mono text-xs uppercase text-muted mb-3 flex items-center gap-2">
          <Cpu size={14} className="text-emerald-400" />
          4-Layer Model Inference Pipeline
        </div>

        <div className="pipeline-stages-grid">
          {/* Layer 1: URL SVM */}
          <div className="stage-node-box">
            <div className="stage-node-header">
              <span className="stage-node-layer font-mono">01 · URL INTEL</span>
              <span className="stage-node-tech text-muted">Linear SVM</span>
            </div>
            <div className="stage-node-val font-mono">
              {event.models.urlScore >= 0 ? `+${event.models.urlScore.toFixed(2)}` : event.models.urlScore.toFixed(2)}
            </div>
            <div className="stage-node-desc">Char TF-IDF Decision Score</div>
          </div>

          {/* Layer 2: Page HTML XGBoost */}
          <div className="stage-node-box">
            <div className="stage-node-header">
              <span className="stage-node-layer font-mono">02 · PAGE INTEL</span>
              <span className="stage-node-tech text-muted">XGBoost V2</span>
            </div>
            <div className="stage-node-val font-mono">
              {(event.models.htmlProbability * 100).toFixed(1)}%
            </div>
            <div className="stage-node-desc">56 DOM Phish Probability</div>
          </div>

          {/* Layer 3: Payment XGBoost */}
          <div className="stage-node-box">
            <div className="stage-node-header">
              <span className="stage-node-layer font-mono">03 · PAYMENT INTEL</span>
              <span className="stage-node-tech text-muted">XGBoost</span>
            </div>
            <div className="stage-node-val font-mono">
              {(event.models.paymentProbability * 100).toFixed(1)}%
            </div>
            <div className="stage-node-desc">35 Payment Threat Probability</div>
          </div>

          {/* Layer 4: Risk Fusion */}
          <div className="stage-node-box border-fusion">
            <div className="stage-node-header">
              <span className="stage-node-layer font-mono text-emerald-400">04 · RISK FUSION</span>
              <span className="stage-node-tech text-emerald-400">LogReg</span>
            </div>
            <div className="stage-node-val text-emerald-400 font-mono">
              {Math.round(event.riskScore * 100)}%
            </div>
            <div className="stage-node-desc text-emerald-400/80">Final Calibrated Score</div>
          </div>
        </div>
      </div>

      {/* Threat Findings */}
      <div className="threat-findings-card">
        <div className="threat-findings-header">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Threat Findings</h3>
          </div>
          <span className="text-xs font-mono text-muted">
            {event.findings.length} Evidence {event.findings.length === 1 ? 'Point' : 'Points'}
          </span>
        </div>

        {event.findings.length === 0 ? (
          <div className="p-4 bg-slate-900/40 rounded-lg text-secondary text-xs flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Standard security baseline. No deceptive or credential harvesting signals found.</span>
          </div>
        ) : (
          <div className="findings-soc-list">
            {event.findings.map((f, i) => (
              <div key={i} className={`soc-finding-row severity-${f.severity}`}>
                <div className="soc-finding-badge-col">
                  <span className={`soc-sev-pill ${f.severity}`}>{f.severity}</span>
                  <span className="soc-cat-pill font-mono">{f.category}</span>
                </div>
                <div className="soc-finding-content">
                  <div className="soc-finding-title">{f.title}</div>
                  <div className="soc-finding-desc">{f.description}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Security Surface (Prominent if payment detected or inspected) */}
      <div className="payment-surface-soc-card">
        <div className="payment-surface-header">
          <div className="flex items-center gap-2">
            <CreditCard size={16} className="text-emerald-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Payment Security Surface</h3>
          </div>
          <span className="text-xs font-mono text-muted">
            {isPayment ? 'ACTIVE CHECKOUT DETECTED' : 'NO PAYMENT FLOW'}
          </span>
        </div>

        <div className="payment-soc-grid">
          <div className="payment-soc-item">
            <span className="payment-soc-label">Payment Flow</span>
            <span className={`payment-soc-status ${event.analysis.paymentDetected ? 'active' : 'clear'}`}>
              {event.analysis.paymentDetected ? 'YES / ACTIVE' : 'NONE'}
            </span>
          </div>

          <div className="payment-soc-item">
            <span className="payment-soc-label">Card Number Fields</span>
            <span className={`payment-soc-status ${event.analysis.cardInput ? 'threat' : 'clear'}`}>
              {event.analysis.cardInput ? 'DETECTED' : 'NOT DETECTED'}
            </span>
          </div>

          <div className="payment-soc-item">
            <span className="payment-soc-label">CVV / CVC Code</span>
            <span className={`payment-soc-status ${event.analysis.cvvInput ? 'threat' : 'clear'}`}>
              {event.analysis.cvvInput ? 'DETECTED' : 'NOT DETECTED'}
            </span>
          </div>

          <div className="payment-soc-item">
            <span className="payment-soc-label">Expiry Date Input</span>
            <span className={`payment-soc-status ${event.analysis.expiryInput ? 'threat' : 'clear'}`}>
              {event.analysis.expiryInput ? 'DETECTED' : 'NOT DETECTED'}
            </span>
          </div>

          <div className="payment-soc-item">
            <span className="payment-soc-label">UPI / VPA Inputs</span>
            <span className={`payment-soc-status ${event.analysis.upiInput ? 'active' : 'clear'}`}>
              {event.analysis.upiInput ? 'DETECTED' : 'NOT DETECTED'}
            </span>
          </div>

          <div className="payment-soc-item">
            <span className="payment-soc-label">OTP Interception</span>
            <span className={`payment-soc-status ${event.analysis.otpInput ? 'threat' : 'clear'}`}>
              {event.analysis.otpInput ? 'DETECTED' : 'NOT DETECTED'}
            </span>
          </div>

          <div className="payment-soc-item">
            <span className="payment-soc-label">External Form Action</span>
            <span className={`payment-soc-status ${event.analysis.externalForm ? 'threat' : 'clear'}`}>
              {event.analysis.externalForm ? 'EXTERNAL TARGET' : 'INTERNAL / SECURE'}
            </span>
          </div>

          <div className="payment-soc-item">
            <span className="payment-soc-label">External Iframe</span>
            <span className={`payment-soc-status ${event.analysis.externalIframe ? 'active' : 'clear'}`}>
              {event.analysis.externalIframe ? 'EMBEDDED' : 'NONE'}
            </span>
          </div>

          <div className="payment-soc-item">
            <span className="payment-soc-label">Detected Gateway</span>
            <span className="payment-soc-val font-mono">
              {event.analysis.detectedProviders.length > 0
                ? event.analysis.detectedProviders.join(', ').toUpperCase()
                : 'NONE'}
            </span>
          </div>

          <div className="payment-soc-item">
            <span className="payment-soc-label">Provider Consistency</span>
            <span className={`payment-soc-status ${event.analysis.providerMismatch ? 'threat' : 'clear'}`}>
              {event.analysis.providerMismatch ? 'SUSPICIOUS / MISMATCH' : 'CONSISTENT / NOMINAL'}
            </span>
          </div>
        </div>
      </div>

      {/* Expandable Technical Telemetry */}
      <div className="tech-telemetry-accordion">
        <button
          className="tech-telemetry-toggle"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
        >
          <div className="flex items-center gap-2 font-mono text-xs uppercase text-secondary">
            <Code size={14} className="text-emerald-400" />
            <span>Technical DOM & Lexical Telemetry</span>
          </div>
          {showTechnicalDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showTechnicalDetails && (
          <div className="tech-telemetry-content font-mono text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="telemetry-stat">
                <span className="stat-name">HTTPS Secure</span>
                <span className="stat-val">{event.telemetry?.url?.is_https ? 'TRUE' : 'FALSE'}</span>
              </div>
              <div className="telemetry-stat">
                <span className="stat-name">URL Length</span>
                <span className="stat-val">{event.telemetry?.url?.length || event.url.length}</span>
              </div>
              <div className="telemetry-stat">
                <span className="stat-name">Subdomain Count</span>
                <span className="stat-val">{event.telemetry?.url?.subdomain_count ?? 0}</span>
              </div>
              <div className="telemetry-stat">
                <span className="stat-name">Raw IP Host</span>
                <span className="stat-val">{event.telemetry?.url?.has_ip_host ? 'YES' : 'NO'}</span>
              </div>
              <div className="telemetry-stat">
                <span className="stat-name">HTML Payload Size</span>
                <span className="stat-val">{event.telemetry?.html?.length ? `${event.telemetry.html.length} B` : 'N/A'}</span>
              </div>
              <div className="telemetry-stat">
                <span className="stat-name">Form Elements</span>
                <span className="stat-val">{event.telemetry?.html?.formCount ?? 0}</span>
              </div>
              <div className="telemetry-stat">
                <span className="stat-name">Script Tags</span>
                <span className="stat-val">{event.telemetry?.html?.scriptCount ?? 0}</span>
              </div>
              <div className="telemetry-stat">
                <span className="stat-name">Iframe Elements</span>
                <span className="stat-val">{event.telemetry?.html?.iframeCount ?? 0}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
