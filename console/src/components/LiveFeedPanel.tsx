import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, Globe, CreditCard, ArrowUp, Trash2, CheckSquare, Square } from 'lucide-react';
import type { FeedEvent } from '../types';

interface LiveFeedPanelProps {
  events: FeedEvent[];
  selectedEventId: string | null;
  onSelectEvent: (event: FeedEvent) => void;
  onDeleteEvents: (eventIds: string[]) => void;
  hasUnreadNewEvents: boolean;
  onScrollToTop: () => void;
}

type FilterType = 'LIVE' | 'ALL' | 'SAFE' | 'SUSPICIOUS' | 'HIGH RISK' | 'PAYMENT';

export const LiveFeedPanel: React.FC<LiveFeedPanelProps> = ({
  events,
  selectedEventId,
  onSelectEvent,
  onDeleteEvents,
  hasUnreadNewEvents,
  onScrollToTop,
}) => {
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement>(null);

  // Filtered event list
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      // Verdict / Type Filter
      if (filter === 'SAFE' && evt.verdict !== 'SAFE') return false;
      if (filter === 'SUSPICIOUS' && evt.verdict !== 'SUSPICIOUS') return false;
      if (filter === 'HIGH RISK' && evt.verdict !== 'HIGH RISK') return false;
      if (filter === 'PAYMENT' && !evt.analysis?.paymentDetected) return false;

      // Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        return (
          evt.url.toLowerCase().includes(query) ||
          evt.hostname.toLowerCase().includes(query) ||
          evt.verdict.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [events, filter, searchQuery]);

  // Clean up selected IDs that no longer exist
  useEffect(() => {
    setSelectedIds((prev) => {
      const valid = new Set<string>();
      prev.forEach((id) => {
        if (events.some((e) => e.id === id)) {
          valid.add(id);
        }
      });
      return valid;
    });
  }, [events]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!filteredEvents.length || isSelectMode) return;
      const currentIndex = filteredEvents.findIndex((evt) => evt.id === selectedEventId);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < filteredEvents.length - 1 ? currentIndex + 1 : 0;
        onSelectEvent(filteredEvents[nextIndex]);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredEvents.length - 1;
        onSelectEvent(filteredEvents[prevIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredEvents, selectedEventId, onSelectEvent, isSelectMode]);

  const toggleSelectEvent = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredEvents.length) {
      // Deselect all
      setSelectedIds(new Set());
    } else {
      // Select all visible filtered events
      setSelectedIds(new Set(filteredEvents.map((e) => e.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    const confirmed = window.confirm(
      `Are you sure you want to delete ${count} selected event${count > 1 ? 's' : ''} from the feed?`
    );
    if (confirmed) {
      onDeleteEvents(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectMode(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toTimeString().split(' ')[0];
  };

  const getPathOnly = (fullUrl: string) => {
    try {
      const p = new URL(fullUrl).pathname;
      return p === '/' ? '' : p;
    } catch {
      return '';
    }
  };

  const allFilteredSelected = filteredEvents.length > 0 && selectedIds.size === filteredEvents.length;

  return (
    <aside className="feed-panel">
      {/* Header & Controls */}
      <div className="feed-header">
        <div className="feed-title-row">
          <div>
            <h2 className="feed-title">LIVE ACTIVITY</h2>
            <p className="feed-subtitle">Browser event telemetry</p>
          </div>
          <div className="feed-actions">
            <button
              className={`feed-btn-select ${isSelectMode ? 'active' : ''}`}
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                if (isSelectMode) setSelectedIds(new Set());
              }}
              title={isSelectMode ? 'Exit select mode' : 'Select events to delete'}
            >
              <CheckSquare size={12} />
              <span>{isSelectMode ? 'Cancel' : 'Select'}</span>
            </button>
            <span className="event-count-badge font-mono">{filteredEvents.length}</span>
          </div>
        </div>

        {/* Batch Selection Action Bar */}
        {isSelectMode && (
          <div className="feed-selection-toolbar">
            <button className="toolbar-btn-select-all" onClick={handleSelectAll}>
              {allFilteredSelected ? <CheckSquare size={13} className="text-emerald-400" /> : <Square size={13} />}
              <span>{allFilteredSelected ? 'Deselect All' : 'Select All'}</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="selection-count-text font-mono">
                {selectedIds.size} / {filteredEvents.length}
              </span>
              <button
                className="toolbar-btn-delete"
                onClick={handleDeleteSelected}
                disabled={selectedIds.size === 0}
                title="Delete selected events"
              >
                <Trash2 size={12} />
                <span>Delete ({selectedIds.size})</span>
              </button>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="feed-search-wrapper">
          <Search size={14} className="feed-search-icon" />
          <input
            type="text"
            className="feed-search-input"
            placeholder="Search URLs, domains, paths..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="feed-search-clear" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="feed-filters-bar">
          {(['ALL', 'HIGH RISK', 'SUSPICIOUS', 'SAFE', 'PAYMENT'] as FilterType[]).map((tab) => (
            <button
              key={tab}
              className={`filter-tab ${filter === tab ? 'active' : ''} tab-${tab.toLowerCase().replace(' ', '-')}`}
              onClick={() => setFilter(tab)}
            >
              {tab === 'PAYMENT' ? 'PAYMENT' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* New events sticky notification */}
      {hasUnreadNewEvents && (
        <button className="new-events-banner" onClick={onScrollToTop}>
          <ArrowUp size={12} className="animate-bounce" />
          <span>New events incoming</span>
        </button>
      )}

      {/* Events List */}
      <div className="feed-list" ref={listRef}>
        {filteredEvents.length === 0 ? (
          <div className="feed-empty-state">
            <Globe size={28} className="text-muted mb-2" />
            <div className="text-sm font-semibold text-secondary">No Events Matching Filter</div>
            <div className="text-xs text-muted mt-1">
              {events.length === 0
                ? 'Browse websites with Chrome extension or ingest a URL to populate live feed.'
                : 'Try clearing the search query or filter.'}
            </div>
          </div>
        ) : (
          filteredEvents.map((evt) => {
            const isSelected = evt.id === selectedEventId;
            const isChecked = selectedIds.has(evt.id);
            const verdictLower = evt.verdict.toLowerCase().replace(' ', '-');
            const path = getPathOnly(evt.url);
            const isPayment = evt.analysis?.paymentDetected;

            return (
              <div
                key={evt.id}
                className={`feed-item verdict-${verdictLower} ${isSelected ? 'selected' : ''} ${
                  isChecked ? 'checked-for-delete' : ''
                }`}
                onClick={() => onSelectEvent(evt)}
              >
                <div className="feed-item-top">
                  <div className="feed-item-domain-group">
                    {isSelectMode ? (
                      <button
                        className={`item-checkbox ${isChecked ? 'checked' : ''}`}
                        onClick={(e) => toggleSelectEvent(evt.id, e)}
                        title={isChecked ? 'Deselect' : 'Select for deletion'}
                      >
                        {isChecked ? <CheckSquare size={13} className="text-emerald-400" /> : <Square size={13} />}
                      </button>
                    ) : (
                      <span className={`verdict-dot ${verdictLower}`} />
                    )}
                    <span className="feed-item-hostname" title={evt.hostname}>
                      {evt.hostname}
                    </span>
                  </div>

                  <span className={`feed-item-badge ${verdictLower}`}>{evt.verdict}</span>
                </div>

                {path && (
                  <div className="feed-item-path font-mono" title={evt.url}>
                    {path.length > 34 ? `${path.substring(0, 32)}...` : path}
                  </div>
                )}

                <div className="feed-item-meta">
                  <span className="feed-item-time font-mono">{formatTime(evt.timestamp)}</span>

                  <div className="feed-item-indicators">
                    {isPayment && (
                      <span className="feed-payment-pill" title="Payment surface detected">
                        <CreditCard size={11} />
                        <span>PAY</span>
                      </span>
                    )}

                    <span className="feed-item-risk font-mono">
                      RISK {Math.round(evt.riskScore > 1 ? evt.riskScore : evt.riskScore * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
