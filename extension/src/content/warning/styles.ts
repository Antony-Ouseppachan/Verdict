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
    transition: opacity 0.15s ease, transform 0.15s ease !important;
  }

  /* Persistent Safe Badge - Always remains visible */
  .verdict-floating-pill.status-safe {
    background: #141a24 !important;
    border-color: rgba(34, 197, 94, 0.35) !important;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5), 0 0 8px rgba(34, 197, 94, 0.15) !important;
    opacity: 1 !important;
  }

  .verdict-floating-pill:hover {
    border-color: rgba(34, 197, 94, 0.5) !important;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.6), 0 0 12px rgba(34, 197, 94, 0.25) !important;
    transform: translateY(-1px) scale(1.02) !important;
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

  /* Danger Security Warning Card */
  .verdict-danger-backdrop {
    position: fixed !important;
    inset: 0 !important;
    background: rgba(9, 9, 11, 0.85) !important;
    backdrop-filter: blur(8px) !important;
    -webkit-backdrop-filter: blur(8px) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 20px !important;
    pointer-events: auto !important;
    animation: verdictFadeIn 0.15s ease-out !important;
    z-index: 2147483647 !important;
  }

  .verdict-danger-card {
    background: #18181b !important;
    border: 1px solid #3f3f46 !important;
    border-radius: 8px !important;
    width: min(400px, 100%) !important;
    padding: 24px 20px !important;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6) !important;
    text-align: center !important;
    pointer-events: auto !important;
  }

  .verdict-danger-icon {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 40px !important;
    height: 40px !important;
    border-radius: 6px !important;
    background: rgba(239, 68, 68, 0.12) !important;
    color: #ef4444 !important;
    margin-bottom: 12px !important;
  }

  .verdict-danger-title {
    font-size: 15px !important;
    font-weight: 600 !important;
    color: #fafafa !important;
    letter-spacing: -0.01em !important;
  }

  .verdict-danger-desc {
    font-size: 12px !important;
    color: #a1a1aa !important;
    margin-top: 6px !important;
    line-height: 1.45 !important;
  }

  .verdict-danger-actions {
    margin-top: 20px !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 8px !important;
  }

  .verdict-btn {
    border-radius: 5px !important;
    padding: 8px 14px !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    cursor: pointer !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px !important;
    transition: all 0.12s ease !important;
    border: none !important;
    pointer-events: auto !important;
  }

  .verdict-btn-primary {
    background: #ef4444 !important;
    color: #ffffff !important;
  }

  .verdict-btn-primary:hover {
    background: #dc2626 !important;
  }

  .verdict-btn-secondary {
    background: transparent !important;
    color: #a1a1aa !important;
    border: 1px solid #3f3f46 !important;
  }

  .verdict-btn-secondary:hover {
    background: rgba(255, 255, 255, 0.04) !important;
    color: #f4f4f5 !important;
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
    .verdict-spinner {
      animation: none !important;
      transition: none !important;
    }
  }
`;
