import React, { useEffect, useState } from 'react';
import { ExternalLink, ShieldCheck, Bell, Eye, Lock, Globe, Scan } from 'lucide-react';
import {
  getOverlayState,
  setOverlayState,
  onOverlayStateChanged,
} from '../../storage/overlayState.ts';
import { env } from '../../config/environment.ts';

interface SettingsPageProps {
  protectionEnabled: boolean;
  onToggleProtection: (enabled: boolean) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  protectionEnabled,
  onToggleProtection,
}) => {
  const [overlayEnabled, setOverlayStateVal] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [appearance, setAppearance] = useState<'DARK' | 'SYSTEM'>('DARK');

  useEffect(() => {
    let mounted = true;
    async function loadOverlay() {
      const state = await getOverlayState();
      if (mounted) setOverlayStateVal(state);
    }
    loadOverlay();

    const unsub = onOverlayStateChanged((val) => {
      if (mounted) setOverlayStateVal(val);
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const handleToggleOverlay = async () => {
    const nextVal = !overlayEnabled;
    setOverlayStateVal(nextVal);
    await setOverlayState(nextVal);
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'SET_OVERLAY_STATE',
        payload: { enabled: nextVal },
      });
    }
  };

  const handleOpenWebsite = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: env.settingsUrl });
    } else {
      window.open(env.settingsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="dashboard-page-content">
      <div className="settings-group">
        {/* 1. Core Protection */}
        <div className="settings-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <ShieldCheck size={20} color="var(--color-brand)" aria-hidden="true" />
            <div className="settings-info">
              <span className="settings-label">Autonomous Safety Shield</span>
              <span className="settings-desc">
                Continuously evaluate merchant authenticity and protect against fake checkouts.
              </span>
            </div>
          </div>

          <button
            type="button"
            className={`btn ${protectionEnabled ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => onToggleProtection(!protectionEnabled)}
            style={{ minWidth: '90px', justifyContent: 'center' }}
          >
            {protectionEnabled ? 'Active' : 'Paused'}
          </button>
        </div>

        {/* 2. In-Page Scanning Overlay */}
        <div className="settings-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Scan size={20} color={overlayEnabled ? 'var(--color-brand)' : 'var(--text-muted)'} aria-hidden="true" />
            <div className="settings-info">
              <span className="settings-label">Enable overlay</span>
              <span className="settings-desc">
                Show the scanning overlay on visited websites.
              </span>
            </div>
          </div>

          <button
            type="button"
            className={`btn ${overlayEnabled ? 'btn-primary' : 'btn-secondary'}`}
            onClick={handleToggleOverlay}
            style={{ minWidth: '90px', justifyContent: 'center' }}
          >
            {overlayEnabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* 2. Notifications */}
        <div className="settings-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Bell size={20} color="var(--text-secondary)" aria-hidden="true" />
            <div className="settings-info">
              <span className="settings-label">Caution Advisories</span>
              <span className="settings-desc">
                Show non-intrusive advisories when navigating newly registered merchant stores.
              </span>
            </div>
          </div>

          <button
            type="button"
            className={`btn ${notifications ? 'btn-secondary' : 'btn-secondary'}`}
            onClick={() => setNotifications(!notifications)}
            style={{ minWidth: '90px', justifyContent: 'center', opacity: notifications ? 1 : 0.6 }}
          >
            {notifications ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* 3. Appearance */}
        <div className="settings-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Eye size={20} color="var(--text-secondary)" aria-hidden="true" />
            <div className="settings-info">
              <span className="settings-label">Theme & Appearance</span>
              <span className="settings-desc">
                Restrained dark mode optimized for professional security workflows.
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setAppearance(appearance === 'DARK' ? 'SYSTEM' : 'DARK')}
            style={{ minWidth: '90px', justifyContent: 'center' }}
          >
            {appearance === 'DARK' ? 'Dark Mode' : 'Match System'}
          </button>
        </div>

        {/* 4. Privacy & Data Minimization */}
        <div className="settings-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Lock size={20} color="var(--color-safe)" aria-hidden="true" />
            <div className="settings-info">
              <span className="settings-label">Privacy & Zero-Knowledge Safeguards</span>
              <span className="settings-desc">
                Verdict strictly never collects form values, passwords, credit card numbers, or auth tokens.
              </span>
            </div>
          </div>

          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              color: 'var(--color-safe)',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid var(--color-safe-border)',
            }}
          >
            Enforced
          </span>
        </div>

        {/* 5. Account Link */}
        <div className="settings-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Globe size={20} color="var(--text-secondary)" aria-hidden="true" />
            <div className="settings-info">
              <span className="settings-label">Verdict Account & Cloud Sync</span>
              <span className="settings-desc">
                Manage cloud backups, subscription tiers, and family group settings on the web.
              </span>
            </div>
          </div>

          <a
            href={env.settingsUrl}
            onClick={handleOpenWebsite}
            className="btn btn-primary"
            style={{ fontSize: 'var(--font-size-xs)' }}
          >
            <span>Open Verdict Web</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  );
};
