import { collectAllSignals } from '../collectors/collector.ts';
import { sanitizeSignals } from '../collectors/normalization.ts';
import { classifyPage, isValidBrowsingUrl } from '../security/url.ts';
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

let isSessionOverridden = false;

function isRiskOverridden(): boolean {
  return isSessionOverridden;
}

function handleDismissWarning(decisionId?: string): void {
  isSessionOverridden = true;
  sendToBackground({
    type: 'ALLOW_BYPASS',
    payload: { url: window.location.href, decisionId },
  });
  sendToBackground({
    type: 'DISMISS_WARNING',
    payload: { decisionId },
  });
}

let currentDecision: VerdictDecision | null = null;

function setupFormSubmissionMonitoring(): void {
  document.addEventListener('submit', (e) => {
    const target = e.target as HTMLFormElement | null;
    if (!target || target.tagName !== 'FORM') {
      return;
    }

    const action = target.getAttribute('action') || window.location.href;
    const method = (target.getAttribute('method') || 'GET').toUpperCase();
    const hasCardInput = target.querySelector(
      'input[name*="card" i], input[name*="cvv" i], input[name*="cvc" i], input[autocomplete*="cc-" i], input[placeholder*="1234" i], input[placeholder*="•••" i]'
    ) !== null;

    const isNonHttpsAction = !action.startsWith('https:') && !window.location.protocol.startsWith('https:');

    console.log('[Verdict] Runtime form submit monitored:', {
      action,
      method,
      hasCardInput,
      isNonHttpsAction,
      currentDecisionStatus: currentDecision?.status,
      isOverridden: isRiskOverridden(),
    });

    if (hasCardInput && (isNonHttpsAction || (currentDecision?.status === 'DANGER' && !isRiskOverridden()))) {
      console.warn('[Verdict] Potentially dangerous payment form submission intercepted!', {
        action,
        method,
      });

      // If evaluated as DANGER and user has not overridden, block submission
      if (currentDecision?.status === 'DANGER' && !isRiskOverridden()) {
        e.preventDefault();
        e.stopPropagation();
        warningManager.showResult(
          currentDecision,
          () => handleTakeMeBack(),
          () => handleDismissWarning(currentDecision?.decisionId)
        );
      }
    }
  }, true);
}

function handleDisplayDecision(decision: VerdictDecision): void {
  currentDecision = decision;

  // If overlay is disabled, only show critical DANGER interventions
  if (!overlayEnabled && decision.status !== 'DANGER') {
    warningManager.removeWarning();
    return;
  }

  // If user has already consented/overridden this danger site, show persistent unsafe capsule directly
  if (decision.status === 'DANGER' && isRiskOverridden()) {
    warningManager.showPersistentUnsafePill(decision);
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

    console.log('[Verdict] Signals collected for analysis:', {
      url: window.location.href,
      payment: sanitized.payment,
      brand: sanitized.brand,
      formsCount: sanitized.forms.length,
    });

    const response = await sendToBackground<VerdictDecision>({
      type: 'SIGNALS_COLLECTED',
      payload: { signals: sanitized },
    });

    if (response && response.success && response.data) {
      console.log('[Verdict] Decision received from engine:', response.data);
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

  const pageType = classifyPage(window.location.href);
  if (pageType !== 'NORMAL_WEBSITE') {
    logger.debug('Page classification skipped from threat scanning', {
      url: window.location.href,
      pageType,
    });
    return;
  }

  console.log('[Verdict] Initializing safety analysis on:', window.location.href);
  setupMessageListeners();
  setupFormSubmissionMonitoring();

  // Instant zero-lag scanning pill display
  warningManager.showScanning();

  // Concurrently verify protection, overlay status & bypass state from background
  try {
    const [protectionRes, overlayRes, bypassRes] = await Promise.all([
      sendToBackground<{ enabled: boolean }>({ type: 'GET_PROTECTION_STATE' }),
      sendToBackground<{ enabled: boolean }>({ type: 'GET_OVERLAY_STATE' }),
      sendToBackground<{ isBypassed: boolean }>({
        type: 'CHECK_BYPASS',
        payload: { url: window.location.href },
      }),
    ]);

    const isProtectionEnabled = protectionRes?.data?.enabled ?? true;
    overlayEnabled = overlayRes?.data?.enabled ?? true;
    const isBypassed = bypassRes?.data?.isBypassed ?? false;

    if (isBypassed) {
      isSessionOverridden = true;
    }

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

