import React from 'react';
import { Activity } from 'lucide-react';
import { VerdictLogo } from './VerdictLogo.tsx';

export const ConsoleHeader: React.FC = () => {
  return (
    <header className="console-header">
      <div className="console-brand">
        <VerdictLogo size={22} glow />
        <span className="console-brand-title">Verdict</span>
        <span className="console-badge">Operator Console</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#94a3b8' }}>
        <Activity size={14} color="#10b981" />
        <span>Infrastructure Operational</span>
      </div>
    </header>
  );
};
