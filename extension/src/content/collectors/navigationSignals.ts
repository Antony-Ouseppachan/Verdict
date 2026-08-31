import type { NavigationSignals } from '../../shared/types/signals.ts';

export function collectNavigationSignals(
  doc: Document = document,
  win: Window = window
): NavigationSignals {
  const referrer = doc.referrer || '';
  const isIframe = win.self !== win.top;

  let frameDepth = 0;
  try {
    let currentWin = win;
    while (currentWin !== currentWin.parent && frameDepth < 10) {
      frameDepth++;
      currentWin = currentWin.parent;
    }
  } catch {
    // Cross-origin iframe restriction, frameDepth is at least 1
    frameDepth = Math.max(1, frameDepth);
  }

  const hasHistoryTransitions = Boolean(win.history && win.history.length > 1);

  return {
    referrer,
    isIframe,
    frameDepth,
    hasHistoryTransitions,
  };
}
