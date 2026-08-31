import React, { useState } from 'react';
import {
  Activity,
  ShieldAlert,
  AlertTriangle,
  Clock,
  ArrowRight,
  Cpu,
  Layers,
  Play,
  Globe,
  Search,
} from 'lucide-react';
import { useConsole } from '../context/ConsoleContext.tsx';
import { TelemetryStream } from '../components/common/TelemetryStream.tsx';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { formatDuration } from '../utils/formatters.ts';

export const OverviewPage: React.FC = () => {
  const {
    investigations,
    systemHealth,
    events,
    setSelectedInvestigationId,
    setCurrentPage,
    startNewInvestigation,
    isAnalyzing,
  } = useConsole();

  const [inputUrl, setInputUrl] = useState<string>('');

  const handleSelectInvestigation = (id: string) => {
    setSelectedInvestigationId(id);
    setCurrentPage('INVESTIGATION_DETAIL');
  };

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim()) {
      const inv = await startNewInvestigation(inputUrl.trim());
      setInputUrl('');
      setSelectedInvestigationId(inv.id);
      setCurrentPage('INVESTIGATION_DETAIL');
    }
  };

  const requests = systemHealth?.requestsToday || { total: 0, safe: 0, caution: 0, danger: 0 };
  const queue = systemHealth?.queue || { pendingCount: 0, processingCount: 0, completedToday: 0, avgProcessMs: 0, throughputPerMinute: 0 };

  return (
    <div className="console-page-container">
      <div className="console-page-header">
        <div>
          <h1 className="console-page-title">Security Operations Dashboard</h1>
          <p className="console-page-desc">
            Real-time domain inspection, sandbox telemetry, decision distribution, and pipeline health.
          </p>
        </div>
      </div>

      {/* Live Target Dispatch Bar */}
      <div className="console-card console-dispatch-card">
        <form onSubmit={handleLaunch} className="console-dispatch-form">
          <div className="console-input-wrapper flex-1">
            <Globe size={16} className="console-input-icon" />
            <input
              type="text"
              className="console-url-input"
              placeholder="Enter target URL to inspect (e.g. https://target-store.com)..."
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>
          <button
            type="submit"
            className="console-analyze-btn"
            disabled={isAnalyzing || !inputUrl.trim()}
          >
            <Play size={14} fill="currentColor" />
            <span>{isAnalyzing ? 'Analyzing Target...' : 'Inspect URL'}</span>
          </button>
        </form>
      </div>

      {/* KPI Metrics Strip */}
      <div className="console-kpi-grid">
        <div className="console-kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Requests Ingested</span>
            <Activity size={16} className="text-sky-400" />
          </div>
          <div className="kpi-value">{requests.total.toLocaleString()}</div>
          <div className="kpi-sub">
            <span className="text-emerald-400 font-semibold">{queue.throughputPerMinute} req/min</span> live throughput
          </div>
        </div>

        <div className="console-kpi-card status-danger-glow">
          <div className="kpi-header">
            <span className="kpi-title">Scams &amp; Fake Shops Blocked</span>
            <ShieldAlert size={16} className="text-crimson-400" />
          </div>
          <div className="kpi-value text-crimson-400">{requests.danger}</div>
          <div className="kpi-sub">
            <span className="text-slate-400 font-mono">
              {requests.total > 0 ? `${((requests.danger / requests.total) * 100).toFixed(1)}% of total` : '0% of total'}
            </span>
          </div>
        </div>

        <div className="console-kpi-card status-caution-glow">
          <div className="kpi-header">
            <span className="kpi-title">Suspicious Merchants</span>
            <AlertTriangle size={16} className="text-amber-400" />
          </div>
          <div className="kpi-value text-amber-400">{requests.caution}</div>
          <div className="kpi-sub">
            <span className="text-slate-400 font-mono">
              {requests.total > 0 ? `${((requests.caution / requests.total) * 100).toFixed(1)}% warned` : '0% warned'}
            </span>
          </div>
        </div>

        <div className="console-kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Avg Investigation Latency</span>
            <Clock size={16} className="text-emerald-400" />
          </div>
          <div className="kpi-value">{queue.avgProcessMs > 0 ? formatDuration(queue.avgProcessMs) : '—'}</div>
          <div className="kpi-sub">
            <span className="text-emerald-400 font-mono">Real-time pipeline</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Queue & Live Telemetry Stream */}
      <div className="console-two-col-grid">
        {/* Left Column: Recent Investigations List */}
        <div className="console-card">
          <div className="console-card-header">
            <div className="card-header-title-group">
              <Layers size={17} className="text-sky-400" />
              <h3 className="card-title">Recent Investigations ({investigations.length})</h3>
            </div>
            {investigations.length > 0 && (
              <button
                type="button"
                className="console-link-btn"
                onClick={() => setCurrentPage('INVESTIGATIONS')}
              >
                <span>View Registry</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>

          <div className="console-table-wrapper">
            {investigations.length === 0 ? (
              <div className="console-empty-queue-box">
                <Search size={24} className="text-slate-500 mb-2" />
                <h4 className="text-sm font-bold text-slate-300">No Active Investigations Recorded</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Enter any website URL in the inspector bar above or browse with the Verdict extension to observe threat analysis in real-time.
                </p>
              </div>
            ) : (
              <table className="console-data-table">
                <thead>
                  <tr>
                    <th>Verdict</th>
                    <th>Target Domain</th>
                    <th>Stage</th>
                    <th>Latency</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {investigations.map((inv) => (
                    <tr
                      key={inv.id}
                      className="console-table-row clickable"
                      onClick={() => handleSelectInvestigation(inv.id)}
                    >
                      <td>
                        {inv.verdict ? (
                          <StatusBadge status={inv.verdict} size="sm" />
                        ) : (
                          <StatusBadge status={inv.status} size="sm" />
                        )}
                      </td>
                      <td>
                        <div className="font-semibold text-slate-200 font-mono" title={inv.url}>
                          {inv.hostname}
                        </div>
                        <div className="text-slate-400 text-xs font-mono">{inv.id}</div>
                      </td>
                      <td>
                        <span className="console-stage-pill font-mono">{inv.currentStage}</span>
                      </td>
                      <td className="font-mono text-slate-300">
                        {formatDuration(inv.durationMs)}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="console-reinspect-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectInvestigation(inv.id);
                          }}
                          title={`Inspect forensic details for ${inv.hostname}`}
                        >
                          <span>Inspect</span>
                          <ArrowRight size={11} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right Column: Live Event Stream & Cluster Worker Summary */}
        <div className="console-right-col-stack">
          <TelemetryStream
            events={events}
            onSelectEventInvestigation={(id) => handleSelectInvestigation(id)}
          />

          <div className="console-card">
            <div className="console-card-header">
              <div className="card-header-title-group">
                <Cpu size={16} className="text-slate-400" />
                <h3 className="card-title">Sandbox Worker Nodes</h3>
              </div>
              <button
                type="button"
                className="console-link-btn"
                onClick={() => setCurrentPage('SYSTEM')}
              >
                <span>Cluster View</span>
                <ArrowRight size={13} />
              </button>
            </div>

            <div className="console-workers-mini-list">
              {systemHealth?.workers.map((worker) => (
                <div key={worker.id} className="console-worker-mini-row">
                  <div className="worker-mini-name">
                    <span className="status-dot online" />
                    <span>{worker.name}</span>
                  </div>
                  <div className="worker-mini-stats font-mono">
                    <span>CPU: {worker.cpuPercent}%</span>
                    <span>Load: {worker.activeSessions}/{worker.maxCapacity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
