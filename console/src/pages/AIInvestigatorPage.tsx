import React, { useState, useEffect } from 'react';
import { useConsole } from '../context/ConsoleContext.tsx';
import { apiClient } from '../services/apiClient.ts';
import type { AIAnalysis } from '../types/index.ts';
import {
  BrainCircuit,
  Scale,
  Sliders,
  Play,
  Globe,
} from 'lucide-react';

export const AIInvestigatorPage: React.FC = () => {
  const { selectedInvestigationId, startNewInvestigation, isAnalyzing } = useConsole();
  const [ai, setAi] = useState<AIAnalysis | null>(null);
  const [targetInput, setTargetInput] = useState<string>('');

  useEffect(() => {
    if (selectedInvestigationId) {
      apiClient.getAIAnalysis(selectedInvestigationId).then((res) => setAi(res));
    } else {
      setAi(null);
    }
  }, [selectedInvestigationId]);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetInput.trim()) {
      await startNewInvestigation(targetInput.trim());
      setTargetInput('');
    }
  };

  if (!ai) {
    return (
      <div className="console-page-container">
        <div className="console-card text-center p-8">
          <BrainCircuit size={32} className="text-indigo-400 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-slate-200">No Target Investigation Selected</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Dispatch an autonomous investigation or select an existing target to inspect AI evidence synthesis, conflicting signal resolution, and model reasoning.
          </p>
          <form onSubmit={handleLaunch} className="console-dispatch-form max-w-xl mx-auto mt-6">
            <div className="console-input-wrapper flex-1">
              <Globe size={16} className="console-input-icon" />
              <input
                type="text"
                className="console-url-input"
                placeholder="Enter URL to inspect AI reasoning (e.g. https://target-shop.com)..."
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
              <span>{isAnalyzing ? 'Analyzing...' : 'Inspect AI Reasoning'}</span>
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
          <h1 className="console-page-title">Autonomous AI Investigator &amp; Evidence Synthesis</h1>
          <p className="console-page-desc">
            Evidence-based reasoning engine synthesizing conflicting forensic signals, risk factor weights, and policy actions.
          </p>
        </div>
      </div>

      {/* AI Assessment Briefing Card */}
      <div className="console-card console-ai-briefing-card">
        <div className="ai-briefing-header">
          <div className="flex items-center gap-2">
            <BrainCircuit size={20} className="text-indigo-400" />
            <span className="font-bold text-sm text-slate-200 uppercase tracking-wider">Autonomous Synthesis Briefing</span>
          </div>
          <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded">
            {ai.modelIdentifier} ({ai.latencyMs}ms)
          </span>
        </div>

        <p className="ai-summary-text text-base font-medium text-slate-100 mt-3 leading-relaxed">
          {ai.assessmentSummary}
        </p>

        <div className="ai-reasoning-quote mt-3 p-3 bg-slate-900/60 rounded border border-slate-800 text-xs text-slate-300 italic">
          &quot;{ai.reasoningBriefing}&quot;
        </div>

        <div className="ai-meta-pills mt-4 flex items-center gap-4">
          <div className="ai-meta-pill">
            <span className="text-slate-400 text-xs">Reasoning Confidence:</span>
            <span className="font-mono font-bold text-emerald-400 ml-1">{ai.confidenceScore}%</span>
          </div>
          <div className="ai-meta-pill">
            <span className="text-slate-400 text-xs">Recommended Action:</span>
            <span className="font-mono font-bold text-sky-400 ml-1">{ai.recommendedAction}</span>
          </div>
        </div>
      </div>

      {/* Key Findings List */}
      <div className="console-card">
        <div className="console-card-header">
          <h3 className="card-title">Key Forensic Findings</h3>
        </div>
        <ul className="console-evidence-list">
          {ai.keyFindings.map((finding, idx) => (
            <li key={idx} className="text-xs text-slate-200">{finding}</li>
          ))}
        </ul>
      </div>

      {/* Grid: Evidence Supplied & Risk Factors */}
      <div className="console-two-col-grid">
        {/* Left: Supplied Evidence Matrix */}
        <div className="console-card">
          <div className="console-card-header">
            <div className="card-header-title-group">
              <Scale size={17} className="text-sky-400" />
              <h3 className="card-title">Evidence Supplied to Model</h3>
            </div>
          </div>

          <div className="console-evidence-items-list">
            {ai.evidenceSupplied.map((ev) => (
              <div key={ev.id} className="console-evidence-item">
                <div className="ev-top-row">
                  <span className="font-bold text-slate-200 text-xs">{ev.title}</span>
                  <span className={`console-mini-tag ${ev.weight === 'CRITICAL' ? 'text-crimson-400 bg-crimson-500/10' : 'text-sky-400 bg-sky-500/10'}`}>
                    {ev.weight} WEIGHT
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-1">{ev.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Risk Factors & Conflicting Signals */}
        <div className="console-card">
          <div className="console-card-header">
            <div className="card-header-title-group">
              <Sliders size={17} className="text-amber-400" />
              <h3 className="card-title">Risk Factors &amp; Conflicting Signals</h3>
            </div>
          </div>

          <div className="console-risk-factors-list">
            {ai.riskFactors.map((rf, i) => (
              <div key={i} className="risk-factor-item">
                <div className="rf-header">
                  <span className="text-xs font-semibold text-slate-200">{rf.name}</span>
                  <span className="font-mono text-xs font-bold text-slate-300">{rf.score}/100</span>
                </div>
                <div className="console-mini-bar-track mt-1">
                  <div
                    className={`console-mini-bar-fill ${rf.score > 70 ? 'bg-crimson-500' : rf.score > 35 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${rf.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Conflicting Signals Resolution */}
          {ai.conflictingSignals.length > 0 && (
            <div className="console-conflicts-section mt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Conflicting Signals Resolution:</h4>
              {ai.conflictingSignals.map((cs) => (
                <div key={cs.id} className="console-conflict-card">
                  <div className="text-xs font-bold text-slate-200">{cs.title}</div>
                  <div className="grid grid-cols-2 gap-2 mt-1 text-[11px]">
                    <div className="text-slate-400"><strong>Benign:</strong> {cs.benignInterpretation}</div>
                    <div className="text-slate-400"><strong>Malicious:</strong> {cs.maliciousInterpretation}</div>
                  </div>
                  <div className="mt-1 text-xs text-sky-400"><strong>AI Resolution:</strong> {cs.resolutionRationale}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
