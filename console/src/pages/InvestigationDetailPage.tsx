import React, { useState, useEffect } from 'react';
import { useConsole } from '../context/ConsoleContext.tsx';
import { apiClient } from '../services/apiClient.ts';
import { StagePipeline } from '../components/pipeline/StagePipeline.tsx';
import { StageEvidenceDrawer } from '../components/pipeline/StageEvidenceDrawer.tsx';
import { RiskGauge } from '../components/common/RiskGauge.tsx';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import type {
  PipelineStageId,
  SandboxSession,
  PaymentFinding,
  WebsiteIntelligence,
  BrandFinding,
  AIAnalysis,
  VerdictRecord,
} from '../types/index.ts';
import {
  Globe,
  Play,
  Terminal,
  CreditCard,
  Fingerprint,
  BrainCircuit,
  ListChecks,
  ExternalLink,
  AlertTriangle,
  ShieldCheck,
  Lock,
  Server,
  AlertOctagon,
  ArrowRight,
  FileText,
  Activity,
  Cpu,
  Layers,
} from 'lucide-react';
import { formatDuration, formatTimestamp, formatDate } from '../utils/formatters.ts';
import { redactSensitiveText } from '../utils/redact.ts';

type ForensicTab =
  | 'SANDBOX'
  | 'PAYMENT'
  | 'DOMAIN'
  | 'BRAND'
  | 'AI_REASONING'
  | 'VERDICT';

export const InvestigationDetailPage: React.FC = () => {
  const {
    selectedInvestigation,
    startNewInvestigation,
    isAnalyzing,
  } = useConsole();

  const [selectedStage, setSelectedStage] = useState<PipelineStageId | null>('BEHAVIOR_ANALYSIS');
  const [activeTab, setActiveTab] = useState<ForensicTab>('SANDBOX');
  const [targetInput, setTargetInput] = useState<string>('');

  // Loaded forensic models for the active investigation
  const [sandbox, setSandbox] = useState<SandboxSession | null>(null);
  const [payment, setPayment] = useState<PaymentFinding | null>(null);
  const [intel, setIntel] = useState<WebsiteIntelligence | null>(null);
  const [brand, setBrand] = useState<BrandFinding | null>(null);
  const [ai, setAi] = useState<AIAnalysis | null>(null);
  const [verdict, setVerdict] = useState<VerdictRecord | null>(null);

  useEffect(() => {
    if (selectedInvestigation) {
      const invId = selectedInvestigation.id;
      apiClient.getSandboxSession(invId).then(setSandbox);
      apiClient.getPaymentFinding(invId).then(setPayment);
      apiClient.getWebsiteIntel(invId).then(setIntel);
      apiClient.getBrandFinding(invId).then(setBrand);
      apiClient.getAIAnalysis(invId).then(setAi);
      apiClient.getVerdictRecord(invId).then(setVerdict);
    }
  }, [selectedInvestigation?.id, selectedInvestigation?.status]);

  const handleReplay = () => {
    if (selectedInvestigation) {
      startNewInvestigation(selectedInvestigation.url);
    }
  };

  const handleLaunchDirect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetInput.trim()) {
      await startNewInvestigation(targetInput.trim());
      setTargetInput('');
    }
  };

  if (!selectedInvestigation) {
    return (
      <div className="console-page-container">
        <div className="console-card text-center p-12">
          <Globe size={36} className="text-sky-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-200">No Target Investigation Selected</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            Click any incoming URL from the live stream on the left or enter a target URL below to dispatch an autonomous investigation.
          </p>
          <form onSubmit={handleLaunchDirect} className="console-dispatch-form max-w-lg mx-auto mt-6">
            <div className="console-input-wrapper flex-1">
              <Globe size={15} className="console-input-icon" />
              <input
                type="text"
                className="console-url-input"
                placeholder="Enter URL to inspect (e.g. https://cheap-nike-outlet.xyz)..."
                value={targetInput}
                onChange={(e) => setTargetInput(e.target.value)}
                disabled={isAnalyzing}
              />
            </div>
            <button
              type="submit"
              className="console-analyze-btn"
              disabled={isAnalyzing || !targetInput.trim()}
            >
              <Play size={13} fill="currentColor" />
              <span>{isAnalyzing ? 'Analyzing...' : 'Dispatch'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isDanger = selectedInvestigation.verdict === 'DANGER';
  const isCaution = selectedInvestigation.verdict === 'CAUTION';
  const isLocal = selectedInvestigation.url.includes('localhost') || selectedInvestigation.url.includes('127.0.0.1');
  const isHttps = selectedInvestigation.url.startsWith('https://');

  return (
    <div className="console-page-container">
      {/* Target Assessment Cockpit Header */}
      <div className={`console-target-hero-card ${isDanger ? 'hero-danger' : isCaution ? 'hero-caution' : 'hero-safe'}`}>
        <div className="console-hero-left">
          <div className="console-hero-status-row">
            {selectedInvestigation.verdict ? (
              <StatusBadge status={selectedInvestigation.verdict} size="lg" />
            ) : (
              <StatusBadge status={selectedInvestigation.status} size="lg" />
            )}
            <span className={`protocol-badge ${isLocal ? 'proto-local' : isHttps ? 'proto-https' : 'proto-http'}`}>
              {isLocal ? 'LOCAL' : isHttps ? 'HTTPS' : 'HTTP'}
            </span>
            <span className="console-hero-req-id font-mono">{selectedInvestigation.id}</span>
            <span className="console-hero-time font-mono">{formatTimestamp(selectedInvestigation.createdAt)}</span>
            <span className="console-hero-origin font-mono">[{selectedInvestigation.initiator}]</span>
          </div>

          <h1 className="console-hero-hostname font-mono" title={selectedInvestigation.url}>
            {selectedInvestigation.hostname}
          </h1>

          <div className="console-hero-url-row">
            <Globe size={13} className="text-slate-400" />
            <span className="font-mono text-slate-300 text-xs truncate max-w-xl">{selectedInvestigation.url}</span>
            <a
              href={selectedInvestigation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-sky-400 ml-1"
              title="Open link in browser"
            >
              <ExternalLink size={12} />
            </a>
          </div>

          <div className="console-hero-tags-row">
            {selectedInvestigation.tags.map((tag) => (
              <span key={tag} className="console-hero-tag font-mono">{tag}</span>
            ))}
          </div>
        </div>

        <div className="console-hero-right">
          <div className="console-hero-gauge-box">
            <RiskGauge score={selectedInvestigation.threatScore || 0} size={76} />
            <div className="console-hero-confidence">
              <span className="conf-label">Confidence</span>
              <span className="conf-val font-mono">{selectedInvestigation.confidence || 0}%</span>
            </div>
          </div>

          <div className="console-hero-actions mt-3">
            <button
              type="button"
              className="console-header-btn"
              onClick={handleReplay}
              disabled={isAnalyzing}
              title="Re-execute autonomous pipeline"
            >
              <Play size={12} fill="currentColor" />
              <span>{isAnalyzing ? 'Executing...' : 'Re-Analyze Target'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 10-Stage Autonomous Pipeline Progression Track */}
      <StagePipeline
        investigation={selectedInvestigation}
        selectedStage={selectedStage}
        onSelectStage={(stage) => setSelectedStage(stage)}
      />

      {/* Stage Evidence Inspection Drawer (if a stage is clicked) */}
      {selectedStage && (
        <StageEvidenceDrawer
          stageId={selectedStage}
          investigation={selectedInvestigation}
          onClose={() => setSelectedStage(null)}
          onNavigateToModule={(module) => {
            if (module === 'SANDBOX') setActiveTab('SANDBOX');
            if (module === 'PAYMENT') setActiveTab('PAYMENT');
            if (module === 'BRAND_CONTENT') setActiveTab('BRAND');
            if (module === 'AI_INVESTIGATOR') setActiveTab('AI_REASONING');
            if (module === 'VERDICT') setActiveTab('VERDICT');
          }}
        />
      )}

      {/* Evaluated Risk Factors & Security Signals Breakdown Card */}
      <div className="console-card">
        <div className="console-card-header">
          <div className="card-header-title-group">
            <AlertTriangle size={15} className={isDanger ? 'text-crimson-400' : isCaution ? 'text-amber-400' : 'text-emerald-400'} />
            <h3 className="card-title">
              Evaluated Security Risk Factors ({isDanger || isCaution ? '2 Threats Detected' : '2 Baseline Factors'} • Total Score: {selectedInvestigation.threatScore || 0}/100)
            </h3>
          </div>
          <span className={`console-mini-tag ${isDanger ? 'text-crimson-400' : isCaution ? 'text-amber-400' : 'text-emerald-400'}`}>
            {isDanger ? 'CRITICAL RISK' : isCaution ? 'SUSPICIOUS SIGNALS' : 'NOMINAL BASELINE'}
          </span>
        </div>

        <div className="console-risk-factors-grid">
          {isDanger ? (
            <>
              <div className="console-risk-factor-card critical">
                <div className="risk-factor-top">
                  <span className="risk-factor-num font-mono">RISK 01</span>
                  <span className="risk-factor-category font-mono">PAYMENT</span>
                  <span className="risk-factor-impact critical font-mono">CRITICAL</span>
                  <span className="risk-factor-score font-mono">+50 pts</span>
                </div>
                <h4 className="risk-factor-title">Insecure Card Data Harvesting</h4>
                <p className="risk-factor-desc">
                  Payment form collects raw credit card numbers directly without PCI-DSS certified tokenized iframes.
                </p>
              </div>

              <div className="console-risk-factor-card high">
                <div className="risk-factor-top">
                  <span className="risk-factor-num font-mono">RISK 02</span>
                  <span className="risk-factor-category font-mono">BRAND</span>
                  <span className="risk-factor-impact high font-mono">HIGH</span>
                  <span className="risk-factor-score font-mono">+42 pts</span>
                </div>
                <h4 className="risk-factor-title">Brand Impersonation &amp; Typo-Squatting</h4>
                <p className="risk-factor-desc">
                  Scraped official vector logos and catalog content presented on an unauthorized disposable domain.
                </p>
              </div>
            </>
          ) : isCaution ? (
            <>
              <div className="console-risk-factor-card medium">
                <div className="risk-factor-top">
                  <span className="risk-factor-num font-mono">RISK 01</span>
                  <span className="risk-factor-category font-mono">INFRASTRUCTURE</span>
                  <span className="risk-factor-impact medium font-mono">MEDIUM</span>
                  <span className="risk-factor-score font-mono">+25 pts</span>
                </div>
                <h4 className="risk-factor-title">Registrar Identity Concealment</h4>
                <p className="risk-factor-desc">
                  WHOIS registrant owner identity is withheld by a private proxy privacy service.
                </p>
              </div>

              <div className="console-risk-factor-card medium">
                <div className="risk-factor-top">
                  <span className="risk-factor-num font-mono">RISK 02</span>
                  <span className="risk-factor-category font-mono">DOMAIN</span>
                  <span className="risk-factor-impact medium font-mono">MEDIUM</span>
                  <span className="risk-factor-score font-mono">+23 pts</span>
                </div>
                <h4 className="risk-factor-title">Domain Age Under 30 Days</h4>
                <p className="risk-factor-desc">
                  Newly registered merchant domain lacking established historical reputation index.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="console-risk-factor-card nominal">
                <div className="risk-factor-top">
                  <span className="risk-factor-num font-mono">SIGNAL 01</span>
                  <span className="risk-factor-category font-mono">INFRASTRUCTURE</span>
                  <span className="risk-factor-impact nominal font-mono">NOMINAL</span>
                  <span className="risk-factor-score font-mono">+1 pt</span>
                </div>
                <h4 className="risk-factor-title">External Static CDN Dependency</h4>
                <p className="risk-factor-desc">
                  External third-party asset CDN resources loaded without subresource integrity (SRI) verification hashes.
                </p>
              </div>

              <div className="console-risk-factor-card nominal">
                <div className="risk-factor-top">
                  <span className="risk-factor-num font-mono">SIGNAL 02</span>
                  <span className="risk-factor-category font-mono">HEURISTICS</span>
                  <span className="risk-factor-impact nominal font-mono">NOMINAL</span>
                  <span className="risk-factor-score font-mono">+1 pt</span>
                </div>
                <h4 className="risk-factor-title">Heuristic Telemetry Baseline</h4>
                <p className="risk-factor-desc">
                  Standard minimum operational variance baseline on live external web destinations. Zero fraud indicators found.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Forensic Deep-Dive Command Tabs */}
      <div className="console-card console-forensic-cockpit-card">
        <div className="console-tab-pill-group mb-4">
          <button
            type="button"
            className={`console-tab-pill ${activeTab === 'SANDBOX' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('SANDBOX')}
          >
            <Terminal size={14} />
            <span>Sandbox Monitor ({sandbox?.networkRequests.length || 0})</span>
          </button>
          <button
            type="button"
            className={`console-tab-pill ${activeTab === 'PAYMENT' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('PAYMENT')}
          >
            <CreditCard size={14} />
            <span>Payment Forensics</span>
          </button>
          <button
            type="button"
            className={`console-tab-pill ${activeTab === 'DOMAIN' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('DOMAIN')}
          >
            <Globe size={14} />
            <span>Domain &amp; Infrastructure</span>
          </button>
          <button
            type="button"
            className={`console-tab-pill ${activeTab === 'BRAND' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('BRAND')}
          >
            <Fingerprint size={14} />
            <span>Brand &amp; Content</span>
          </button>
          <button
            type="button"
            className={`console-tab-pill ${activeTab === 'AI_REASONING' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('AI_REASONING')}
          >
            <BrainCircuit size={14} />
            <span>AI Investigator</span>
          </button>
          <button
            type="button"
            className={`console-tab-pill ${activeTab === 'VERDICT' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('VERDICT')}
          >
            <ListChecks size={14} />
            <span>Verdict Policy</span>
          </button>
        </div>

        {/* Tab 1: Sandbox Monitor */}
        {activeTab === 'SANDBOX' && sandbox && (
          <div className="console-tab-pane">
            <div className="console-session-meta-grid mb-4">
              <div className="session-meta-item">
                <span className="meta-label"><Cpu size={12} className="text-sky-400" /> Session ID</span>
                <span className="meta-val font-mono">{sandbox.id}</span>
              </div>
              <div className="session-meta-item">
                <span className="meta-label"><Server size={12} className="text-indigo-400" /> Worker Node</span>
                <span className="meta-val font-mono">{sandbox.workerId}</span>
              </div>
              <div className="session-meta-item">
                <span className="meta-label"><Activity size={12} className="text-emerald-400" /> Duration</span>
                <span className="meta-val font-mono">{formatDuration(sandbox.durationMs)}</span>
              </div>
              <div className="session-meta-item">
                <span className="meta-label"><Layers size={12} className="text-amber-400" /> Network Calls</span>
                <span className="meta-val font-mono text-sky-400">{sandbox.networkRequests.length}</span>
              </div>
              <div className="session-meta-item">
                <span className="meta-label"><AlertOctagon size={12} className="text-crimson-400" /> Behavior Flags</span>
                <span className={`meta-val font-mono ${sandbox.behaviorFlags.length > 0 ? 'text-crimson-400' : 'text-emerald-400'}`}>
                  {sandbox.behaviorFlags.length}
                </span>
              </div>
            </div>

            <div className="console-table-container">
              <table className="console-data-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Domain / URL Endpoint</th>
                    <th>Resource</th>
                    <th>Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {sandbox.networkRequests.map((req) => (
                    <tr key={req.id} className="console-table-row">
                      <td>
                        <span className={`method-badge method-${req.method.toLowerCase()} font-mono`}>
                          {req.method}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill ${req.status >= 400 ? 'status-err' : 'status-ok'} font-mono`}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        <div className="font-mono text-xs text-slate-200 truncate max-w-lg">{req.url}</div>
                        {req.requestBody && (
                          <div className="text-[11px] font-mono text-emerald-400 mt-1 bg-emerald-950/30 p-1.5 rounded border border-emerald-800/40">
                            Payload: {redactSensitiveText(req.requestBody)}
                          </div>
                        )}
                      </td>
                      <td><span className="console-mini-tag font-mono">{req.type}</span></td>
                      <td className="font-mono text-xs text-slate-400">{req.durationMs}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Payment Forensics */}
        {activeTab === 'PAYMENT' && payment && (
          <div className="console-tab-pane">
            <div className={`console-payment-hero-card ${payment.collectsRawCardDataDirectly ? 'is-danger' : 'is-safe'} p-4 mb-4`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={payment.status} size="md" />
                  <div>
                    <h4 className="font-bold text-slate-100 text-sm">
                      {payment.collectsRawCardDataDirectly
                        ? 'Critical Threat: Direct Raw Card Harvesting Detected'
                        : 'Verified Gateway Tokenization Enforced'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {payment.collectsRawCardDataDirectly
                        ? 'Form intercepts raw PAN and CVV credentials without PCI-DSS certified iframe sandboxing.'
                        : 'Checkout relies on bank-grade tokenized iframe architecture.'}
                    </p>
                  </div>
                </div>
                <span className={`console-mini-tag ${payment.collectsRawCardDataDirectly ? 'text-crimson-400 bg-crimson-500/10' : 'text-emerald-400 bg-emerald-500/10'} font-mono`}>
                  {payment.collectsRawCardDataDirectly ? 'RAW FORM EXFILTRATION' : 'PCI-DSS LEVEL 1'}
                </span>
              </div>
            </div>

            <div className="console-two-col-grid">
              <div className="console-pane-subcard">
                <div className="subcard-header">
                  <CreditCard size={15} className="text-sky-400" />
                  <h4 className="subcard-title">Detected Gateway SDKs ({payment.sdks.length})</h4>
                </div>
                <div className="subcard-body">
                  {payment.sdks.map((sdk, i) => (
                    <div key={i} className="gateway-sdk-item">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 text-xs">{sdk.name}</span>
                        <span className={`console-mini-tag ${sdk.isAuthenticOrigin ? 'text-emerald-400 bg-emerald-500/10' : 'text-crimson-400 bg-crimson-500/10'} font-mono`}>
                          {sdk.isAuthenticOrigin ? 'OFFICIAL ORIGIN' : 'UNVERIFIED HARVEST SCRIPT'}
                        </span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 mt-1 truncate">{sdk.sourceUrl}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="console-pane-subcard">
                <div className="subcard-header">
                  <ArrowRight size={15} className="text-amber-400" />
                  <h4 className="subcard-title">Redirect &amp; Exfiltration Chains ({payment.redirectChains.length})</h4>
                </div>
                <div className="subcard-body">
                  <div className="console-redirect-chain">
                    {payment.redirectChains.map((r, i) => (
                      <div key={i} className="redirect-step">
                        <span className="step-num font-mono text-xs">HOP {String(i + 1).padStart(2, '0')}</span>
                        <span className="step-url font-mono text-xs text-slate-200 truncate">{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Domain & Infrastructure */}
        {activeTab === 'DOMAIN' && intel && (
          <div className="console-tab-pane">
            <div className="console-two-col-grid">
              <div className="console-pane-subcard">
                <div className="subcard-header">
                  <Globe size={15} className="text-sky-400" />
                  <h4 className="subcard-title">Registrar &amp; Domain Identity</h4>
                </div>
                <div className="subcard-body console-key-val-table">
                  <div className="console-kv-row">
                    <span className="kv-key">Domain Age:</span>
                    <span className={`kv-val font-mono font-bold ${intel.domainAgeDays < 30 ? 'text-crimson-400' : 'text-emerald-400'}`}>
                      {intel.domainAgeDays} Days ({intel.domainAgeDays < 30 ? 'High Risk / New' : 'Established'})
                    </span>
                  </div>
                  <div className="console-kv-row">
                    <span className="kv-key">Registrar:</span>
                    <span className="kv-val">{intel.registration.registrar}</span>
                  </div>
                  <div className="console-kv-row">
                    <span className="kv-key">Created Date:</span>
                    <span className="kv-val font-mono">{formatDate(intel.registration.createdDate)}</span>
                  </div>
                  <div className="console-kv-row">
                    <span className="kv-key">Hosting Provider:</span>
                    <span className="kv-val">{intel.hostingProvider} ({intel.serverCountry})</span>
                  </div>
                </div>
              </div>

              <div className="console-pane-subcard">
                <div className="subcard-header">
                  <Lock size={15} className="text-emerald-400" />
                  <h4 className="subcard-title">TLS Certificate &amp; Encryption</h4>
                </div>
                <div className="subcard-body console-key-val-table">
                  <div className="console-kv-row">
                    <span className="kv-key">TLS Issuer:</span>
                    <span className="kv-val">{intel.tls.issuer}</span>
                  </div>
                  <div className="console-kv-row">
                    <span className="kv-key">Protocol:</span>
                    <span className="kv-val font-mono text-emerald-400">{intel.tls.protocol}</span>
                  </div>
                  <div className="console-kv-row">
                    <span className="kv-key">Certificate Age:</span>
                    <span className="kv-val font-mono">{intel.tls.certAgeDays} Days Old</span>
                  </div>
                  <div className="console-kv-row">
                    <span className="kv-key">Business Entity:</span>
                    <span className="kv-val">{intel.business.companyName || 'Unregistered / Private Proxy'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Brand & Content */}
        {activeTab === 'BRAND' && brand && (
          <div className="console-tab-pane">
            <div className="console-brand-compare-grid mb-4">
              <div className="brand-compare-col">
                <span className="compare-col-label">Claimed / Detected Brand Identity</span>
                <div className="brand-name-display text-crimson-400 font-bold text-base mt-1">
                  {brand.claimedBrand || 'No Trademark Claimed'}
                </div>
              </div>
              <div className="brand-compare-divider">
                <div className="vs-badge font-mono">VS</div>
              </div>
              <div className="brand-compare-col">
                <span className="compare-col-label">Authoritative Official Domain</span>
                <div className="brand-name-display font-mono text-sky-400 text-base mt-1">
                  {brand.officialDomain || 'Independent Entity / Unclaimed'}
                </div>
              </div>
            </div>

            <div className="console-brand-metrics-row">
              <div className="brand-metric-pill">
                <span className="metric-name">Typo-squatting Distance:</span>
                <span className="metric-val font-mono">{brand.typoDistance}</span>
              </div>
              <div className="brand-metric-pill">
                <span className="metric-name">Visual &amp; Logo Similarity:</span>
                <span className={`metric-val font-mono font-bold ${brand.visualSimilarityScore > 70 ? 'text-crimson-400' : 'text-emerald-400'}`}>
                  {brand.visualSimilarityScore}%
                </span>
              </div>
              <div className="brand-metric-pill">
                <span className="metric-name">Content Integrity Score:</span>
                <span className="metric-val font-mono">{brand.contentIntegrityScore}/100</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: AI Reasoning */}
        {activeTab === 'AI_REASONING' && ai && (
          <div className="console-tab-pane">
            <div className="console-ai-briefing-card mb-4">
              <div className="ai-briefing-header flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <BrainCircuit size={18} className="text-sky-400" />
                  <span className="font-bold text-sm text-slate-100">Autonomous Reasoning Briefing</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-sky-400 bg-sky-500/10 px-2 py-1 rounded border border-sky-500/20">
                    {ai.modelIdentifier}
                  </span>
                  <span className="font-mono text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded">
                    {ai.latencyMs}ms
                  </span>
                </div>
              </div>

              <div className="console-ai-summary-box mb-4">
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {ai.assessmentSummary}
                </p>
              </div>

              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Key Heuristic &amp; Telemetry Findings:</h4>
              <ul className="console-evidence-list">
                {ai.keyFindings.map((f, i) => (
                  <li key={i} className="text-xs text-slate-200">{f}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Tab 6: Verdict Policy */}
        {activeTab === 'VERDICT' && verdict && (
          <div className="console-tab-pane">
            <div className="console-policy-verdict-card p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <StatusBadge status={verdict.classification} size="md" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{verdict.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{verdict.message}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                  {verdict.extensionNotified ? 'Client Acknowledged' : 'Live Sync Active'}
                </span>
              </div>
            </div>

            <div className="console-pane-subcard mb-4">
              <div className="subcard-header">
                <FileText size={15} className="text-sky-400" />
                <h4 className="subcard-title">Enforced Policy Reasons</h4>
              </div>
              <div className="subcard-body">
                <ul className="console-evidence-list">
                  {verdict.primaryReasons.map((r, i) => (
                    <li key={i} className="text-xs text-slate-200">{r}</li>
                  ))}
                </ul>
              </div>
            </div>

            {verdict.decisionPolicyRules.length > 0 && (
              <div className="console-pane-subcard">
                <div className="subcard-header">
                  <ShieldCheck size={15} className="text-emerald-400" />
                  <h4 className="subcard-title">Triggered Decision Rules</h4>
                </div>
                <div className="subcard-body">
                  {verdict.decisionPolicyRules.map((rule) => (
                    <div key={rule.ruleId} className="policy-rule-card">
                      <span className="font-mono font-bold text-sky-400 text-xs">{rule.ruleId}</span>
                      <span className="font-semibold text-slate-200 text-xs">{rule.name}</span>
                      <span className="text-slate-400 text-xs">{rule.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
