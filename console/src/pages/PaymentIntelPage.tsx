import React, { useState, useEffect } from 'react';
import { useConsole } from '../context/ConsoleContext.tsx';
import { apiClient } from '../services/apiClient.ts';
import type { PaymentFinding } from '../types/index.ts';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import {
  CreditCard,
  ShieldAlert,
  Layers,
  Globe,
  Play,
} from 'lucide-react';

export const PaymentIntelPage: React.FC = () => {
  const { selectedInvestigationId, startNewInvestigation, isAnalyzing } = useConsole();
  const [payment, setPayment] = useState<PaymentFinding | null>(null);
  const [targetInput, setTargetInput] = useState<string>('');

  useEffect(() => {
    if (selectedInvestigationId) {
      apiClient.getPaymentFinding(selectedInvestigationId).then((res) => setPayment(res));
    } else {
      setPayment(null);
    }
  }, [selectedInvestigationId]);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetInput.trim()) {
      await startNewInvestigation(targetInput.trim());
      setTargetInput('');
    }
  };

  if (!payment) {
    return (
      <div className="console-page-container">
        <div className="console-card text-center p-8">
          <CreditCard size={32} className="text-emerald-400 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-slate-200">No Target Investigation Selected</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Dispatch an autonomous investigation or select an existing target to inspect payment SDKs, tokenization iframes, and checkout redirection chains.
          </p>
          <form onSubmit={handleLaunch} className="console-dispatch-form max-w-xl mx-auto mt-6">
            <div className="console-input-wrapper flex-1">
              <Globe size={16} className="console-input-icon" />
              <input
                type="text"
                className="console-url-input"
                placeholder="Enter URL to inspect checkout forensics (e.g. https://target-shop.com)..."
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
              <span>{isAnalyzing ? 'Analyzing...' : 'Inspect Payment'}</span>
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
          <h1 className="console-page-title">Payment Intelligence &amp; Checkout Forensics</h1>
          <p className="console-page-desc">
            Deep-dive inspection of checkout DOM structures, gateway tokenization, SDK provenance, and credit card interception traps.
          </p>
        </div>
      </div>

      {/* Primary Payment Verdict Header */}
      <div className="console-card console-payment-hero-card">
        <div className="payment-hero-left">
          <div className="flex items-center gap-3">
            <StatusBadge status={payment.status} size="lg" />
            <span className="font-mono text-xs text-slate-400">Investigation: {payment.investigationId}</span>
          </div>
          <h2 className="payment-hero-title mt-2">
            {payment.status === 'SUSPICIOUS' ? 'Insecure Payment Architecture & Potential Harvest Trap' : 'Payment Infrastructure Assessment'}
          </h2>
          <p className="payment-hero-desc">
            {payment.collectsRawCardDataDirectly
              ? 'Critical Vulnerability: Form captures raw PAN/CVV input directly into DOM without PCI-DSS certified tokenized iframes.'
              : 'Checkout flow utilizes tokenized gateways or standard merchant checkout.'}
          </p>
        </div>

        <div className="payment-hero-checks">
          <div className={`payment-check-item ${payment.collectsRawCardDataDirectly ? 'is-danger' : 'is-safe'}`}>
            <span className="check-label">Direct Card Interception:</span>
            <span className="check-val font-mono">{payment.collectsRawCardDataDirectly ? 'DETECTED' : 'CLEAR'}</span>
          </div>
          <div className={`payment-check-item ${payment.cryptoWalletDetected ? 'is-warn' : 'is-safe'}`}>
            <span className="check-label">Crypto-Only Checkout:</span>
            <span className="check-val font-mono">{payment.cryptoWalletDetected ? 'DETECTED' : 'CLEAR'}</span>
          </div>
          <div className={`payment-check-item ${payment.offPlatformTransferDetected ? 'is-danger' : 'is-safe'}`}>
            <span className="check-label">Off-Platform Exfiltration:</span>
            <span className="check-val font-mono">{payment.offPlatformTransferDetected ? 'DETECTED' : 'CLEAR'}</span>
          </div>
        </div>
      </div>

      {/* Anomalies List */}
      {payment.anomalies.length > 0 && (
        <div className="console-payment-anomalies-grid">
          {payment.anomalies.map((ano) => (
            <div key={ano.id} className="console-payment-anomaly-card">
              <div className="anomaly-icon text-crimson-400">
                <ShieldAlert size={18} />
              </div>
              <div className="anomaly-details">
                <h4 className="anomaly-title">{ano.title}</h4>
                <p className="anomaly-desc">{ano.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Forensic Breakdown Grid */}
      <div className="console-two-col-grid">
        {/* Left Column: Detected Gateways & SDKs */}
        <div className="console-card">
          <div className="console-card-header">
            <div className="card-header-title-group">
              <CreditCard size={17} className="text-emerald-400" />
              <h3 className="card-title">Detected Gateways &amp; Client SDKs</h3>
            </div>
          </div>

          <div className="console-sdks-list">
            {payment.sdks.length === 0 ? (
              <p className="text-slate-400 text-sm">No external payment SDKs loaded.</p>
            ) : (
              payment.sdks.map((sdk, index) => (
                <div key={index} className="console-sdk-item">
                  <div className="sdk-title-row">
                    <span className="sdk-name font-bold text-slate-200">{sdk.name}</span>
                    <span className={`console-mini-tag ${sdk.isAuthenticOrigin ? 'text-emerald-400 bg-emerald-500/10' : 'text-crimson-400 bg-crimson-500/10'}`}>
                      {sdk.isAuthenticOrigin ? 'AUTHENTIC SDK ORIGIN' : 'UNVERIFIED / SPOOFED SCRIPT'}
                    </span>
                  </div>
                  <div className="sdk-source font-mono text-xs text-slate-400 mt-1 truncate" title={sdk.sourceUrl}>
                    {sdk.sourceUrl}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Payment Domains & Redirection Chain */}
        <div className="console-card">
          <div className="console-card-header">
            <div className="card-header-title-group">
              <Layers size={17} className="text-sky-400" />
              <h3 className="card-title">Payment Domains &amp; Redirection Chains</h3>
            </div>
          </div>

          <div className="console-domains-section">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Target Payment Domains:</h4>
            <div className="console-tags-row mb-4">
              {payment.paymentDomains.map((d) => (
                <span key={d} className="console-tag font-mono text-xs text-sky-400 bg-sky-500/10">{d}</span>
              ))}
            </div>

            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Redirect Chain:</h4>
            <div className="console-redirect-chain">
              {payment.redirectChains.map((r, i) => (
                <div key={i} className="redirect-step">
                  <span className="step-num font-mono text-xs text-slate-500">[{i + 1}]</span>
                  <span className="step-url font-mono text-xs text-slate-300 truncate" title={r}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
