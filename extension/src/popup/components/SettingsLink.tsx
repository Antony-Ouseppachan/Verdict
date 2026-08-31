import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { env } from '../../config/environment.ts';
import { t } from '../../shared/utils/i18n.ts';

export const SettingsLink: React.FC = () => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
      chrome.tabs.create({ url: env.settingsUrl });
    } else {
      window.open(env.settingsUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <footer className="verdict-popup-footer">
      <span className="verdict-engine-tag">VERDICT AI AGENT v0.1</span>
      <button
        type="button"
        className="verdict-settings-link"
        onClick={handleClick}
        aria-label="Open Verdict Account Console"
      >
        <span>{t('popup', 'settings')}</span>
        <ArrowUpRight size={12} aria-hidden="true" />
      </button>
    </footer>
  );
};
