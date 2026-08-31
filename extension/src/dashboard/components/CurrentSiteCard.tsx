import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldAlert, Globe } from 'lucide-react';
import type { ActiveTabInfo } from '../../shared/types/decision.ts';

interface CurrentSiteCardProps {
  activeTab: ActiveTabInfo | null;
  protectionEnabled: boolean;
  onViewDetails?: () => void;
}

export const CurrentSiteCard: React.FC<CurrentSiteCardProps> = ({
  activeTab,
  protectionEnabled,
  onViewDetails,
}) => {
  if (!protectionEnabled) {
    return (
      <div className="current-site-card">
        <div className="site-meta">
          <div className="site-icon-wrapper" style={{ backgroundColor: 'rgba(100, 116, 139, 0.12)', color: 'var(--text-muted)' }}>
            <Globe size={24} aria-hidden="true" />
          </div>
          <div className="site-info">
            <span className="site-url-label">Protection Paused</span>
            <div className="site-hostname">{activeTab?.hostname || 'No active website'}</div>
            <div className="site-verdict-tag">Verdict is currently paused. Resume protection for autonomous safety.</div>
          </div>
        </div>
      </div>
    );
  }

  const decision = activeTab?.decision;
  const status = decision?.status || 'SAFE';

  const isDanger = status === 'DANGER';
  const isCaution = status === 'CAUTION';

  const statusClass = isDanger ? 'danger' : isCaution ? 'caution' : 'safe';
  const statusTitle = decision?.title || (isDanger ? "Don't pay here" : isCaution ? 'Be careful here' : 'Looks good');
  const statusMessage = decision?.message || (
    isDanger
      ? 'Verdict found signs that this may be a fake shop.'
      : isCaution
        ? "This shop is very new and we couldn't verify who operates it."
        : 'Verdict has no concerns about this site.'
  );

  return (
    <div className="current-site-card">
      <div className="site-meta">
        <div className={`site-icon-wrapper ${statusClass}`} aria-hidden="true">
          {isDanger ? (
            <ShieldAlert size={24} />
          ) : isCaution ? (
            <AlertTriangle size={24} />
          ) : (
            <ShieldCheck size={24} />
          )}
        </div>

        <div className="site-info">
          <span className="site-url-label">Current Website</span>
          <div className="site-hostname">{activeTab?.hostname || 'Browser Homepage'}</div>
          <div className="site-verdict-tag">
            <strong style={{ color: isDanger ? 'var(--color-danger)' : isCaution ? 'var(--color-caution)' : 'var(--color-safe)' }}>
              {statusTitle}
            </strong>
            {' — '}
            {statusMessage}
          </div>
        </div>
      </div>

      {onViewDetails && activeTab?.decision && (
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onViewDetails}
        >
          View Analysis
        </button>
      )}
    </div>
  );
};
