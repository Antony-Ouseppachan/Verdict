import React from 'react';
import {
  ShieldCheck,
  Clock,
  Laptop,
  Settings,
  ArrowUpRight,
} from 'lucide-react';
import { VerdictLogo } from '../../shared/components/VerdictLogo.tsx';
import { env } from '../../config/environment.ts';

export type DashboardTab = 'overview' | 'history' | 'devices' | 'settings';

interface SidebarProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  protectionEnabled: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  protectionEnabled,
}) => {
  const handleAccountClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: env.settingsUrl });
    } else {
      window.open(env.settingsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <aside className="dashboard-sidebar" aria-label="Dashboard Navigation">
      <div className="sidebar-header">
        <VerdictLogo size={24} glow={protectionEnabled} />
        <span className="sidebar-brand-title">VERDICT</span>
      </div>

      <nav className="sidebar-nav">
        <button
          type="button"
          className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => onTabChange('overview')}
        >
          <ShieldCheck size={18} aria-hidden="true" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => onTabChange('history')}
        >
          <Clock size={18} aria-hidden="true" />
          <span>Protection History</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === 'devices' ? 'active' : ''}`}
          onClick={() => onTabChange('devices')}
        >
          <Laptop size={18} aria-hidden="true" />
          <span>Devices</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => onTabChange('settings')}
        >
          <Settings size={18} aria-hidden="true" />
          <span>Settings</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-status-pill">
          <span
            className={`status-dot ${protectionEnabled ? 'active' : 'paused'}`}
            aria-hidden="true"
          />
          <span>{protectionEnabled ? 'Protection Active' : 'Protection Paused'}</span>
        </div>

        <a
          href={env.settingsUrl}
          onClick={handleAccountClick}
          className="sidebar-account-link"
          aria-label="Open Verdict Account on website"
        >
          <span>Account & Cloud</span>
          <ArrowUpRight size={14} aria-hidden="true" />
        </a>
      </div>
    </aside>
  );
};
