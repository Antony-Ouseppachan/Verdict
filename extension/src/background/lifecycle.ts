import { getOrCreateDeviceId } from '../storage/device.ts';
import { getProtectionState, setProtectionState } from '../storage/protectionState.ts';
import { logger } from '../shared/utils/logger.ts';

export async function initializeLifecycle(): Promise<void> {
  // Ensure default protection state (ON by default)
  const currentState = await getProtectionState();
  if (currentState === undefined) {
    await setProtectionState(true);
  }

  // Provision anonymous device identity
  const deviceId = await getOrCreateDeviceId();
  logger.info('Verdict autonomous agent initialized', { deviceId });

  // Update extension action badge appearance
  updateExtensionBadge(currentState);
}

export function updateExtensionBadge(enabled: boolean, status?: 'SAFE' | 'CAUTION' | 'DANGER'): void {
  if (typeof chrome === 'undefined' || !chrome.action) {
    return;
  }

  if (!enabled) {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#64748b' }); // Slate gray
    return;
  }

  if (status === 'DANGER') {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444' }); // Red
  } else if (status === 'CAUTION') {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' }); // Amber
  } else if (status === 'SAFE') {
    chrome.action.setBadgeText({ text: 'OK' });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' }); // Emerald Green
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}
