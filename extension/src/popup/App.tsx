import React, { useEffect, useState } from 'react';
import {
  getProtectionState,
  setProtectionState,
  onProtectionStateChanged,
} from '../storage/protectionState.ts';
import { VerdictLogo } from '../shared/components/VerdictLogo.tsx';
import { DashboardLink } from './components/DashboardLink.tsx';
import { OverlayToggle } from './components/OverlayToggle.tsx';
import { SettingsLink } from './components/SettingsLink.tsx';
import { ShieldControl } from './components/ShieldControl.tsx';
import { StatusIndicator } from './components/StatusIndicator.tsx';
import { t } from '../shared/utils/i18n.ts';
import './styles/popup.css';

export const App: React.FC = () => {
  const [enabled, setEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    async function loadState() {
      const state = await getProtectionState();
      if (mounted) {
        setEnabled(state);
        setLoading(false);
      }
    }

    loadState();

    const unsubscribe = onProtectionStateChanged((newState) => {
      if (mounted) {
        setEnabled(newState);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const handleToggle = async (newState: boolean) => {
    setEnabled(newState);
    await setProtectionState(newState);
  };

  return (
    <div className={`verdict-popup-container ${enabled ? 'is-on' : 'is-off'}`}>
      <header className="verdict-popup-header">
        <div className="verdict-brand">
          <VerdictLogo size={22} glow={enabled} />
          <h1 className="verdict-brand-title">{t('popup', 'title')}</h1>
          <span className="verdict-brand-tagline">{t('popup', 'tagline')}</span>
        </div>
      </header>

      <main className="verdict-popup-main">
        <ShieldControl
          enabled={enabled}
          onToggle={handleToggle}
          disabled={loading}
        />
        <StatusIndicator enabled={enabled} />
        <OverlayToggle />
        <DashboardLink />
      </main>

      <SettingsLink />
    </div>
  );
};
