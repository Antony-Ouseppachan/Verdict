import React, { useEffect, useState } from 'react';

export function FirewallApp(): JSX.Element {
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [hostname, setHostname] = useState<string>('Suspicious Domain');
  const [title, setTitle] = useState<string>("Don't pay here");
  const [message, setMessage] = useState<string>('This looks like a fake shop. Your money may not be safe.');
  const [decisionId, setDecisionId] = useState<string>('');
  const [isProceeding, setIsProceeding] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target = params.get('target') || '';
    const qTitle = params.get('title');
    const qMsg = params.get('message');
    const qDecId = params.get('decisionId');

    if (target) {
      setTargetUrl(target);
      try {
        const parsed = new URL(target);
        setHostname(parsed.hostname);
      } catch {
        setHostname(target);
      }
    }
    if (qTitle) setTitle(qTitle);
    if (qMsg) setMessage(qMsg);
    if (qDecId) setDecisionId(qDecId);

    document.title = `Verdict Firewall — ${hostname || 'Access Blocked'}`;
  }, [hostname]);

  const handleReturnToSafety = () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: 'NAVIGATE_BACK' }, (response) => {
          if (chrome.runtime.lastError || !response?.success) {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = 'https://www.google.com';
            }
          }
        });
        return;
      }
    } catch {
      // ignore
    }

    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = 'https://www.google.com';
    }
  };

  const handleProceedWithRisk = async () => {
    if (!targetUrl) return;
    setIsProceeding(true);

    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        await new Promise<void>((resolve) => {
          chrome.runtime.sendMessage(
            {
              type: 'ALLOW_BYPASS',
              payload: { url: targetUrl, decisionId },
            },
            () => resolve()
          );
        });
      }
    } catch {
      // ignore
    }

    window.location.replace(targetUrl);
  };

  const defaultEvidence = [
    'Unverified merchant identity or counterfeit brand signature detected',
    'Unauthorized credential or payment transmission vector intercepted',
    'Zero-Trust isolation enforced: high threat confidence score',
  ];

  return (
    <div style={styles.backdrop}>
      <div style={styles.gridOverlay} />
      <div style={styles.card}>
        {/* Shield Icon Header */}
        <div style={styles.header}>
          <div style={styles.shieldWrapper}>
            <div style={styles.shieldPulse} />
            <div style={styles.shieldIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
          </div>
        </div>

        {/* Title & Subtitle */}
        <h1 style={styles.title}>{title}</h1>
        <p style={styles.desc}>{message}</p>

        {/* Explicit Payment Hazard Callout */}
        <div style={styles.paymentWarning}>
          <div style={styles.paymentIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
              <line x1="2" x2="22" y1="2" y2="22" stroke="#f87171" strokeWidth="2.5" />
            </svg>
          </div>
          <div style={styles.paymentContent}>
            <span style={styles.paymentTitle}>PAYMENT &amp; FINANCIAL HAZARD</span>
            <span style={styles.paymentText}>
              DO NOT MAKE ANY PAYMENTS OR ENTER CREDIT CARD / BANKING DETAILS ON THIS SITE. VERDICT CANNOT GUARANTEE FINANCIAL SAFETY.
            </span>
          </div>
        </div>

        {/* Target Domain Pill */}
        <div style={styles.targetPill}>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span style={styles.targetDomain}>{hostname}</span>
          <span style={styles.targetStatus}>ACCESS BLOCKED</span>
        </div>

        {/* Threat Telemetry */}
        <div style={styles.intelBox}>
          <div style={styles.intelHeader}>
            <span style={styles.intelTag}>// VERDICT THREAT TELEMETRY</span>
            <span style={styles.intelRisk}>HIGH RISK</span>
          </div>
          <div style={styles.reasonsList}>
            {defaultEvidence.map((ev, i) => (
              <div key={i} style={styles.reasonItem}>
                <span style={styles.reasonBullet} />
                <span>{ev}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <button style={styles.primaryBtn} onClick={handleReturnToSafety} autoFocus>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            <span>Take me back (Recommended)</span>
          </button>
          <button style={styles.secondaryBtn} onClick={handleProceedWithRisk} disabled={isProceeding}>
            <span>{isProceeding ? 'Connecting...' : 'I understand the risk (Proceed to Website)'}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span>🛡️ VERDICT protected and secured</span>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#050406',
    backgroundImage: 'radial-gradient(circle at 50% 32%, #22080d 0%, #0f0a0e 55%, #050406 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    boxSizing: 'border-box',
    position: 'relative',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    color: '#e4e4e7',
  },
  gridOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      'linear-gradient(rgba(239, 68, 68, 0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(239, 68, 68, 0.04) 1px, transparent 1px)',
    backgroundSize: '32px 32px',
    pointerEvents: 'none',
    opacity: 0.8,
  },
  card: {
    position: 'relative',
    background: 'linear-gradient(165deg, rgba(24, 16, 20, 0.96) 0%, rgba(13, 11, 15, 0.98) 100%)',
    border: '1px solid rgba(239, 68, 68, 0.45)',
    borderTop: '1px solid rgba(248, 113, 113, 0.75)',
    borderRadius: '16px',
    width: 'min(540px, 94vw)',
    padding: '32px 28px 24px',
    boxShadow:
      '0 28px 70px -10px rgba(0, 0, 0, 0.9), 0 0 50px -10px rgba(239, 68, 68, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.15)',
    textAlign: 'center',
    boxSizing: 'border-box',
    zIndex: 2,
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '20px',
  },
  shieldWrapper: {
    position: 'relative',
    width: '64px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldPulse: {
    position: 'absolute',
    inset: '-6px',
    borderRadius: '50%',
    background: 'rgba(239, 68, 68, 0.22)',
  },
  shieldIcon: {
    position: 'relative',
    width: '58px',
    height: '58px',
    borderRadius: '16px',
    background: 'linear-gradient(145deg, rgba(239, 68, 68, 0.2) 0%, rgba(153, 27, 27, 0.35) 100%)',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ef4444',
    boxShadow: '0 0 24px rgba(239, 68, 68, 0.4), inset 0 0 12px rgba(239, 68, 68, 0.25)',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '-0.02em',
    lineHeight: 1.25,
    marginBottom: '8px',
    margin: '0 0 8px 0',
  },
  desc: {
    fontSize: '13.5px',
    color: '#cbd5e1',
    lineHeight: 1.55,
    maxWidth: '440px',
    margin: '0 auto 16px',
    fontWeight: 400,
  },
  paymentWarning: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(185, 28, 28, 0.28) 100%)',
    border: '1px solid rgba(239, 68, 68, 0.65)',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '18px',
    textAlign: 'left',
    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.15)',
  },
  paymentIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#ef4444',
    flexShrink: 0,
    marginTop: '1px',
  },
  paymentContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  paymentTitle: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#fca5a5',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
  },
  paymentText: {
    fontSize: '12px',
    color: '#ffffff',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  targetPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    background: 'rgba(0, 0, 0, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '8px',
    marginBottom: '18px',
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  targetDomain: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '12px',
    color: '#f1f5f9',
    fontWeight: 500,
    maxWidth: '280px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  targetStatus: {
    fontSize: '9.5px',
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: '4px',
    background: 'rgba(239, 68, 68, 0.25)',
    color: '#fca5a5',
    letterSpacing: '0.04em',
  },
  intelBox: {
    background: 'rgba(10, 8, 12, 0.75)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '22px',
    textAlign: 'left',
  },
  intelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
    paddingBottom: '6px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
  },
  intelTag: {
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    fontSize: '10px',
    fontWeight: 700,
    color: '#f87171',
    letterSpacing: '0.05em',
  },
  intelRisk: {
    fontSize: '9.5px',
    fontWeight: 700,
    color: '#ef4444',
    letterSpacing: '0.04em',
    background: 'rgba(239, 68, 68, 0.15)',
    padding: '1px 6px',
    borderRadius: '4px',
  },
  reasonsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  reasonItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    fontSize: '12px',
    color: '#e2e8f0',
    lineHeight: 1.45,
  },
  reasonBullet: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#ef4444',
    flexShrink: 0,
    marginTop: '5px',
    boxShadow: '0 0 6px rgba(239, 68, 68, 0.8)',
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  primaryBtn: {
    borderRadius: '10px',
    padding: '12px 20px',
    fontSize: '13.5px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
    color: '#ffffff',
    border: 'none',
    boxShadow: '0 4px 18px rgba(239, 68, 68, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
    outline: 'none',
  },
  secondaryBtn: {
    borderRadius: '10px',
    padding: '9px 16px',
    fontSize: '12.5px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    background: 'rgba(255, 255, 255, 0.04)',
    color: '#94a3b8',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    outline: 'none',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '18px',
    fontSize: '10.5px',
    color: '#64748b',
    letterSpacing: '0.01em',
  },
};
