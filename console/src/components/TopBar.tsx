import React, { useState, useEffect, useRef } from 'react';
import { Clock, LayoutDashboard, Globe, Zap, Loader2, X } from 'lucide-react';
import { VerdictLogo } from './VerdictLogo';
import { ModelDetailModal } from './ModelDetailModal';
import type { HealthResponse } from '../types';

interface TopBarProps {
  health: HealthResponse | null;
  isHealthy: boolean;
  isOverviewActive: boolean;
  onGoToDashboard: () => void;
  onManualIngest: (url: string) => void;
  isIngesting: boolean;
}

const DETECTED_MODELS = [
  { id: 'url_svm', name: 'URL SVM', file: 'url_phishing_svm.joblib', desc: 'Linear SVM (TF-IDF)' },
  { id: 'html_xgboost', name: 'HTML XGB v2', file: 'html_phishing_xgboost_v2.joblib', desc: '56 DOM Features' },
  { id: 'payment_xgboost', name: 'PAYMENT XGB', file: 'payment_risk_xgboost.joblib', desc: '35 Payment Vectors' },
  { id: 'risk_engine', name: 'RISK FUSION', file: 'risk_engine_fusion.joblib', desc: 'Calibrated Risk Engine' },
];

export const TopBar: React.FC<TopBarProps> = ({
  health,
  isHealthy,
  isOverviewActive,
  onGoToDashboard,
  onManualIngest,
  isIngesting,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [inputUrl, setInputUrl] = useState<string>('');
  const [activeModelModal, setActiveModelModal] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toTimeString().split(' ')[0]);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Global shortcut (Ctrl+K or /) to focus Ingest URL bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 'k') || (e.key === '/' && document.activeElement?.tagName !== 'INPUT')) {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleIngestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputUrl.trim() && !isIngesting) {
      onManualIngest(inputUrl.trim());
      setInputUrl('');
    }
  };

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          {/* Brand Badge (Clickable to return to Overview Dashboard) */}
          <button
            className="brand-badge clickable-brand"
            onClick={onGoToDashboard}
            title="Return to Operations Overview"
          >
            <VerdictLogo size={24} showGlow={true} />
            <div className="brand-text">
              <span className="brand-title">VERDICT</span>
              <span className="brand-sub">SECURITY OPERATIONS</span>
            </div>
          </button>

          <div className="topbar-divider" />

          {/* Dashboard Navigation Capsule */}
          <button
            className={`nav-dashboard-capsule font-mono ${isOverviewActive ? 'active' : ''}`}
            onClick={onGoToDashboard}
            title="Go to Default Operations Dashboard"
          >
            <LayoutDashboard size={13} className={isOverviewActive ? 'text-emerald-400' : 'text-slate-400'} />
            <span>DASHBOARD</span>
          </button>

          <div className="topbar-divider" />

          {/* Model Capsules for all detected models in models folder */}
          <div className="topbar-models-capsules">
            {DETECTED_MODELS.map((m) => {
              const isLoaded = isHealthy && (health?.modelsLoaded ?? false);
              return (
                <button
                  key={m.id}
                  className="model-capsule font-mono"
                  onClick={() => setActiveModelModal(m.id)}
                  title={`Click to view details for ${m.name} (${m.file})`}
                >
                  <span className={`status-dot ${isLoaded ? 'online' : 'error'}`} />
                  <span className="model-capsule-name">{m.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="topbar-right">
          {/* Sleek Permanent Ingest Command Bar */}
          <form onSubmit={handleIngestSubmit} className="soc-ingest-bar">
            <Globe size={13} className="soc-ingest-icon" />
            <input
              ref={inputRef}
              type="text"
              className="soc-ingest-input"
              placeholder="Ingest target URL (e.g. https://...)"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              disabled={isIngesting}
            />
            {inputUrl && (
              <button
                type="button"
                className="soc-ingest-clear"
                onClick={() => setInputUrl('')}
                title="Clear input"
              >
                <X size={12} />
              </button>
            )}
            <button
              type="submit"
              className="soc-ingest-btn"
              disabled={isIngesting || !inputUrl.trim()}
              title="Scan and ingest target URL into live SOC stream"
            >
              {isIngesting ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  <span>Scanning</span>
                </>
              ) : (
                <>
                  <Zap size={12} />
                  <span>Scan</span>
                </>
              )}
            </button>
          </form>

          <div className="topbar-divider" />

          {/* Live Digital Clock */}
          <div className="clock-display font-mono">
            <Clock size={13} className="text-emerald-400" />
            <span>{timeStr || '00:00:00'}</span>
          </div>
        </div>
      </header>

      {/* Model Details Modal */}
      {activeModelModal && (
        <ModelDetailModal
          modelId={activeModelModal}
          health={health}
          isHealthy={isHealthy}
          onClose={() => setActiveModelModal(null)}
        />
      )}
    </>
  );
};
