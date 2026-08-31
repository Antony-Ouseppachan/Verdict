import React from 'react';
import { ConsoleProvider, useConsole } from './context/ConsoleContext.tsx';
import { Sidebar } from './components/navigation/Sidebar.tsx';
import { Header } from './components/navigation/Header.tsx';
import { OverviewPage } from './pages/OverviewPage.tsx';
import { InvestigationsPage } from './pages/InvestigationsPage.tsx';
import { InvestigationDetailPage } from './pages/InvestigationDetailPage.tsx';
import { SandboxPage } from './pages/SandboxPage.tsx';
import { PaymentIntelPage } from './pages/PaymentIntelPage.tsx';
import { WebsiteIntelPage } from './pages/WebsiteIntelPage.tsx';
import { BrandContentPage } from './pages/BrandContentPage.tsx';
import { AIInvestigatorPage } from './pages/AIInvestigatorPage.tsx';
import { VerdictPage } from './pages/VerdictPage.tsx';
import { SystemPage } from './pages/SystemPage.tsx';
import './styles/index.css';

const MainContent: React.FC = () => {
  const { currentPage } = useConsole();

  const renderActivePage = () => {
    switch (currentPage) {
      case 'OVERVIEW':
        return <OverviewPage />;
      case 'INVESTIGATIONS':
        return <InvestigationsPage />;
      case 'INVESTIGATION_DETAIL':
        return <InvestigationDetailPage />;
      case 'SANDBOX':
        return <SandboxPage />;
      case 'PAYMENT':
        return <PaymentIntelPage />;
      case 'WEBSITE_INTEL':
        return <WebsiteIntelPage />;
      case 'BRAND_CONTENT':
        return <BrandContentPage />;
      case 'AI_INVESTIGATOR':
        return <AIInvestigatorPage />;
      case 'VERDICT':
        return <VerdictPage />;
      case 'SYSTEM':
        return <SystemPage />;
      default:
        return <OverviewPage />;
    }
  };

  return (
    <div className="console-layout-wrapper">
      <Sidebar />
      <div className="console-main-viewport">
        <Header />
        <main className="console-page-scrollable">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ConsoleProvider>
      <MainContent />
    </ConsoleProvider>
  );
};
