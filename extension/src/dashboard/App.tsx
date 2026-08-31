import React, { useState } from 'react';
import type { ProtectionEventItem } from '../shared/types/decision.ts';
import { DetailModal } from './components/DetailModal.tsx';
import { Header } from './components/Header.tsx';
import { Sidebar, type DashboardTab } from './components/Sidebar.tsx';
import { useHistory } from './hooks/useHistory.ts';
import { useProtection } from './hooks/useProtection.ts';
import { DevicesPage } from './pages/DevicesPage.tsx';
import { HistoryPage } from './pages/HistoryPage.tsx';
import { OverviewPage } from './pages/OverviewPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import './styles/dashboard.css';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [selectedEvent, setSelectedEvent] = useState<ProtectionEventItem | null>(null);

  const { enabled, activeTab: currentTabInfo, toggleProtection, refreshActiveTab } = useProtection();
  const { events, stats, clearHistory, refreshHistory } = useHistory();

  const handleRefresh = () => {
    refreshActiveTab();
    refreshHistory();
  };

  const getPageHeaderInfo = () => {
    switch (activeTab) {
      case 'overview':
        return {
          title: 'Protection Overview',
          subtitle: 'Real-time autonomous threat evaluation and current website telemetry.',
        };
      case 'history':
        return {
          title: 'Protection History',
          subtitle: 'Comprehensive audit log of analyzed websites, advisories, and interventions.',
        };
      case 'devices':
        return {
          title: 'Connected Devices',
          subtitle: 'Manage endpoints and sync threat intelligence across family devices.',
        };
      case 'settings':
        return {
          title: 'Extension Settings',
          subtitle: 'Manage autonomous protection preferences, notifications, and privacy.',
        };
    }
  };

  const headerInfo = getPageHeaderInfo();

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        protectionEnabled={enabled}
      />

      {/* Main Content Area */}
      <main className="dashboard-main">
        <Header
          title={headerInfo.title}
          subtitle={headerInfo.subtitle}
          onRefresh={handleRefresh}
        />

        {activeTab === 'overview' && (
          <OverviewPage
            protectionEnabled={enabled}
            activeTab={currentTabInfo}
            stats={stats}
            recentEvents={events}
            onSelectEvent={setSelectedEvent}
            onNavigateToHistory={() => setActiveTab('history')}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPage
            events={events}
            onSelectEvent={setSelectedEvent}
            onClearHistory={clearHistory}
          />
        )}

        {activeTab === 'devices' && (
          <DevicesPage protectionEnabled={enabled} />
        )}

        {activeTab === 'settings' && (
          <SettingsPage
            protectionEnabled={enabled}
            onToggleProtection={toggleProtection}
          />
        )}
      </main>

      {/* Deep Inspection Detail Modal */}
      {selectedEvent && (
        <DetailModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
};
