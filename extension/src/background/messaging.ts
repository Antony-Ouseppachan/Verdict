import { ExtensionMessageSchema } from '../security/validation.ts';
import type { ExtensionMessage } from '../shared/types/messages.ts';
import { clearHistory } from '../storage/history.ts';
import {
  getProtectionState,
  setProtectionState,
} from '../storage/protectionState.ts';
import {
  getOverlayState,
  setOverlayState,
} from '../storage/overlayState.ts';
import { updateExtensionBadge } from './lifecycle.ts';
import { protectionCoordinator } from './protection.ts';

export function registerMessageHandlers(): void {
  if (typeof chrome === 'undefined' || !chrome.runtime?.onMessage) {
    return;
  }

  chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
    const parseResult = ExtensionMessageSchema.safeParse(message);
    if (!parseResult.success) {
      sendResponse({ success: false, error: 'Invalid message structure' });
      return false;
    }

    const msg = parseResult.data as ExtensionMessage;
    const tabId = sender.tab?.id;

    switch (msg.type) {
      case 'SIGNALS_COLLECTED': {
        if (tabId !== undefined) {
          protectionCoordinator
            .analyzeSignals(tabId, msg.payload.signals)
            .then((decision) => {
              sendResponse({ success: true, data: decision });
            })
            .catch((err) => {
              sendResponse({ success: false, error: String(err) });
            });
          return true; // Keep message channel open for async response
        }
        sendResponse({ success: false, error: 'Missing tab ID' });
        return false;
      }

      case 'GET_PROTECTION_STATE': {
        getProtectionState()
          .then((enabled) => sendResponse({ success: true, data: { enabled } }))
          .catch((err) => sendResponse({ success: false, error: String(err) }));
        return true;
      }

      case 'SET_PROTECTION_STATE': {
        const { enabled } = msg.payload;
        setProtectionState(enabled)
          .then(() => {
            updateExtensionBadge(enabled);
            sendResponse({ success: true, data: { enabled } });
          })
          .catch((err) => sendResponse({ success: false, error: String(err) }));
        return true;
      }

      case 'GET_OVERLAY_STATE': {
        getOverlayState()
          .then((enabled) => sendResponse({ success: true, data: { enabled } }))
          .catch((err) => sendResponse({ success: false, error: String(err) }));
        return true;
      }

      case 'SET_OVERLAY_STATE': {
        const { enabled } = msg.payload;
        setOverlayState(enabled)
          .then(() => sendResponse({ success: true, data: { enabled } }))
          .catch((err) => sendResponse({ success: false, error: String(err) }));
        return true;
      }

      case 'GET_CURRENT_DECISION': {
        const queryTabId = msg.payload?.tabId ?? tabId;
        if (queryTabId !== undefined) {
          const decision = protectionCoordinator.getActiveDecision(queryTabId);
          sendResponse({ success: true, data: decision });
        } else {
          sendResponse({ success: true, data: null });
        }
        return false;
      }

      case 'GET_ACTIVE_TAB_INFO': {
        protectionCoordinator
          .getActiveTabInfo()
          .then((tabInfo) => sendResponse({ success: true, data: tabInfo }))
          .catch((err) => sendResponse({ success: false, error: String(err) }));
        return true;
      }

      case 'GET_DASHBOARD_DATA': {
        protectionCoordinator
          .getDashboardData()
          .then((data) => sendResponse({ success: true, data }))
          .catch((err) => sendResponse({ success: false, error: String(err) }));
        return true;
      }

      case 'CLEAR_HISTORY': {
        clearHistory()
          .then(() => sendResponse({ success: true }))
          .catch((err) => sendResponse({ success: false, error: String(err) }));
        return true;
      }

      case 'DISMISS_WARNING': {
        protectionCoordinator.dismissWarning(msg.payload?.decisionId);
        sendResponse({ success: true });
        return false;
      }

      case 'ALLOW_BYPASS': {
        protectionCoordinator.allowBypassUrl(msg.payload.url, tabId);
        if (msg.payload.decisionId) {
          protectionCoordinator.dismissWarning(msg.payload.decisionId);
        }
        sendResponse({ success: true });
        return false;
      }

      case 'CHECK_BYPASS': {
        const isBypassed = protectionCoordinator.isBypassed(msg.payload.url, tabId);
        sendResponse({ success: true, data: { isBypassed } });
        return false;
      }

      case 'CLEAR_BYPASS': {
        protectionCoordinator.clearBypass(msg.payload.url, tabId);
        sendResponse({ success: true });
        return false;
      }

      case 'NAVIGATE_BACK': {
        if (tabId !== undefined && typeof chrome !== 'undefined' && chrome.tabs) {
          try {
            chrome.tabs
              .goBack(tabId)
              .catch(() => {
                try {
                  chrome.tabs.remove(tabId).catch(() => {});
                } catch {
                  // ignore
                }
              });
          } catch {
            try {
              chrome.tabs.remove(tabId).catch(() => {});
            } catch {
              // ignore
            }
          }
        }
        sendResponse({ success: true });
        return false;
      }

      default:
        sendResponse({ success: false, error: 'Unhandled message type' });
        return false;
    }
  });
}
