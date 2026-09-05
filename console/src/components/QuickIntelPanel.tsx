import React from 'react';
import type { FeedEvent, HealthResponse } from '../types';

interface QuickIntelPanelProps {
  selectedEvent: FeedEvent | null;
  events: FeedEvent[];
  health: HealthResponse | null;
  backendConnected: boolean;
  extensionConnected: boolean;
  onSelectEvent?: (event: FeedEvent) => void;
}

export const QuickIntelPanel: React.FC<QuickIntelPanelProps> = ({
  selectedEvent,
  events,
  health,
  backendConnected,
  extensionConnected: _extensionConnected,
}) => {
  // Session Stats calculations
  const totalObserved = events.length;
  const safeCount = events.filter((e) => e.verdict === 'SAFE').length;
  const suspiciousCount = events.filter((e) => e.verdict === 'SUSPICIOUS').length;
  const highRiskCount = events.filter((e) => e.verdict === 'HIGH RISK').length;

  // Payment Activity calculations
  const paymentPagesCount = events.filter((e) => e.analysis?.paymentDetected).length;
  const externalFormsCount = events.filter((e) => e.analysis?.externalForm).length;
  const paymentIframesCount = events.filter((e) => e.analysis?.externalIframe).length;

  const safePercent = totalObserved > 0 ? Math.round((safeCount / totalObserved) * 100) : 0;
  const suspPercent = totalObserved > 0 ? Math.round((suspiciousCount / totalObserved) * 100) : 0;
  const riskPercent = totalObserved > 0 ? Math.round((highRiskCount / totalObserved) * 100) : 0;

  const targetScore = selectedEvent
    ? selectedEvent.riskScore > 1
      ? Math.round(selectedEvent.riskScore)
      : Math.round(selectedEvent.riskScore * 100)
    : 0;

  return (
    <aside className="quick-intel-panel">
      {/* Panel Header */}
      <div className="intel-header">
        <div className="flex items-center gap-2">
          <div className="intel-pulse-dot" />
          <span className="intel-title font-mono">SECURITY INTELLIGENCE</span>
        </div>
        <span className="intel-badge font-mono">SOC-TELEMETRY</span>
      </div>

      <div className="intel-body">
        {/* TARGET RISK SECTION */}
        <div className="intel-card">
          <div className="intel-card-header">
            <span className="intel-card-title">ACTIVE TARGET RISK</span>
            {selectedEvent ? (
              <span className="text-emerald-400 font-mono text-xs">INSPECTING</span>
            ) : (
              <span className="text-muted font-mono text-xs">SESSION AVG</span>
            )}
          </div>

          {selectedEvent ? (
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="intel-stat-num font-mono">
                  {targetScore}
                  <span className="intel-stat-denom">/100</span>
                </span>
                <span className={`soc-sev-pill ${selectedEvent.verdict === 'HIGH RISK' ? 'high' : selectedEvent.verdict === 'SUSPICIOUS' ? 'medium' : 'low'}`}>
                  {selectedEvent.verdict}
                </span>
              </div>
              <div className="intel-progress-bar">
                <div
                  className={`intel-progress-fill ${
                    selectedEvent.verdict === 'HIGH RISK'
                      ? 'bg-danger'
                      : selectedEvent.verdict === 'SUSPICIOUS'
                      ? 'bg-suspicious'
                      : 'bg-safe'
                  }`}
                  style={{ width: `${targetScore}%` }}
                />
              </div>
              <div className="intel-target-host font-mono text-xs truncate">
                Host: <span className="text-primary">{selectedEvent.hostname}</span>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="intel-stat-num font-mono">
                  {totalObserved > 0
                    ? Math.round(events.reduce((acc, e) => acc + (e.riskScore > 1 ? e.riskScore : e.riskScore * 100), 0) / totalObserved)
                    : 0}
                  <span className="intel-stat-denom">/100</span>
                </span>
                <span className="intel-events-pill font-mono">{totalObserved} EVENTS</span>
              </div>
              <div className="text-xs text-muted">
                Select an event on the left to inspect target risk telemetry.
              </div>
            </div>
          )}
        </div>

        {/* SESSION METRICS */}
        <div className="intel-card">
          <div className="intel-card-header">
            <span className="intel-card-title">SESSION SUMMARY</span>
            <span className="text-xs font-mono text-muted">{totalObserved} Total</span>
          </div>

          <div className="intel-kpi-grid">
            <div className="intel-kpi-card border-safe">
              <div className="kpi-label text-emerald-400">SAFE</div>
              <div className="kpi-val font-mono">{safeCount}</div>
              <div className="kpi-pct font-mono">{safePercent}%</div>
            </div>
            <div className="intel-kpi-card border-suspicious">
              <div className="kpi-label text-amber-400">SUSP</div>
              <div className="kpi-val font-mono">{suspiciousCount}</div>
              <div className="kpi-pct font-mono">{suspPercent}%</div>
            </div>
            <div className="intel-kpi-card border-danger">
              <div className="kpi-label text-red-400">RISK</div>
              <div className="kpi-val font-mono">{highRiskCount}</div>
              <div className="kpi-pct font-mono">{riskPercent}%</div>
            </div>
          </div>

          {/* Risk distribution progress bar */}
          <div className="threat-spectrum-bar mt-2">
            <div className="spectrum-segment safe" style={{ width: `${safePercent}%` }} />
            <div className="spectrum-segment suspicious" style={{ width: `${suspPercent}%` }} />
            <div className="spectrum-segment danger" style={{ width: `${riskPercent}%` }} />
          </div>
        </div>

        {/* PAYMENT ACTIVITY */}
        <div className="intel-card">
          <div className="intel-card-header">
            <span className="intel-card-title">PAYMENT ACTIVITY</span>
            <span className="intel-pulse-dot" />
          </div>

          <div className="intel-activity-list">
            <div className="intel-activity-row">
              <span className="activity-label">Payment pages detected</span>
              <span className="activity-val font-mono text-emerald-400">{paymentPagesCount}</span>
            </div>
            <div className="intel-activity-row">
              <span className="activity-label">External payment forms</span>
              <span className={`activity-val font-mono ${externalFormsCount > 0 ? 'text-amber-400' : 'text-muted'}`}>
                {externalFormsCount}
              </span>
            </div>
            <div className="intel-activity-row">
              <span className="activity-label">Payment iframes</span>
              <span className={`activity-val font-mono ${paymentIframesCount > 0 ? 'text-red-400' : 'text-muted'}`}>
                {paymentIframesCount}
              </span>
            </div>
          </div>
        </div>

        {/* MODEL STATUS MATRIX */}
        <div className="intel-card">
          <div className="intel-card-header">
            <span className="intel-card-title">AI PIPELINE HEALTH</span>
            <span className="text-emerald-400 font-mono text-xs font-bold">4 / 4 READY</span>
          </div>

          <div className="intel-models-list font-mono">
            <div className="intel-model-item">
              <div className="flex items-center gap-2">
                <span className="status-dot online" />
                <span className="model-name-text">URL SVM</span>
              </div>
              <span className="model-status-text text-emerald-400">
                {backendConnected && health?.modelsLoaded ? 'ONLINE' : 'STANDBY'}
              </span>
            </div>

            <div className="intel-model-item">
              <div className="flex items-center gap-2">
                <span className="status-dot online" />
                <span className="model-name-text">HTML XGB</span>
              </div>
              <span className="model-status-text text-emerald-400">
                {backendConnected && health?.modelsLoaded ? 'ONLINE' : 'STANDBY'}
              </span>
            </div>

            <div className="intel-model-item">
              <div className="flex items-center gap-2">
                <span className="status-dot online" />
                <span className="model-name-text">PAYMENT XGB</span>
              </div>
              <span className="model-status-text text-emerald-400">
                {backendConnected && health?.modelsLoaded ? 'ONLINE' : 'STANDBY'}
              </span>
            </div>

            <div className="intel-model-item">
              <div className="flex items-center gap-2">
                <span className="status-dot online" />
                <span className="model-name-text">RISK FUSION</span>
              </div>
              <span className="model-status-text text-emerald-400">
                {backendConnected && health?.modelsLoaded ? 'ONLINE' : 'STANDBY'}
              </span>
            </div>
          </div>
        </div>

        {/* SYSTEM STATUS */}
        <div className="intel-system-box font-mono">
          <div className="flex items-center justify-between text-muted mb-1 text-xs">
            <span>ENGINE VERSION</span>
            <span className="text-primary">{health?.version || '2.0.0-soc'}</span>
          </div>
          <div className="flex items-center justify-between text-muted text-xs">
            <span>TRANSPORT</span>
            <span className="text-emerald-400">SSE STREAM (REALTIME)</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
