import type {
  ExtensionMessage,
  MessageResponse,
} from '../shared/types/messages.ts';
import { logger } from '../shared/utils/logger.ts';

export function sendToBackground<T = unknown>(
  message: ExtensionMessage
): Promise<MessageResponse<T>> {
  return new Promise((resolve) => {
    if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
      resolve({ success: false, error: 'Chrome runtime unavailable' });
      return;
    }

    try {
      chrome.runtime.sendMessage(message, (response: MessageResponse<T>) => {
        if (chrome.runtime.lastError) {
          logger.debug('Runtime message error:', { error: chrome.runtime.lastError.message });
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response || { success: true });
        }
      });
    } catch (err: unknown) {
      resolve({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  });
}
