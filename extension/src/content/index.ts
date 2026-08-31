import { collectAllSignals } from '../collectors/collector.ts';
import { sanitizeSignals } from '../collectors/normalization.ts';
import { isValidBrowsingUrl } from '../security/url.ts';
import { ExtensionMessageSchema } from '../security/validation.ts';
import type { ExtensionMessage } from '../shared/types/messages.ts';
import type { VerdictDecision } from '../shared/types/decision.ts';
import { logger } from '../shared/utils/logger.ts';
import { sendToBackground } from './messaging.ts';
import { WarningOverlayManager } from './warning/WarningOverlay.ts';

const warningManager = new WarningOverlayManager();
let overlayEnabled = true;

function handleTakeMeBack(): void {
  sendToBackground({ type: 'NAVIGATE_BACK' });
  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.href = 'about:blank';
  }
}

function handleDismissWarning(decisionId?: string): void {
  sendToBackground({
    type: 'DISMISS_WARNING',
    payload: { decisionId },
  });
}

function handleDisplayDecision(decision: VerdictDecision): void {
  // If overlay is disabled, only show critical DANGER interventions
  if (!overlayEnabled && decision.status !== 'DANGER') {
    warningManager.removeWarning();
    return;
  }

  warningManager.showResult(
    decision,
    () => handleTakeMeBack(),
    () => handleDismissWarning(decision.decisionId)
  );
}

async function processAndSendSignals(): Promise<void> {
  if (!isValidBrowsingUrl(window.location.href)) {
    return;
  }

  try {
    const rawSignals = collectAllSignals(document, window);
    const sanitized = sanitizeSignals(rawSignals);

    const response = await sendToBackground<VerdictDecision>({
      type: 'SIGNALS_COLLECTED',
      payload: { signals: sanitized },
    });

    if (response && response.success && response.data) {
      handleDisplayDecision(response.data);
    }
  } catch (error) {
    logger.error('Failed to collect and sanitize signals in content script', error);
  }
}

function setupMessageListeners(): void {
  if (typeof chrome === 'undefined' || !chrome.runtime?.onMessage) {
    return;
  }

  chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    const parseResult = ExtensionMessageSchema.safeParse(message);
    if (!parseResult.success) {
      sendResponse({ success: false, error: 'Invalid message structure' });
      return false;
    }

    const msg = parseResult.data as ExtensionMessage;

    if (msg.type === 'COLLECT_SIGNALS') {
      processAndSendSignals();
      sendResponse({ success: true });
      return false;
    }

    if (msg.type === 'SHOW_DECISION') {
      handleDisplayDecision(msg.payload.decision);
      sendResponse({ success: true });
      return false;
    }

    if (msg.type === 'SET_OVERLAY_STATE') {
      overlayEnabled = msg.payload.enabled;
      if (!overlayEnabled) {
        warningManager.removeWarning();
      }
      sendResponse({ success: true });
      return false;
    }

    return false;
  });
}

async function initialize(): Promise<void> {
  // Only execute on top window
  if (window.top !== window.self) {
    return;
  }

  if (!isValidBrowsingUrl(window.location.href)) {
    return;
  }

  setupMessageListeners();

  // Instant zero-lag scanning pill display
  warningManager.showScanning();

  // Concurrently verify protection & overlay status from background
  try {
    const [protectionRes, overlayRes] = await Promise.all([
      sendToBackground<{ enabled: boolean }>({ type: 'GET_PROTECTION_STATE' }),
      sendToBackground<{ enabled: boolean }>({ type: 'GET_OVERLAY_STATE' }),
    ]);

    const isProtectionEnabled = protectionRes?.data?.enabled ?? true;
    overlayEnabled = overlayRes?.data?.enabled ?? true;

    if (!isProtectionEnabled || !overlayEnabled) {
      warningManager.removeWarning();
    }
  } catch (err: unknown) {
    logger.debug('Error checking initial states, continuing default scan', {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  // Autonomous observation after document is idle
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    processAndSendSignals();
  } else {
    window.addEventListener('DOMContentLoaded', () => processAndSendSignals(), { once: true });
  }
}

initialize();
