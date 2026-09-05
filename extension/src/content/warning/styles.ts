export const WARNING_STYLES = `
  :host {
    all: initial !important;
    display: block !important;
    position: fixed !important;
    top: 0 !important;
    right: 0 !important;
    width: 0 !important;
    height: 0 !important;
    overflow: visible !important;
    z-index: 2147483647 !important;
    pointer-events: none !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
    color: #e4e4e7 !important;
    font-size: 12px !important;
    line-height: 1 !important;
    -webkit-font-smoothing: antialiased !important;
  }

  *, *::before, *::after {
    box-sizing: border-box !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* 28px comfortable indicator with hover & proximity ghosting */
  .verdict-floating-pill,
  .verdict-floating-pill * {
    pointer-events: none !important;
    user-select: none !important;
    -webkit-user-select: none !important;
  }

  .verdict-floating-pill {
    position: fixed !important;
    top: 12px !important;
    right: 14px !important;
    z-index: 2147483647 !important;
    width: auto !important;
    height: 28px !important;
    background: #18181b !important;
    border: 1px solid #27272a !important;
    border-radius: 6px !important;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4) !important;
    padding: 0 10px !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 7px !important;
    animation: verdictToastIn 0.15s ease-out !important;
    transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }

  /* Proximity evasion: vanishes completely when mouse pointer gets nearby so buttons underneath are accessible */
  .verdict-floating-pill.is-evading,
  .verdict-floating-pill.status-safe.is-evading,
  .verdict-floating-pill.status-danger.is-evading,
  .verdict-floating-pill.status-caution.is-evading,
  .verdict-floating-pill.status-scanning.is-evading {
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
    transform: translateY(-8px) scale(0.9) !important;
    transition: opacity 0.12s ease-out, visibility 0.12s ease-out, transform 0.12s ease-out !important;
  }

  /* Persistent Safe Badge - Always remains visible */
  .verdict-floating-pill.status-safe {
    background: #141a24 !important;
    border-color: rgba(34, 197, 94, 0.35) !important;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5), 0 0 8px rgba(34, 197, 94, 0.15) !important;
  }

  /* Persistent Unsafe Badge - Red theme with caution alert */
  .verdict-floating-pill.status-danger {
    background: #1a0808 !important;
    border-color: rgba(239, 68, 68, 0.65) !important;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6), 0 0 10px rgba(239, 68, 68, 0.3) !important;
    opacity: 1 !important;
  }

  .verdict-floating-pill.status-danger .danger-text {
    color: #ef4444 !important;
    font-weight: 700 !important;
  }

  .verdict-floating-pill:hover {
    border-color: rgba(34, 197, 94, 0.5) !important;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.6), 0 0 12px rgba(34, 197, 94, 0.25) !important;
    transform: translateY(-1px) scale(1.02) !important;
  }

  .verdict-floating-pill.status-danger:hover {
    border-color: rgba(239, 68, 68, 0.9) !important;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.7), 0 0 16px rgba(239, 68, 68, 0.5) !important;
  }

  .verdict-floating-pill.status-caution {
    height: auto !important;
    min-height: 32px !important;
    padding: 6px 10px !important;
    border-color: #78350f !important;
    background: #1c1917 !important;
  }

  /* Vector icon container */
  .verdict-pill-icon {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-shrink: 0 !important;
  }

  .verdict-pill-icon.scanning {
    color: #a1a1aa !important;
  }

  .verdict-pill-icon.safe {
    color: #22c55e !important;
  }

  .verdict-pill-icon.caution {
    color: #f59e0b !important;
  }

  .verdict-pill-icon.danger {
    color: #ef4444 !important;
  }

  /* Micro text */
  .verdict-pill-text {
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
    white-space: nowrap !important;
    color: #f4f4f5 !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    letter-spacing: -0.01em !important;
  }

  .verdict-pill-title {
    font-weight: 600 !important;
    color: #ffffff !important;
  }

  .verdict-pill-subtitle {
    color: #a1a1aa !important;
    font-weight: 400 !important;
  }

  /* Dismiss Button */
  .verdict-pill-close {
    background: transparent !important;
    border: none !important;
    color: #71717a !important;
    cursor: pointer !important;
    padding: 2px !important;
    border-radius: 3px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: color 0.12s ease !important;
    margin-left: 2px !important;
    pointer-events: auto !important;
  }

  .verdict-pill-close:hover {
    color: #f4f4f5 !important;
  }

  /* Danger Security Warning Firewall Backdrop & Atmosphere */
  .verdict-danger-backdrop {
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: radial-gradient(circle at 50% 32%, #22080d 0%, #0f0a0e 55%, #050406 100%) !important;
    backdrop-filter: blur(30px) saturate(200%) !important;
    -webkit-backdrop-filter: blur(30px) saturate(200%) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 24px 16px !important;
    pointer-events: auto !important;
    animation: verdictFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
    z-index: 2147483647 !important;
    overflow-y: auto !important;
    box-sizing: border-box !important;
  }

  .verdict-danger-backdrop::before {
    content: '' !important;
    position: absolute !important;
    inset: 0 !important;
    background-image: 
      linear-gradient(rgba(239, 68, 68, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(239, 68, 68, 0.04) 1px, transparent 1px) !important;
    background-size: 32px 32px !important;
    pointer-events: none !important;
    opacity: 0.8 !important;
  }

  .verdict-danger-card {
    position: relative !important;
    background: linear-gradient(165deg, rgba(24, 16, 20, 0.95) 0%, rgba(13, 11, 15, 0.98) 100%) !important;
    border: 1px solid rgba(239, 68, 68, 0.45) !important;
    border-top: 1px solid rgba(248, 113, 113, 0.75) !important;
    border-radius: 16px !important;
    width: min(520px, 94vw) !important;
    padding: 32px 28px 24px !important;
    box-shadow: 
      0 28px 70px -10px rgba(0, 0, 0, 0.9),
      0 0 50px -10px rgba(239, 68, 68, 0.3),
      inset 0 1px 1px rgba(255, 255, 255, 0.15) !important;
    text-align: center !important;
    pointer-events: auto !important;
    animation: verdictCardPop 0.32s cubic-bezier(0.16, 1, 0.3, 1) !important;
    box-sizing: border-box !important;
    z-index: 2 !important;
  }

  /* Shield & Radar Pulse Header */
  .verdict-danger-header {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    margin-bottom: 20px !important;
    gap: 12px !important;
  }

  .verdict-danger-shield-wrapper {
    position: relative !important;
    width: 64px !important;
    height: 64px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .verdict-danger-shield-pulse {
    position: absolute !important;
    inset: -6px !important;
    border-radius: 50% !important;
    background: rgba(239, 68, 68, 0.22) !important;
    animation: verdictRadarPulse 2.2s ease-out infinite !important;
  }

  .verdict-danger-shield-icon {
    position: relative !important;
    width: 58px !important;
    height: 58px !important;
    border-radius: 16px !important;
    background: linear-gradient(145deg, rgba(239, 68, 68, 0.2) 0%, rgba(153, 27, 27, 0.35) 100%) !important;
    border: 1px solid rgba(239, 68, 68, 0.5) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: #ef4444 !important;
    box-shadow: 0 0 24px rgba(239, 68, 68, 0.4), inset 0 0 12px rgba(239, 68, 68, 0.25) !important;
  }

  /* Explicit Payment Hazard Callout */
  .verdict-danger-payment-warning {
    display: flex !important;
    align-items: flex-start !important;
    gap: 12px !important;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(185, 28, 28, 0.28) 100%) !important;
    border: 1px solid rgba(239, 68, 68, 0.65) !important;
    border-radius: 10px !important;
    padding: 12px 14px !important;
    margin-bottom: 18px !important;
    text-align: left !important;
    box-shadow: 0 4px 14px rgba(239, 68, 68, 0.15) !important;
  }

  .verdict-payment-warning-icon {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: #ef4444 !important;
    flex-shrink: 0 !important;
    margin-top: 1px !important;
  }

  .verdict-payment-warning-content {
    display: flex !important;
    flex-direction: column !important;
    gap: 3px !important;
  }

  .verdict-payment-warning-title {
    font-size: 11px !important;
    font-weight: 800 !important;
    color: #fca5a5 !important;
    letter-spacing: 0.05em !important;
    text-transform: uppercase !important;
  }

  .verdict-payment-warning-text {
    font-size: 12px !important;
    color: #ffffff !important;
    font-weight: 600 !important;
    line-height: 1.4 !important;
  }

  .verdict-danger-badge-dot {
    width: 7px !important;
    height: 7px !important;
    border-radius: 50% !important;
    background: #ef4444 !important;
    box-shadow: 0 0 8px #ef4444 !important;
    animation: verdictBlink 1.4s ease-in-out infinite !important;
  }

  .verdict-danger-badge-text {
    font-size: 11px !important;
    font-weight: 700 !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
    color: #fca5a5 !important;
  }

  /* Typography */
  .verdict-danger-title {
    font-size: 22px !important;
    font-weight: 700 !important;
    color: #ffffff !important;
    letter-spacing: -0.02em !important;
    line-height: 1.25 !important;
    margin-bottom: 8px !important;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6) !important;
  }

  .verdict-danger-desc {
    font-size: 13.5px !important;
    color: #cbd5e1 !important;
    line-height: 1.55 !important;
    max-width: 440px !important;
    margin: 0 auto 16px !important;
    font-weight: 400 !important;
  }

  /* Intercepted Target Domain Pill */
  .verdict-danger-target-pill {
    display: inline-flex !important;
    align-items: center !important;
    gap: 8px !important;
    padding: 6px 14px !important;
    background: rgba(0, 0, 0, 0.5) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 8px !important;
    margin-bottom: 18px !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  .verdict-target-domain {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 12px !important;
    color: #f1f5f9 !important;
    font-weight: 500 !important;
    max-width: 280px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  .verdict-target-status {
    font-size: 9.5px !important;
    font-weight: 700 !important;
    padding: 2px 6px !important;
    border-radius: 4px !important;
    background: rgba(239, 68, 68, 0.25) !important;
    color: #fca5a5 !important;
    letter-spacing: 0.04em !important;
  }

  /* Threat Intelligence Panel */
  .verdict-danger-intel-box {
    background: rgba(10, 8, 12, 0.75) !important;
    border: 1px solid rgba(239, 68, 68, 0.25) !important;
    border-radius: 10px !important;
    padding: 12px 14px !important;
    margin-bottom: 22px !important;
    text-align: left !important;
  }

  .verdict-intel-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    margin-bottom: 8px !important;
    padding-bottom: 6px !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
  }

  .verdict-intel-tag {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 10px !important;
    font-weight: 700 !important;
    color: #f87171 !important;
    letter-spacing: 0.05em !important;
  }

  .verdict-intel-risk-level {
    font-size: 9.5px !important;
    font-weight: 700 !important;
    color: #ef4444 !important;
    letter-spacing: 0.04em !important;
    background: rgba(239, 68, 68, 0.15) !important;
    padding: 1px 6px !important;
    border-radius: 4px !important;
  }

  .verdict-danger-reasons {
    display: flex !important;
    flex-direction: column !important;
    gap: 6px !important;
  }

  .verdict-danger-reason-item {
    display: flex !important;
    align-items: flex-start !important;
    gap: 8px !important;
    font-size: 12px !important;
    color: #e2e8f0 !important;
    line-height: 1.45 !important;
  }

  .verdict-reason-bullet {
    width: 6px !important;
    height: 6px !important;
    border-radius: 50% !important;
    background: #ef4444 !important;
    flex-shrink: 0 !important;
    margin-top: 5px !important;
    box-shadow: 0 0 6px rgba(239, 68, 68, 0.8) !important;
  }

  /* Actions Layout */
  .verdict-danger-actions {
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
  }

  .verdict-btn {
    position: relative !important;
    border-radius: 10px !important;
    padding: 12px 20px !important;
    font-size: 13.5px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 8px !important;
    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
    border: none !important;
    outline: none !important;
    pointer-events: auto !important;
    user-select: none !important;
    -webkit-user-select: none !important;
  }

  .verdict-btn-primary {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%) !important;
    color: #ffffff !important;
    box-shadow: 0 4px 18px rgba(239, 68, 68, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25) !important;
  }

  .verdict-btn-primary:hover {
    background: linear-gradient(135deg, #f87171 0%, #ef4444 50%, #dc2626 100%) !important;
    box-shadow: 0 6px 24px rgba(239, 68, 68, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.35) !important;
    transform: translateY(-1.5px) !important;
  }

  .verdict-btn-primary:active {
    transform: translateY(0.5px) !important;
    box-shadow: 0 2px 10px rgba(239, 68, 68, 0.4) !important;
  }

  .verdict-btn-primary:focus-visible {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.5), 0 0 0 1px #ffffff !important;
  }

  .verdict-btn-secondary {
    background: rgba(255, 255, 255, 0.04) !important;
    color: #94a3b8 !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    font-size: 12.5px !important;
    font-weight: 500 !important;
    padding: 9px 16px !important;
  }

  .verdict-btn-secondary:hover {
    background: rgba(255, 255, 255, 0.08) !important;
    color: #f1f5f9 !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
  }

  .verdict-btn-secondary:active {
    background: rgba(255, 255, 255, 0.03) !important;
  }

  /* Footer Note */
  .verdict-danger-footer {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px !important;
    margin-top: 18px !important;
    font-size: 10.5px !important;
    color: #64748b !important;
    letter-spacing: 0.01em !important;
  }

  @keyframes verdictToastIn {
    from {
      opacity: 0;
      transform: translateY(-3px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes verdictFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes verdictCardPop {
    from {
      opacity: 0;
      transform: translateY(14px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes verdictRadarPulse {
    0% {
      transform: scale(0.9);
      opacity: 0.8;
    }
    50% {
      transform: scale(1.35);
      opacity: 0;
    }
    100% {
      transform: scale(1.35);
      opacity: 0;
    }
  }

  @keyframes verdictBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }

  @keyframes verdictSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .verdict-spinner {
    animation: verdictSpin 0.85s linear infinite !important;
  }

  @media (prefers-reduced-motion: reduce) {
    .verdict-floating-pill,
    .verdict-danger-backdrop,
    .verdict-danger-card,
    .verdict-danger-shield-pulse,
    .verdict-danger-badge-dot,
    .verdict-spinner {
      animation: none !important;
      transition: none !important;
    }
  }
`;
