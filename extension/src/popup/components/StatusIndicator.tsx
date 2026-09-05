import React, { useEffect, useState } from 'react';
import type { ActiveTabInfo } from '../../shared/types/decision.ts';
import { isLocalhostUrl, classifyPage } from '../../security/url.ts';
import { t } from '../../shared/utils/i18n.ts';

interface StatusIndicatorProps {
  enabled: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ enabled }) => {
  const [activeTab, setActiveTab] = useState<ActiveTabInfo | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // 1. In popup context, query active tab directly in current window
    if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab && tab.url) {
          const pageType = classifyPage(tab.url);
          if (pageType === 'INTERNAL_BROWSER_PAGE' || pageType === 'UNSUPPORTED_PAGE') {
            let hostDisplay = 'Browser System Page';
            try {
              const parsed = new URL(tab.url);
              hostDisplay = parsed.hostname
                ? `${parsed.protocol}//${parsed.hostname}`
                : parsed.protocol.replace(':', '') || 'System Page';
            } catch {
              hostDisplay = 'System Page';
            }

            setActiveTab({
              url: tab.url,
              hostname: hostDisplay,
              title: tab.title || 'Browser System Page',
              decision: {
                status: 'SAFE',
                title: 'Browser System Page',
                message: 'Internal browser system pages are exempt.',
                action: 'NONE',
                decisionId: `sys-${tab.id}`,
                timestamp: Date.now(),
                pageType: 'INTERNAL_BROWSER_PAGE',
                reasons: [],
              },
            });
            return;
          }

          try {
            const parsed = new URL(tab.url);
            setActiveTab((prev) => ({
              url: tab.url || '',
              hostname: parsed.hostname,
              title: tab.title,
              decision: prev?.decision,
            }));
          } catch {
            // ignore
          }
        }
      });
    }

    // 2. Fetch full decision status from background coordinator
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      try {
        chrome.runtime.sendMessage({ type: 'GET_ACTIVE_TAB_INFO' }, (res) => {
          if (res && res.success && res.data) {
            setActiveTab(res.data);
          }
        });
      } catch {
        // fallback
      }
    }
  }, []);

  const pageType = activeTab?.decision?.pageType;
  const isInternal =
    pageType === 'INTERNAL_BROWSER_PAGE' ||
    pageType === 'UNSUPPORTED_PAGE' ||
    (activeTab?.url && !activeTab.url.startsWith('http'));
  const isLocal = !isInternal && isLocalhostUrl(activeTab?.url);
  const isHttps = !isInternal && !!activeTab?.url?.startsWith('https://');

  const getSiteStatus = () => {
    if (!enabled) return { label: 'Paused', class: 'paused', desc: 'Protection is paused' };
    if (isInternal) return { label: 'System Page', class: 'safe', desc: 'Exempt browser system page' };
    if (isLocal) return { label: 'Localhost', class: 'safe', desc: 'Exempt development server' };
    if (!activeTab?.decision) return { label: t('popup', 'looksGood'), class: 'safe', desc: 'No threats detected' };
    const status = activeTab.decision.status;
    if (status === 'DANGER') return { label: t('popup', 'dontPay'), class: 'danger', desc: 'High risk detected' };
    if (status === 'CAUTION') return { label: t('popup', 'beCareful'), class: 'caution', desc: 'Suspicious merchant' };
    return { label: t('popup', 'looksGood'), class: 'safe', desc: 'Verified authentic domain' };
  };

  const handleCopy = () => {
    if (activeTab?.hostname) {
      navigator.clipboard.writeText(activeTab.hostname);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const status = getSiteStatus();

  return (
    <div className="verdict-current-site-card">
      <div className="verdict-site-header">
        <span className="verdict-site-label">{t('popup', 'currentSite')}</span>
        <div className={`verdict-site-badge ${status.class}`}>
          <span className="verdict-site-dot" aria-hidden="true" />
          <span>{status.label}</span>
        </div>
      </div>

      <div className="verdict-site-info-row">
        <div className="verdict-site-meta">
          <div className="verdict-site-hostname font-mono">
            {activeTab?.hostname || 'Active Tab'}
          </div>
          <div className="verdict-site-sub">
            <span className={`protocol-pill ${isInternal ? 'proto-local' : isLocal ? 'proto-local' : isHttps ? 'proto-https' : 'proto-http'}`}>
              {isInternal ? 'SYSTEM' : isLocal ? 'LOCAL' : isHttps ? 'HTTPS' : 'HTTP'}
            </span>
            <span className="verdict-site-bullet">•</span>
            <span className="verdict-site-desc">{status.desc}</span>
          </div>
        </div>

        <button
          type="button"
          className={`verdict-site-action-btn ${copied ? 'is-copied' : ''}`}
          onClick={handleCopy}
          title={copied ? 'Copied to clipboard' : 'Copy domain'}
          aria-label="Copy domain name"
        >
          {copied ? (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
};
