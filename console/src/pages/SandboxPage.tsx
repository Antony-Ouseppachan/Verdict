import React, { useState, useEffect } from 'react';
import { useConsole } from '../context/ConsoleContext.tsx';
import { apiClient } from '../services/apiClient.ts';
import type { SandboxSession, NetworkRequest } from '../types/index.ts';
import {
  Terminal,
  ShieldAlert,
  FileCode,
  Globe,
  Play,
} from 'lucide-react';
import { formatDuration, formatTimestamp } from '../utils/formatters.ts';
import { redactSensitiveText } from '../utils/redact.ts';

export const SandboxPage: React.FC = () => {
  const { selectedInvestigationId, startNewInvestigation, isAnalyzing } = useConsole();
  const [session, setSession] = useState<SandboxSession | null>(null);
  const [activeTab, setActiveTab] = useState<'NETWORK' | 'SCRIPTS' | 'FORMS' | 'FLAGS'>('NETWORK');
  const [selectedRequest, setSelectedRequest] = useState<NetworkRequest | null>(null);
  const [targetInput, setTargetInput] = useState<string>('');

  useEffect(() => {
    if (selectedInvestigationId) {
      apiClient.getSandboxSession(selectedInvestigationId).then((res) => {
        setSession(res);
        if (res?.networkRequests.length) {
          setSelectedRequest(res.networkRequests[0]);
        }
      });
    } else {
      setSession(null);
    }
  }, [selectedInvestigationId]);

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetInput.trim()) {
      await startNewInvestigation(targetInput.trim());
      setTargetInput('');
    }
  };

  if (!session) {
    return (
      <div className="console-page-container">
        <div className="console-card text-center p-8">
          <Terminal size={32} className="text-sky-400 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-slate-200">No Target Investigation Selected</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
            Dispatch an autonomous investigation or select an existing target to inspect headless container runtime logs, network requests, and behavioral flags.
          </p>
          <form onSubmit={handleLaunch} className="console-dispatch-form max-w-xl mx-auto mt-6">
            <div className="console-input-wrapper flex-1">
              <Globe size={16} className="console-input-icon" />
              <input
                type="text"
                className="console-url-input"
                placeholder="Enter URL to inspect in sandbox (e.g. https://target-domain.com)..."
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
              <span>{isAnalyzing ? 'Running Sandbox...' : 'Run Sandbox'}</span>
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
          <h1 className="console-page-title">Headless Sandbox &amp; Runtime Behavioral Telemetry</h1>
          <p className="console-page-desc">
            Isolated browser execution logs, network interception, JavaScript API hooking, and behavioral anomaly detection.
          </p>
        </div>
      </div>

      {/* Session Metadata Strip */}
      <div className="console-card console-session-meta-card">
        <div className="console-session-meta-grid">
          <div className="session-meta-item">
            <span className="meta-label">Session ID</span>
            <span className="meta-val font-mono">{session.id}</span>
          </div>
          <div className="session-meta-item">
            <span className="meta-label">Target URL</span>
            <span className="meta-val font-mono truncate" title={session.targetUrl}>{session.targetUrl}</span>
          </div>
          <div className="session-meta-item">
            <span className="meta-label">Worker Node</span>
            <span className="meta-val font-mono">{session.workerId}</span>
          </div>
          <div className="session-meta-item">
            <span className="meta-label">Execution Duration</span>
            <span className="meta-val font-mono">{formatDuration(session.durationMs)}</span>
          </div>
          <div className="session-meta-item">
            <span className="meta-label">Network Calls</span>
            <span className="meta-val font-mono font-bold text-sky-400">{session.networkRequests.length}</span>
          </div>
          <div className="session-meta-item">
            <span className="meta-label">Behavior Flags</span>
            <span className="meta-val font-mono font-bold text-crimson-400">{session.behaviorFlags.length}</span>
          </div>
        </div>
      </div>

      {/* Behavior Flags Warning Strip if detected */}
      {session.behaviorFlags.length > 0 && (
        <div className="console-behavior-flags-strip">
          {session.behaviorFlags.map((flag) => (
            <div key={flag.id} className="console-behavior-flag-card">
              <div className="flag-icon text-crimson-400">
                <ShieldAlert size={16} />
              </div>
              <div className="flag-details">
                <div className="flag-title-row">
                  <span className="flag-title">{flag.title}</span>
                  <span className="console-mini-tag text-crimson-400 bg-crimson-500/10">{flag.category}</span>
                </div>
                <p className="flag-desc">{flag.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs and Inspector */}
      <div className="console-card console-sandbox-main-card">
        <div className="console-tab-pill-group mb-4">
          <button
            type="button"
            className={`console-tab-pill ${activeTab === 'NETWORK' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('NETWORK')}
          >
            Network Traffic ({session.networkRequests.length})
          </button>
          <button
            type="button"
            className={`console-tab-pill ${activeTab === 'SCRIPTS' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('SCRIPTS')}
          >
            Hooked Scripts ({session.scripts.length})
          </button>
          <button
            type="button"
            className={`console-tab-pill ${activeTab === 'FORMS' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('FORMS')}
          >
            Captured Forms ({session.forms.length})
          </button>
          <button
            type="button"
            className={`console-tab-pill ${activeTab === 'FLAGS' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('FLAGS')}
          >
            Behavioral Flags ({session.behaviorFlags.length})
          </button>
        </div>

        {activeTab === 'NETWORK' && (
          <div className="console-network-inspector-layout">
            <div className="console-network-table-col">
              <table className="console-data-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Domain / URL</th>
                    <th>Type</th>
                    <th>Latency</th>
                  </tr>
                </thead>
                <tbody>
                  {session.networkRequests.map((req) => (
                    <tr
                      key={req.id}
                      className={`console-table-row clickable ${selectedRequest?.id === req.id ? 'is-selected' : ''}`}
                      onClick={() => setSelectedRequest(req)}
                    >
                      <td><span className="font-mono text-xs font-bold text-sky-400">{req.method}</span></td>
                      <td>
                        <span className={`font-mono text-xs ${req.status >= 400 ? 'text-crimson-400' : 'text-emerald-400'}`}>
                          {req.status}
                        </span>
                      </td>
                      <td>
                        <div className="font-mono text-xs text-slate-200 truncate max-w-xs" title={req.url}>
                          {req.domain}
                        </div>
                      </td>
                      <td><span className="console-mini-tag">{req.type}</span></td>
                      <td className="font-mono text-xs text-slate-400">{req.durationMs}ms</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Selected Request Detail Panel with Redacted Data */}
            {selectedRequest && (
              <div className="console-network-detail-panel">
                <h4 className="font-bold text-sm text-slate-200 mb-3">Request Inspection &amp; Redaction</h4>
                <div className="console-key-val-table mb-4">
                  <div className="console-kv-row"><span className="kv-key">Full URL:</span><span className="kv-val font-mono text-xs break-all">{selectedRequest.url}</span></div>
                  <div className="console-kv-row"><span className="kv-key">Third Party:</span><span className="kv-val">{selectedRequest.isThirdParty ? 'YES' : 'NO'}</span></div>
                  <div className="console-kv-row"><span className="kv-key">Suspicious:</span><span className="kv-val text-crimson-400 font-bold">{selectedRequest.isSuspicious ? 'FLAGGED' : 'CLEAN'}</span></div>
                </div>

                {selectedRequest.requestBody && (
                  <div className="console-redacted-box">
                    <span className="console-redacted-label">PAYLOAD (REDACTED SENSITIVE FIELDS):</span>
                    <pre className="console-code-snippet font-mono text-xs">
                      {redactSensitiveText(selectedRequest.requestBody)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'SCRIPTS' && (
          <div className="console-scripts-list">
            {session.scripts.map((scr) => (
              <div key={scr.id} className="console-script-card">
                <div className="script-header">
                  <FileCode size={15} className="text-amber-400" />
                  <span className="font-mono text-xs text-slate-200">{scr.src}</span>
                  {scr.isObfuscated && <span className="console-mini-tag text-crimson-400 bg-crimson-500/10">OBFUSCATED</span>}
                  {scr.evalDetected && <span className="console-mini-tag text-amber-400 bg-amber-500/10">EVAL DETECTED</span>}
                </div>
                <div className="script-body mt-2">
                  <span className="text-xs text-slate-400">Hooked APIs:</span>
                  <div className="console-tags-row mt-1">
                    {scr.functionsHooked.map((f) => (
                      <span key={f} className="console-mini-tag font-mono">{f}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'FORMS' && (
          <div className="console-forms-list">
            {session.forms.map((f) => (
              <div key={f.id} className="console-form-card">
                <div className="form-header">
                  <span className="font-bold text-sm text-slate-200">{f.fieldName} ({f.fieldType})</span>
                  {f.isThirdPartyForm && <span className="console-mini-tag text-crimson-400 bg-crimson-500/10">THIRD PARTY FORM</span>}
                </div>
                <div className="console-key-val-table mt-2">
                  <div className="console-kv-row"><span className="kv-key">Action URL:</span><span className="kv-val font-mono text-xs">{f.formAction}</span></div>
                  <div className="console-kv-row"><span className="kv-key">Redacted Preview:</span><span className="kv-val font-mono text-xs text-emerald-400">{redactSensitiveText(f.redactedValuePreview)}</span></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'FLAGS' && (
          <div className="console-flags-full-list">
            {session.behaviorFlags.map((flag) => (
              <div key={flag.id} className="console-flag-full-row">
                <span className="flag-time font-mono">{formatTimestamp(flag.timestamp)}</span>
                <span className="flag-name font-bold text-slate-200">{flag.title}</span>
                <span className="flag-desc text-slate-300">{flag.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
