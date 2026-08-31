import React, { useState } from 'react';
import {
  Play,
  Search,
  Globe,
  LayoutDashboard,
  Server,
  Zap,
} from 'lucide-react';
import { useConsole } from '../../context/ConsoleContext.tsx';
import { VerdictLogo } from '../VerdictLogo.tsx';
import { formatTimestamp } from '../../utils/formatters.ts';

export const Sidebar: React.FC = () => {
  const {
    currentPage,
    setCurrentPage,
    investigations,
    selectedInvestigationId,
    setSelectedInvestigationId,
    startNewInvestigation,
    isAnalyzing,
  } = useConsole();

  const [urlInput, setUrlInput] = useState<string>('');
  const [filter, setFilter] = useState<'ALL' | 'THREATS' | 'SAFE'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleManualIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      const inv = await startNewInvestigation(urlInput.trim());
      setUrlInput('');
      setSelectedInvestigationId(inv.id);
      setCurrentPage('INVESTIGATION_DETAIL');
    }
  };

  const handleQuickPreset = async (target: string) => {
    const inv = await startNewInvestigation(target);
    setSelectedInvestigationId(inv.id);
    setCurrentPage('INVESTIGATION_DETAIL');
  };

  const filteredInvs = investigations.filter((inv) => {
    const matchesSearch =
      inv.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.url.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'THREATS') return inv.verdict === 'DANGER' || inv.verdict === 'CAUTION';
    if (filter === 'SAFE') return inv.verdict === 'SAFE';
    return true;
  });

  return (
    <aside className="console-sidebar">
      {/* Brand Header */}
      <div className="console-sidebar-brand">
        <VerdictLogo size={24} />
        <div className="console-brand-text">
          <span className="console-brand-name">VERDICT</span>
          <span className="console-brand-sub">OPERATOR CONSOLE</span>
        </div>
      </div>

      {/* Active Traffic Feed Header */}
      <div className="console-stream-status-pill">
        <span className="console-status-live-dot" />
        <div className="console-stream-meta">
          <span className="console-stream-text">TRAFFIC FEED</span>
          <span className="console-stream-sub">Monitored Domains</span>
        </div>
        <span className="console-stream-count">{investigations.length}</span>
      </div>

      {/* Manual Target Ingest Bar */}
      <div className="console-sidebar-ingest">
        <form onSubmit={handleManualIngest} className="console-sidebar-ingest-form">
          <div className="console-sidebar-input-wrapper">
            <Globe size={13} className="text-slate-400" />
            <input
              type="text"
              className="console-sidebar-input"
              placeholder="Ingest target URL..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>
          <button
            type="submit"
            className="console-sidebar-submit-btn"
            disabled={isAnalyzing || !urlInput.trim()}
            title="Dispatch autonomous analysis"
          >
            <Play size={11} fill="currentColor" />
          </button>
        </form>

        {/* Quick Test Presets if no investigations */}
        {investigations.length === 0 && (
          <div className="console-quick-presets">
            <span className="presets-label">Quick Test Targets:</span>
            <div className="presets-row">
              <button
                type="button"
                className="preset-btn danger-preset"
                onClick={() => handleQuickPreset('https://cheap-nike-outlet.xyz')}
                disabled={isAnalyzing}
              >
                Fake Shop (.xyz)
              </button>
              <button
                type="button"
                className="preset-btn safe-preset"
                onClick={() => handleQuickPreset('https://apple.com')}
                disabled={isAnalyzing}
              >
                Safe Brand
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Search & Filter Strip */}
      <div className="console-sidebar-filter-section">
        <div className="console-sidebar-search">
          <Search size={12} className="text-slate-400" />
          <input
            type="text"
            placeholder="Filter stream..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="console-sidebar-filter-tabs">
          <button
            type="button"
            className={`filter-pill ${filter === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setFilter('ALL')}
          >
            All ({investigations.length})
          </button>
          <button
            type="button"
            className={`filter-pill threat-pill ${filter === 'THREATS' ? 'is-active' : ''}`}
            onClick={() => setFilter('THREATS')}
          >
            Threats ({investigations.filter((i) => i.verdict === 'DANGER' || i.verdict === 'CAUTION').length})
          </button>
          <button
            type="button"
            className={`filter-pill safe-pill ${filter === 'SAFE' ? 'is-active' : ''}`}
            onClick={() => setFilter('SAFE')}
          >
            Safe ({investigations.filter((i) => i.verdict === 'SAFE').length})
          </button>
        </div>
      </div>

      {/* Incoming URLs Live Feed */}
      <div className="console-incoming-feed">
        <div className="feed-header-label">INCOMING TARGET FEED ({filteredInvs.length})</div>

        {filteredInvs.length === 0 ? (
          <div className="console-feed-empty">
            <Zap size={18} className="text-slate-600 mb-1" />
            <p className="empty-title">Awaiting Incoming Traffic</p>
            <p className="empty-sub">
              Visit any website in your browser with the Verdict Extension or ingest a URL above.
            </p>
          </div>
        ) : (
          <div className="console-feed-list">
            {filteredInvs.map((inv) => {
              const isSelected = selectedInvestigationId === inv.id;
              const isRunning = inv.status === 'ANALYZING';
              const isDanger = inv.verdict === 'DANGER';
              const isCaution = inv.verdict === 'CAUTION';
              const isLocal = inv.url.includes('localhost') || inv.url.includes('127.0.0.1');
              const isHttps = inv.url.startsWith('https://');

              return (
                <div
                  key={inv.id}
                  className={`console-feed-item ${isSelected ? 'is-selected' : ''} ${isDanger ? 'border-danger' : isCaution ? 'border-caution' : ''}`}
                  onClick={() => {
                    setSelectedInvestigationId(inv.id);
                    setCurrentPage('INVESTIGATION_DETAIL');
                  }}
                >
                  <div className="feed-item-top">
                    <span className={`protocol-badge ${isLocal ? 'proto-local' : isHttps ? 'proto-https' : 'proto-http'}`}>
                      {isLocal ? 'LOCAL' : isHttps ? 'HTTPS' : 'HTTP'}
                    </span>
                    <span className="feed-item-time font-mono">{formatTimestamp(inv.createdAt)}</span>
                    <span className="feed-item-source font-mono">{inv.initiator === 'EXTENSION' ? 'EXT' : 'MAN'}</span>
                  </div>

                  <div className="feed-item-hostname font-mono" title={inv.url}>
                    {inv.hostname}
                  </div>

                  <div className="feed-item-bottom">
                    {isRunning ? (
                      <div className="feed-item-running">
                        <span className="pulse-dot" />
                        <span className="running-stage font-mono">{inv.currentStage}</span>
                      </div>
                    ) : inv.verdict ? (
                      <div className="feed-item-verdict-row">
                        <span className={`feed-verdict-badge status-${inv.verdict.toLowerCase()}`}>
                          {inv.verdict}
                        </span>
                        {inv.threatScore !== undefined && (
                          <span className={`feed-threat-score font-mono ${isDanger ? 'text-crimson-400' : isCaution ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {inv.threatScore}/100
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="feed-status-queued font-mono">QUEUED</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Global Module Navigation Footer */}
      <div className="console-sidebar-nav-footer">
        <button
          type="button"
          className={`sidebar-nav-tab ${currentPage === 'OVERVIEW' ? 'is-active' : ''}`}
          onClick={() => setCurrentPage('OVERVIEW')}
        >
          <LayoutDashboard size={14} />
          <span>Overview</span>
        </button>
        <button
          type="button"
          className={`sidebar-nav-tab ${currentPage === 'SYSTEM' ? 'is-active' : ''}`}
          onClick={() => setCurrentPage('SYSTEM')}
        >
          <Server size={14} />
          <span>System</span>
        </button>
      </div>
    </aside>
  );
};
