import React, { useState, useEffect } from 'react';
import { useConsole } from '../context/ConsoleContext.tsx';
import { apiClient } from '../services/apiClient.ts';
import type { VerdictRecord } from '../types/index.ts';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { RiskGauge } from '../components/common/RiskGauge.tsx';
import {
  Send,
  ListChecks,
  ShieldCheck,
  Globe,
  Play,
} from 'lucide-react';

export const VerdictPage: React.FC = () => {
  const { selectedInvestigationId, startNewInvestigation, isAnalyzing } = useConsole();
  const [verdict, setVerdict] = useState<VerdictRecord | null>(null);
  const [targetInput, setTargetInput] = useState<string>('');

  useEffect(() => {
    if (selectedInvestigationId) {
      apiClient.getVerdictRecord(selectedInvestigationId).then((res) => setVerdict(res));
    } else {
      setVerdict(null);
    }
  }, [selectedInvestigationId]);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetInput.trim()) {
      await startNewInvestigation(targetInput.trim());
      setTargetInput('');
    }
  };

  if (!verdict) {
    return (
      <div className="console-page-container">
        <div className="console-card text-center p-8">
          <ShieldCheck size={32} className="text-emerald-400 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-slate-200">No Target Investigation Selected</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Dispatch an autonomous investigation or select an existing target to inspect final policy classifications, rule evaluation matrices, and extension payloads.
          </p>
          <form onSubmit={handleLaunch} className="console-dispatch-form max-w-xl mx-auto mt-6">
            <div className="console-input-wrapper flex-1">
              <Globe size={16} className="console-input-icon" />
              <input
                type="text"
                className="console-url-input"
                placeholder="Enter URL to inspect verdict decision (e.g. https://target-shop.com)..."
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
              <span>{isAnalyzing ? 'Analyzing...' : 'Inspect Verdict'}</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isDanger = verdict.classification === 'DANGER';
  const isCaution = verdict.classification === 'CAUTION';

  return (
    <div className="console-page-container">
      <div className="console-page-header">
        <div>
          <h1 className="console-page-title">Final Verdict &amp; Enforcement Policy</h1>
          <p className="console-page-desc">
            Decision policy engine evaluation, rule trigger verification, and browser extension enforcement payload.
          </p>
        </div>
      </div>

      {/* Main Verdict Card */}
      <div className={`console-card console-verdict-master-card ${isDanger ? 'border-crimson-400' : isCaution ? 'border-amber-400' : 'border-emerald-400'}`}>
        <div className="verdict-master-top">
          <div className="verdict-master-headline">
            <div className="flex items-center gap-3">
              <StatusBadge status={verdict.classification} size="lg" />
              <span className="font-mono text-xs text-slate-400">Decision ID: {verdict.investigationId}</span>
            </div>
            <h2 className="verdict-master-title mt-2">{verdict.title}</h2>
            <p className="verdict-master-msg text-sm text-slate-300">{verdict.message}</p>
          </div>

          <div className="verdict-master-gauge">
            <RiskGauge score={verdict.threatScore} size={84} />
          </div>
        </div>

        {/* Primary Reasons List */}
        <div className="console-verdict-reasons mt-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Primary Decision Reasons:</h4>
          <ul className="console-evidence-list">
            {verdict.primaryReasons.map((reason, i) => (
              <li key={i} className="text-xs text-slate-200">{reason}</li>
            ))}
          </ul>
        </div>

        {/* Enforcement Row */}
        <div className="console-enforcement-dispatch-row mt-4">
          <div className="flex items-center gap-2">
            <Send size={15} className="text-sky-400" />
            <span className="text-xs text-slate-300">
              Extension Action Dispatched: <strong className="font-mono text-sky-400">{verdict.recommendedUserAction}</strong>
            </span>
          </div>
          <span className="text-xs font-mono text-emerald-400">
            {verdict.extensionNotified ? 'Client Acknowledged (Live)' : 'Pending Client Sync'}
          </span>
        </div>
      </div>

      {/* Policy Rules Matrix */}
      <div className="console-card">
        <div className="console-card-header">
          <div className="card-header-title-group">
            <ListChecks size={17} className="text-sky-400" />
            <h3 className="card-title">Decision Policy Rules Evaluation Matrix</h3>
          </div>
        </div>

        <div className="console-table-wrapper">
          <table className="console-data-table">
            <thead>
              <tr>
                <th>Rule ID</th>
                <th>Policy Rule Name</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Rule Description</th>
              </tr>
            </thead>
            <tbody>
              {verdict.decisionPolicyRules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="console-empty-cell">Standard default safety baseline applied.</td>
                </tr>
              ) : (
                verdict.decisionPolicyRules.map((rule) => (
                  <tr key={rule.ruleId} className="console-table-row">
                    <td className="font-mono text-xs text-sky-400">{rule.ruleId}</td>
                    <td className="font-bold text-slate-200 text-xs">{rule.name}</td>
                    <td>
                      <span className={`console-mini-tag ${rule.severity === 'CRITICAL' ? 'text-crimson-400 bg-crimson-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                        {rule.severity}
                      </span>
                    </td>
                    <td>
                      <span className="console-mini-tag text-crimson-400 bg-crimson-500/10 font-bold">
                        {rule.matched ? 'TRIGGERED' : 'CLEAR'}
                      </span>
                    </td>
                    <td className="text-xs text-slate-300">{rule.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
