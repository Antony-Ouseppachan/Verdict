import React, { useState } from 'react';
import { Search, ArrowRight, Play, Globe } from 'lucide-react';
import { useConsole } from '../context/ConsoleContext.tsx';
import { StatusBadge } from '../components/common/StatusBadge.tsx';
import { formatDuration, formatTimestamp } from '../utils/formatters.ts';

export const InvestigationsPage: React.FC = () => {
  const { investigations, setSelectedInvestigationId, setCurrentPage, startNewInvestigation, isAnalyzing } = useConsole();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [newUrlInput, setNewUrlInput] = useState<string>('');

  const filtered = investigations.filter((inv) => {
    const matchesSearch =
      inv.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && inv.verdict === statusFilter;
  });

  const handleSelectInvestigation = (id: string) => {
    setSelectedInvestigationId(id);
    setCurrentPage('INVESTIGATION_DETAIL');
  };

  const handleManualScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrlInput.trim()) {
      const inv = await startNewInvestigation(newUrlInput.trim());
      setNewUrlInput('');
      setSelectedInvestigationId(inv.id);
      setCurrentPage('INVESTIGATION_DETAIL');
    }
  };

  return (
    <div className="console-page-container">
      <div className="console-page-header">
        <div>
          <h1 className="console-page-title">Investigations Directory</h1>
          <p className="console-page-desc">
            Complete registry of all URLs received from the browser extension and autonomous inspection workflows.
          </p>
        </div>
      </div>

      {/* Manual Dispatch Bar */}
      <div className="console-card console-dispatch-card">
        <form onSubmit={handleManualScan} className="console-dispatch-form">
          <div className="console-input-wrapper flex-1">
            <Globe size={16} className="console-input-icon" />
            <input
              type="text"
              className="console-url-input"
              placeholder="Enter target URL to dispatch new investigation (e.g. https://cheap-designer-outlet.xyz)..."
              value={newUrlInput}
              onChange={(e) => setNewUrlInput(e.target.value)}
              disabled={isAnalyzing}
            />
          </div>
          <button
            type="submit"
            className="console-analyze-btn"
            disabled={isAnalyzing || !newUrlInput.trim()}
          >
            <Play size={14} fill="currentColor" />
            <span>{isAnalyzing ? 'Analyzing...' : 'Dispatch Investigation'}</span>
          </button>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="console-filters-bar">
        <div className="console-search-box">
          <Search size={15} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search by domain, request ID, or threat tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="console-filter-tabs">
          <button
            type="button"
            className={`console-filter-tab ${statusFilter === 'ALL' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('ALL')}
          >
            All ({investigations.length})
          </button>
          <button
            type="button"
            className={`console-filter-tab ${statusFilter === 'DANGER' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('DANGER')}
          >
            Danger
          </button>
          <button
            type="button"
            className={`console-filter-tab ${statusFilter === 'CAUTION' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('CAUTION')}
          >
            Caution
          </button>
          <button
            type="button"
            className={`console-filter-tab ${statusFilter === 'SAFE' ? 'is-active' : ''}`}
            onClick={() => setStatusFilter('SAFE')}
          >
            Safe
          </button>
        </div>
      </div>

      {/* Investigations Table */}
      <div className="console-card">
        <div className="console-table-wrapper">
          <table className="console-data-table">
            <thead>
              <tr>
                <th>Verdict / Status</th>
                <th>Request ID</th>
                <th>Target Domain</th>
                <th>Threat Score</th>
                <th>Current Pipeline Stage</th>
                <th>Duration</th>
                <th>Ingested At</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="console-empty-cell">
                    No investigations match the selected filter.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
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
                    <td className="font-mono text-xs text-sky-400">{inv.id}</td>
                    <td>
                      <div className="font-semibold text-slate-200 font-mono" title={inv.url}>
                        {inv.hostname}
                      </div>
                      <div className="console-tags-row">
                        {inv.tags.map((tag) => (
                          <span key={tag} className="console-mini-tag">{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      {inv.threatScore !== undefined ? (
                        <span className={`font-mono font-bold ${inv.threatScore >= 70 ? 'text-crimson-400' : inv.threatScore >= 35 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {inv.threatScore}/100
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      <span className="console-stage-pill font-mono">{inv.currentStage}</span>
                    </td>
                    <td className="font-mono text-slate-300">
                      {formatDuration(inv.durationMs)}
                    </td>
                    <td className="font-mono text-slate-400 text-xs">
                      {formatTimestamp(inv.createdAt)}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="console-reinspect-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectInvestigation(inv.id);
                        }}
                      >
                        <span>Deep Dive</span>
                        <ArrowRight size={12} />
                      </button>
                    </td>
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
