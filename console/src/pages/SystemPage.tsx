import React from 'react';
import { useConsole } from '../context/ConsoleContext.tsx';
import {
  Cpu,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { formatDuration, formatTimestamp } from '../utils/formatters.ts';

export const SystemPage: React.FC = () => {
  const { systemHealth, refreshData, isAnalyzing } = useConsole();

  if (!systemHealth) {
    return (
      <div className="console-page-container">
        <div className="console-card text-center p-8">
          <p className="text-slate-400">Loading system infrastructure telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="console-page-container">
      <div className="console-page-header">
        <div>
          <h1 className="console-page-title">System Infrastructure &amp; Worker Cluster Health</h1>
          <p className="console-page-desc">
            Operational status of API gateways, decision engine clusters, sandbox runner nodes, latency distributions, and logs.
          </p>
        </div>
        <button
          type="button"
          className="console-header-btn"
          onClick={() => refreshData()}
          disabled={isAnalyzing}
        >
          <RefreshCw size={13} className={isAnalyzing ? 'animate-spin' : ''} />
          <span>Sync Status</span>
        </button>
      </div>

      {/* Services Health Grid */}
      <div className="console-services-health-grid">
        {systemHealth.services.map((svc) => (
          <div key={svc.service} className="console-service-health-card">
            <div className="svc-header">
              <span className="svc-name font-bold text-xs text-slate-200">{svc.service}</span>
              <span className="console-mini-tag text-emerald-400 bg-emerald-500/10">
                {svc.status}
              </span>
            </div>
            <div className="svc-stats font-mono text-xs text-slate-400 mt-2">
              <div>Latency: <span className="text-slate-200">{svc.latencyMs}ms</span> (P99: {svc.p99LatencyMs}ms)</div>
              <div>Error Rate: <span className="text-emerald-400">{svc.errorRatePercent}%</span></div>
            </div>
          </div>
        ))}
      </div>

      {/* Worker Nodes Pool */}
      <div className="console-card">
        <div className="console-card-header">
          <div className="card-header-title-group">
            <Cpu size={17} className="text-sky-400" />
            <h3 className="card-title">Sandbox &amp; Inference Worker Nodes Pool</h3>
          </div>
        </div>

        <div className="console-table-wrapper">
          <table className="console-data-table">
            <thead>
              <tr>
                <th>Node ID</th>
                <th>Worker Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Active Sessions</th>
                <th>CPU Load</th>
                <th>Memory</th>
                <th>Uptime</th>
              </tr>
            </thead>
            <tbody>
              {systemHealth.workers.map((w) => (
                <tr key={w.id} className="console-table-row">
                  <td className="font-mono text-xs text-sky-400">{w.id}</td>
                  <td className="font-semibold text-slate-200 text-xs">{w.name}</td>
                  <td><span className="console-mini-tag font-mono">{w.type}</span></td>
                  <td><span className="console-mini-tag text-emerald-400 bg-emerald-500/10">{w.status}</span></td>
                  <td className="font-mono text-xs">{w.activeSessions} / {w.maxCapacity}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="console-mini-bar-track w-16">
                        <div
                          className={`console-mini-bar-fill ${w.cpuPercent > 75 ? 'bg-crimson-500' : 'bg-emerald-500'}`}
                          style={{ width: `${w.cpuPercent}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs">{w.cpuPercent}%</span>
                    </div>
                  </td>
                  <td className="font-mono text-xs text-slate-300">{w.memoryMb} MB</td>
                  <td className="font-mono text-xs text-slate-400">{formatDuration(w.uptimeSeconds * 1000)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operational Telemetry Logs */}
      <div className="console-card">
        <div className="console-card-header">
          <div className="card-header-title-group">
            <Terminal size={17} className="text-slate-400" />
            <h3 className="card-title">Cluster Telemetry &amp; System Logs</h3>
          </div>
        </div>

        <div className="console-logs-list">
          {systemHealth.recentLogs.map((log) => (
            <div key={log.id} className="console-log-row">
              <span className="log-time font-mono text-slate-500 text-xs">{formatTimestamp(log.timestamp)}</span>
              <span className={`console-mini-tag text-[10px] ${log.level === 'WARN' ? 'text-amber-400' : log.level === 'ERROR' ? 'text-crimson-400' : 'text-sky-400'}`}>
                {log.level}
              </span>
              <span className="log-source font-mono text-xs text-slate-400">[{log.source}]</span>
              <span className="log-msg text-xs text-slate-200">{log.message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
