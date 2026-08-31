import React from 'react';
import type { ProtectionEventItem } from '../../shared/types/decision.ts';

interface EventItemProps {
  event: ProtectionEventItem;
  onClick: () => void;
}

export const EventItem: React.FC<EventItemProps> = ({ event, onClick }) => {
  const formatTime = (ts: number) => {
    const diffMs = Date.now() - ts;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return new Date(ts).toLocaleDateString();
  };

  const statusClass =
    event.status === 'DANGER'
      ? 'danger'
      : event.status === 'CAUTION'
        ? 'caution'
        : 'safe';

  return (
    <div
      className="event-row"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View details for ${event.hostname}`}
    >
      <div className="event-main">
        <span className={`event-status-badge ${statusClass}`}>{event.status}</span>
        <div className="event-info">
          <span className="event-host">{event.hostname}</span>
          <span className="event-explanation">{event.message}</span>
        </div>
      </div>

      <div className="event-meta">
        <span className="event-action-tag">Action: {event.actionTaken}</span>
        <span className="event-time">{formatTime(event.timestamp)}</span>
      </div>
    </div>
  );
};
