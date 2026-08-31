import React from 'react';
import { RefreshCw, Play, ShieldAlert, Activity } from 'lucide-react';
import { useConsole } from '../../context/ConsoleContext.tsx';

export const Header: React.FC = () => {
  const { isAnalyzing, refreshData, selectedInvestigation, startNewInvestigation } = useConsole();

  const handleQuickTrigger = () => {
    startNewInvestigation('https://cheap-nike-airmax-outlet.xyz');
  };

  return (
    <header className="console-top-header">
      <div className="console-header-left">
        <div className="console-breadcrumb">
          <span className="console-breadcrumb-root">Verdict SOC</span>
          <span className="console-breadcrumb-sep">/</span>
          {selectedInvestigation ? (
            <span className="console-breadcrumb-target font-mono">{selectedInvestigation.hostname}</span>
          ) : (
            <span className="console-breadcrumb-idle">Telemetry Stream</span>
          )}
        </div>
      </div>

      <div className="console-header-right">
        {selectedInvestigation && selectedInvestigation.verdict && (
          <div className={`console-header-verdict-tag status-${selectedInvestigation.verdict.toLowerCase()}`}>
            <ShieldAlert size={12} />
            <span>{selectedInvestigation.verdict} ({selectedInvestigation.threatScore}/100)</span>
          </div>
        )}

        <div className="console-worker-indicator">
          <Activity size={12} className="text-emerald-400" />
          <span>PIPELINE ONLINE</span>
        </div>

        <button
          type="button"
          className="console-header-btn"
          onClick={handleQuickTrigger}
          disabled={isAnalyzing}
          title="Run test investigation on sample target"
        >
          <Play size={12} fill="currentColor" />
          <span>Test Pipeline</span>
        </button>

        <button
          type="button"
          className="console-header-btn"
          onClick={() => refreshData()}
          disabled={isAnalyzing}
          title="Sync cluster telemetry"
        >
          <RefreshCw size={12} className={isAnalyzing ? 'animate-spin' : ''} />
          <span>Sync</span>
        </button>
      </div>
    </header>
  );
};

