import React, { useState, useEffect } from 'react';
import { useConsole } from '../context/ConsoleContext.tsx';
import { apiClient } from '../services/apiClient.ts';
import type { BrandFinding } from '../types/index.ts';
import {
  Fingerprint,
  ShieldAlert,
  Copy,
  Tag,
  Sparkles,
  Globe,
  Play,
} from 'lucide-react';

export const BrandContentPage: React.FC = () => {
  const { selectedInvestigationId, startNewInvestigation, isAnalyzing } = useConsole();
  const [brand, setBrand] = useState<BrandFinding | null>(null);
  const [targetInput, setTargetInput] = useState<string>('');

  useEffect(() => {
    if (selectedInvestigationId) {
      apiClient.getBrandFinding(selectedInvestigationId).then((res) => setBrand(res));
    } else {
      setBrand(null);
    }
  }, [selectedInvestigationId]);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetInput.trim()) {
      await startNewInvestigation(targetInput.trim());
      setTargetInput('');
    }
  };

  if (!brand) {
    return (
      <div className="console-page-container">
        <div className="console-card text-center p-8">
          <Fingerprint size={32} className="text-purple-400 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-slate-200">No Target Investigation Selected</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Dispatch an autonomous investigation or select an existing target to inspect trademark lookalikes, typo-squatting, and visual spoofing.
          </p>
          <form onSubmit={handleLaunch} className="console-dispatch-form max-w-xl mx-auto mt-6">
            <div className="console-input-wrapper flex-1">
              <Globe size={16} className="console-input-icon" />
              <input
                type="text"
                className="console-url-input"
                placeholder="Enter URL to inspect brand authenticity (e.g. https://target-brand.com)..."
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
              <Play size={14} fill="currentColor" />
              <span>{isAnalyzing ? 'Analyzing...' : 'Inspect Brand'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="console-page-container">
      <div className="console-page-header">
        <div>
          <h1 className="console-page-title">Brand Impersonation &amp; Content Authenticity</h1>
          <p className="console-page-desc">
            Forensic analysis of trademark lookalikes, Levenshtein typo-squatting, visual asset scraping, and copied store content.
          </p>
        </div>
      </div>

      {/* Brand Comparison Hero Card */}
      <div className="console-card console-brand-hero-card">
        <div className="console-brand-compare-grid">
          <div className="brand-compare-col">
            <span className="compare-col-label">Claimed / Detected Brand</span>
            <div className="brand-name-display text-crimson-400 font-bold text-lg">
              {brand.claimedBrand || 'No Brand Claimed'}
            </div>
            <span className="compare-sub">Scraped logos &amp; trademark assets detected</span>
          </div>

          <div className="brand-compare-divider">
            <div className="vs-badge">VS</div>
          </div>

          <div className="brand-compare-col">
            <span className="compare-col-label">Official Trademark Domain</span>
            <div className="brand-name-display font-mono text-sky-400 text-lg">
              {brand.officialDomain || 'N/A'}
            </div>
            <span className={`compare-sub ${brand.isOfficialDomain ? 'text-emerald-400' : 'text-crimson-400 font-bold'}`}>
              {brand.isOfficialDomain ? 'OFFICIAL DOMAIN VERIFIED' : 'UNAUTHORIZED DOMAIN STRUCTURE'}
            </span>
          </div>
        </div>

        {/* Visual Similarity & Integrity Bar */}
        <div className="console-brand-metrics-row mt-4">
          <div className="brand-metric-pill">
            <span className="metric-name">Visual Asset Similarity:</span>
            <span className="metric-val font-mono text-crimson-400 font-bold">{brand.visualSimilarityScore}%</span>
          </div>
          <div className="brand-metric-pill">
            <span className="metric-name">Typo-squatting Distance:</span>
            <span className="metric-val font-mono">{brand.typoDistance}</span>
          </div>
          <div className="brand-metric-pill">
            <span className="metric-name">Content Integrity Score:</span>
            <span className="metric-val font-mono text-crimson-400 font-bold">{brand.contentIntegrityScore}/100</span>
          </div>
        </div>
      </div>

      {/* Impersonation Indicators */}
      {brand.impersonationIndicators.length > 0 && (
        <div className="console-card">
          <div className="console-card-header">
            <div className="card-header-title-group">
              <ShieldAlert size={17} className="text-crimson-400" />
              <h3 className="card-title">Active Brand Impersonation Indicators</h3>
            </div>
          </div>

          <div className="console-indicators-list">
            {brand.impersonationIndicators.map((ind) => (
              <div key={ind.id} className="console-indicator-item">
                <div className="indicator-header">
                  <span className="font-bold text-slate-200">{ind.title}</span>
                  <span className="console-mini-tag text-crimson-400 bg-crimson-500/10">{ind.type}</span>
                </div>
                <p className="indicator-desc text-slate-300 text-xs mt-1">{ind.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Copied Content & Suspicious Marketing Claims */}
      <div className="console-two-col-grid">
        <div className="console-card">
          <div className="console-card-header">
            <div className="card-header-title-group">
              <Copy size={17} className="text-amber-400" />
              <h3 className="card-title">Copied Content &amp; Stolen Boilerplates</h3>
            </div>
          </div>

          <div className="console-content-list">
            {brand.copiedContentIndicators.length === 0 ? (
              <p className="text-slate-400 text-sm">No copied text detected.</p>
            ) : (
              brand.copiedContentIndicators.map((item, i) => (
                <div key={i} className="content-item font-mono text-xs text-slate-300">
                  • {item}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="console-card">
          <div className="console-card-header">
            <div className="card-header-title-group">
              <Tag size={17} className="text-sky-400" />
              <h3 className="card-title">Deceptive Liquidation &amp; Pricing Claims</h3>
            </div>
          </div>

          <div className="console-content-list">
            {brand.suspiciousClaims.length === 0 ? (
              <p className="text-slate-400 text-sm">No deceptive pricing claims found.</p>
            ) : (
              brand.suspiciousClaims.map((claim, i) => (
                <div key={i} className="content-item font-mono text-xs text-slate-300">
                  • {claim}
                </div>
              ))
            )}
          </div>

          {/* AI-Generated Content Supporting Signal */}
          <div className="console-ai-weak-signal mt-4">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Sparkles size={13} className="text-purple-400" />
              <span>AI-Generated Copy Confidence: <strong>{brand.aiGeneratedContentConfidence}%</strong></span>
              <span className="text-slate-500 text-[10px]">(Weak supporting signal only)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
