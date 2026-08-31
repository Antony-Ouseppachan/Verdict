import React, { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import type { ProtectionEventItem } from '../../shared/types/decision.ts';
import { EventItem } from '../components/EventItem.tsx';

interface HistoryPageProps {
  events: ProtectionEventItem[];
  onSelectEvent: (event: ProtectionEventItem) => void;
  onClearHistory: () => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  events,
  onSelectEvent,
  onClearHistory,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'SAFE' | 'CAUTION' | 'DANGER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = events.filter((e) => {
    if (filter !== 'ALL' && e.status !== filter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return e.hostname.toLowerCase().includes(q) || e.url.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="dashboard-page-content">
      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['ALL', 'DANGER', 'CAUTION', 'SAFE'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              className={`btn ${filter === tab ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setFilter(tab)}
              style={{ fontSize: 'var(--font-size-xs)', textTransform: 'capitalize' }}
            >
              {tab === 'ALL' ? 'All Events' : tab.toLowerCase()}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Search
              size={14}
              color="var(--text-muted)"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search website..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 32px',
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-xs)',
                outline: 'none',
              }}
            />
          </div>

          {events.length > 0 && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={onClearHistory}
              style={{ fontSize: 'var(--font-size-xs)' }}
              title="Clear protection event history"
            >
              <Trash2 size={14} />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Events Timeline */}
      <div className="timeline-list">
        {filteredEvents.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No protection events found matching your criteria.
          </div>
        ) : (
          filteredEvents.map((event) => (
            <EventItem
              key={event.id}
              event={event}
              onClick={() => onSelectEvent(event)}
            />
          ))
        )}
      </div>
    </div>
  );
};
