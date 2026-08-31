import React from 'react';
import { Globe, AlertTriangle, ShieldCheck, ShieldAlert } from 'lucide-react';
import type { ActiveTabInfo, ProtectionEventItem, ProtectionStats } from '../../shared/types/decision.ts';
import { CurrentSiteCard } from '../components/CurrentSiteCard.tsx';
import { EventItem } from '../components/EventItem.tsx';
import { MetricsCard } from '../components/MetricsCard.tsx';

interface OverviewPageProps {
  protectionEnabled: boolean;
  activeTab: ActiveTabInfo | null;
  stats: ProtectionStats;
  recentEvents: ProtectionEventItem[];
  onSelectEvent: (event: ProtectionEventItem) => void;
  onNavigateToHistory: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  protectionEnabled,
  activeTab,
  stats,
  recentEvents,
  onSelectEvent,
  onNavigateToHistory,
}) => {
  const handleCurrentSiteDetails = () => {
    if (activeTab?.decision && activeTab.url) {
      onSelectEvent({
        id: 'current-tab-detail',
        url: activeTab.url,
        hostname: activeTab.hostname,
        timestamp: Date.now(),
        status: activeTab.decision.status,
        title: activeTab.decision.title,
        message: activeTab.decision.message,
        action: activeTab.decision.action,
        actionTaken:
          activeTab.decision.action === 'GO_BACK'
            ? 'Blocked'
            : activeTab.decision.action === 'WARN'
              ? 'Warned'
              : 'Allowed',
        technicalDetails: {
          requestId: activeTab.decision.decisionId || 'active-tab-req',
          detectionEngine: 'Verdict Cloud v1',
        },
      });
    }
  };

  return (
    <div className="dashboard-page-content">
      {/* 1. Current Website */}
      <CurrentSiteCard
        activeTab={activeTab}
        protectionEnabled={protectionEnabled}
        onViewDetails={handleCurrentSiteDetails}
      />

      {/* 2. Key Metrics Grid */}
      <div className="grid-metrics">
        <MetricsCard
          title="Sites Checked"
          value={stats.sitesChecked}
          subtext="Autonomous background scans"
          icon={Globe}
          iconColor="var(--color-brand)"
        />
        <MetricsCard
          title="Warnings Issued"
          value={stats.warningsIssued}
          subtext="Caution advisories triggered"
          icon={AlertTriangle}
          iconColor="var(--color-caution)"
        />
        <MetricsCard
          title="Threats Prevented"
          value={stats.threatsPrevented}
          subtext="High-risk shops blocked"
          icon={ShieldAlert}
          iconColor="var(--color-danger)"
        />
        <MetricsCard
          title="Protection Status"
          value={protectionEnabled ? 'Active' : 'Paused'}
          subtext="Zero-latency safety layer"
          icon={ShieldCheck}
          iconColor={protectionEnabled ? 'var(--color-safe)' : 'var(--text-muted)'}
        />
      </div>

      {/* 3. Recent Activity Section */}
      <div className="section-header">
        <h2 className="section-title">Recent Activity</h2>
        {recentEvents.length > 0 && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onNavigateToHistory}
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            View All History
          </button>
        )}
      </div>

      <div className="timeline-list">
        {recentEvents.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
            No recent activity recorded yet. Browse normally to see autonomous safety events.
          </div>
        ) : (
          recentEvents.slice(0, 5).map((event) => (
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
