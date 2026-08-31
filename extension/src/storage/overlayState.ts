import { storage } from './storage.ts';

const OVERLAY_STATE_KEY = 'verdict_overlay_enabled';
const DEFAULT_OVERLAY_ENABLED = true;

export async function getOverlayState(): Promise<boolean> {
  return await storage.get<boolean>(
    OVERLAY_STATE_KEY,
    DEFAULT_OVERLAY_ENABLED
  );
}

export async function setOverlayState(enabled: boolean): Promise<void> {
  await storage.set<boolean>(OVERLAY_STATE_KEY, enabled);
}

export function onOverlayStateChanged(callback: (enabled: boolean) => void): () => void {
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) {
    return () => {};
  }

  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName === 'local' && changes[OVERLAY_STATE_KEY]) {
      const newValue = changes[OVERLAY_STATE_KEY].newValue;
      if (typeof newValue === 'boolean') {
        callback(newValue);
      }
    }
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
