import React from 'react';
import { LayoutDashboard } from 'lucide-react';

export const DashboardLink: React.FC = () => {
  const handleOpenDashboard = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof chrome !== 'undefined' && chrome.tabs?.create && chrome.runtime?.getURL) {
      const dashboardUrl = chrome.runtime.getURL('dashboard.html');
      chrome.tabs.create({ url: dashboardUrl });
    } else {
      window.open('dashboard.html', '_blank');
    }
  };

  return (
    <button
      type="button"
      className="verdict-dashboard-btn"
      onClick={handleOpenDashboard}
      aria-label="Open Verdict Security Dashboard"
    >
      <LayoutDashboard size={15} aria-hidden="true" />
      <span>Open Dashboard</span>
    </button>
  );
};
