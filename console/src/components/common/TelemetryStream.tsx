import React from 'react';
import type { ConsoleEvent } from '../../types/index.ts';
import { Terminal, ShieldAlert, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { formatTimestamp } from '../../utils/formatters.ts';

interface TelemetryStreamProps {
  events: ConsoleEvent[];
  maxItems?: number;
  onSelectEventInvestigation?: (id: string) => void;
}

export const TelemetryStream: React.FC<TelemetryStreamProps> = ({
  events,
  maxItems = 15,
  onSelectEventInvestigation,
}) => {
  const displayEvents = events.slice(0, maxItems);

  const getSeverityIcon = (sev: string | undefined) => {
    switch (sev) {
      case 'ERROR':
        return <ShieldAlert size={13} className="text-crimson-400" />;
      case 'WARN':
        return <AlertTriangle size={13} className="text-amber-400" />;
      case 'SUCCESS':
        return <CheckCircle2 size={13} className="text-emerald-400" />;
      case 'INFO':
      default:
        return <Info size={13} className="text-sky-400" />;
    }
  };

  return (
    <div className="console-telemetry-feed">
      <div className="console-telemetry-header">
        <div className="console-telemetry-title-group">
          <Terminal size={15} className="text-slate-400" />
          <h4 className="console-telemetry-title">Security Event Log</h4>
        </div>
        <div className="console-telemetry-live-badge">
          <span className="live-pulse-dot" />
          <span>LIVE</span>
        </div>
      </div>

      <div className="console-telemetry-list">
        {displayEvents.length === 0 ? (
          <div className="console-telemetry-empty">Awaiting incoming telemetry events...</div>
        ) : (
          displayEvents.map((evt) => (
            <div
              key={evt.id}
              className={`console-telemetry-row sev-${(evt.severity || 'info').toLowerCase()}`}
              onClick={() => onSelectEventInvestigation && onSelectEventInvestigation(evt.investigationId)}
            >
              <span className="telemetry-time font-mono">{formatTimestamp(evt.timestamp)}</span>
              <span className="telemetry-icon">{getSeverityIcon(evt.severity)}</span>
              <span className="telemetry-type font-mono">{evt.type}</span>
              <span className="telemetry-msg">{evt.message}</span>
              <span className="telemetry-invid font-mono">{evt.investigationId}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
