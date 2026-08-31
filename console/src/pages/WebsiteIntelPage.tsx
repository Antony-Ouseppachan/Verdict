import React, { useState, useEffect } from 'react';
import { useConsole } from '../context/ConsoleContext.tsx';
import { apiClient } from '../services/apiClient.ts';
import type { WebsiteIntelligence } from '../types/index.ts';
import {
  Globe,
  Lock,
  Building,
  Calendar,
  ShieldAlert,
  Play,
} from 'lucide-react';
import { formatDate } from '../utils/formatters.ts';

export const WebsiteIntelPage: React.FC = () => {
  const { selectedInvestigationId, startNewInvestigation, isAnalyzing } = useConsole();
  const [intel, setIntel] = useState<WebsiteIntelligence | null>(null);
  const [targetInput, setTargetInput] = useState<string>('');

  useEffect(() => {
    if (selectedInvestigationId) {
      apiClient.getWebsiteIntel(selectedInvestigationId).then((res) => setIntel(res));
    } else {
      setIntel(null);
    }
  }, [selectedInvestigationId]);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetInput.trim()) {
      await startNewInvestigation(targetInput.trim());
      setTargetInput('');
    }
  };

  if (!intel) {
    return (
      <div className="console-page-container">
        <div className="console-card text-center p-8">
          <Globe size={32} className="text-sky-400 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-slate-200">No Target Investigation Selected</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Dispatch an autonomous investigation or select an existing target to inspect WHOIS registrar data, TLS cryptography, and business registries.
          </p>
          <form onSubmit={handleLaunch} className="console-dispatch-form max-w-xl mx-auto mt-6">
            <div className="console-input-wrapper flex-1">
              <Globe size={16} className="console-input-icon" />
              <input
                type="text"
                className="console-url-input"
                placeholder="Enter URL to inspect domain intelligence (e.g. https://target-domain.com)..."
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
              <span>{isAnalyzing ? 'Analyzing...' : 'Inspect Domain'}</span>
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
          <h1 className="console-page-title">Website &amp; Domain Infrastructure Intelligence</h1>
          <p className="console-page-desc">
            WHOIS registration verification, TLS cryptographic validation, business entity registry checks, and domain reputation.
          </p>
        </div>
      </div>

      {/* Domain Top Strip */}
      <div className="console-card console-intel-top-card">
        <div className="intel-top-grid">
          <div className="intel-top-item">
            <span className="intel-label">Domain Name</span>
            <span className="intel-val font-mono">{intel.domain}</span>
          </div>
          <div className="intel-top-item">
            <span className="intel-label">Domain Age</span>
            <span className={`intel-val font-mono font-bold ${intel.domainAgeDays < 30 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {intel.domainAgeDays} Days Old
            </span>
          </div>
          <div className="intel-top-item">
            <span className="intel-label">Hosting Provider</span>
            <span className="intel-val">{intel.hostingProvider}</span>
          </div>
          <div className="intel-top-item">
            <span className="intel-label">IP &amp; Country</span>
            <span className="intel-val font-mono">{intel.ipAddress} ({intel.serverCountry})</span>
          </div>
          <div className="intel-top-item">
            <span className="intel-label">Reputation Score</span>
            <span className={`intel-val font-mono font-bold ${intel.reputationScore < 30 ? 'text-crimson-400' : 'text-emerald-400'}`}>
              {intel.reputationScore}/100
            </span>
          </div>
        </div>
      </div>

      {/* Inconsistencies Section */}
      {intel.inconsistencies.length > 0 && (
        <div className="console-card border-crimson">
          <div className="console-card-header">
            <div className="card-header-title-group">
              <ShieldAlert size={17} className="text-crimson-400" />
              <h3 className="card-title">Domain &amp; Business Inconsistencies Flagged</h3>
            </div>
          </div>
          <div className="console-inconsistencies-list">
            {intel.inconsistencies.map((inc) => (
              <div key={inc.id} className="inconsistency-row">
                <span className="inc-title font-bold text-slate-200">{inc.title}:</span>
                <span className="inc-desc text-slate-300 ml-2">{inc.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: WHOIS & TLS Certificate */}
      <div className="console-two-col-grid">
        {/* WHOIS Card */}
        <div className="console-card">
          <div className="console-card-header">
            <div className="card-header-title-group">
              <Globe size={17} className="text-sky-400" />
              <h3 className="card-title">WHOIS Registration Data</h3>
            </div>
          </div>

          <div className="console-key-val-table">
            <div className="console-kv-row"><span className="kv-key">Registrar:</span><span className="kv-val">{intel.registration.registrar}</span></div>
            <div className="console-kv-row"><span className="kv-key">Created Date:</span><span className="kv-val font-mono">{formatDate(intel.registration.createdDate)}</span></div>
            <div className="console-kv-row"><span className="kv-key">Expires Date:</span><span className="kv-val font-mono">{formatDate(intel.registration.expiresDate)}</span></div>
            <div className="console-kv-row"><span className="kv-key">Identity Privacy:</span><span className="kv-val text-amber-400 font-semibold">{intel.registration.isPrivate ? 'ACTIVE (WHOIS Shielding)' : 'PUBLIC'}</span></div>
            <div className="console-kv-row"><span className="kv-key">Country:</span><span className="kv-val font-mono">{intel.registration.registrantCountry}</span></div>
          </div>
        </div>

        {/* TLS Certificate Card */}
        <div className="console-card">
          <div className="console-card-header">
            <div className="card-header-title-group">
              <Lock size={17} className="text-emerald-400" />
              <h3 className="card-title">TLS Certificate Cryptography</h3>
            </div>
          </div>

          <div className="console-key-val-table">
            <div className="console-kv-row"><span className="kv-key">Certificate Issuer:</span><span className="kv-val">{intel.tls.issuer}</span></div>
            <div className="console-kv-row"><span className="kv-key">Protocol Version:</span><span className="kv-val font-mono font-bold text-emerald-400">{intel.tls.protocol}</span></div>
            <div className="console-kv-row"><span className="kv-key">Certificate Age:</span><span className="kv-val font-mono">{intel.tls.certAgeDays} Days Old</span></div>
            <div className="console-kv-row"><span className="kv-key">Validity Status:</span><span className="kv-val text-emerald-400 font-semibold">{intel.tls.isValid ? 'VALID' : 'INVALID / EXPIRED'}</span></div>
            <div className="console-kv-row"><span className="kv-key">Days Remaining:</span><span className="kv-val font-mono">{intel.tls.daysRemaining} Days</span></div>
          </div>
        </div>
      </div>

      {/* Business Entity & Historical Record */}
      <div className="console-two-col-grid">
        <div className="console-card">
          <div className="console-card-header">
            <div className="card-header-title-group">
              <Building size={17} className="text-purple-400" />
              <h3 className="card-title">Claimed Business Entity Information</h3>
            </div>
          </div>

          <div className="console-key-val-table">
            <div className="console-kv-row"><span className="kv-key">Legal Business Name:</span><span className="kv-val">{intel.business.companyName || 'None Provided'}</span></div>
            <div className="console-kv-row"><span className="kv-key">Physical Address:</span><span className="kv-val text-slate-300">{intel.business.physicalAddress || 'Missing / Generic'}</span></div>
            <div className="console-kv-row"><span className="kv-key">Contact Email:</span><span className="kv-val font-mono text-xs">{intel.business.contactEmail || 'None'}</span></div>
            <div className="console-kv-row"><span className="kv-key">Verified Registry:</span><span className="kv-val text-amber-400 font-semibold">{intel.business.isVerifiedEntity ? 'VERIFIED' : 'UNVERIFIED ENTITY'}</span></div>
          </div>
        </div>

        <div className="console-card">
          <div className="console-card-header">
            <div className="card-header-title-group">
              <Calendar size={17} className="text-slate-400" />
              <h3 className="card-title">Historical Intelligence &amp; Fraud Clusters</h3>
            </div>
          </div>

          <div className="console-history-incidents">
            {intel.historicalIncidents.length === 0 ? (
              <p className="text-slate-400 text-sm">No prior historical threat incidents recorded.</p>
            ) : (
              intel.historicalIncidents.map((inc, i) => (
                <div key={i} className="incident-item text-xs text-slate-300 font-mono">
                  • {inc}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
