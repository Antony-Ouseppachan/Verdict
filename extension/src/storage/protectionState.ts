import { DEFAULT_PROTECTION_ENABLED, STORAGE_KEYS } from '../shared/constants/index.ts';
import { storage } from './storage.ts';

export async function getProtectionState(): Promise<boolean> {
  return await storage.get<boolean>(
    STORAGE_KEYS.PROTECTION_ENABLED,
    DEFAULT_PROTECTION_ENABLED
  );
}

export async function setProtectionState(enabled: boolean): Promise<void> {
  await storage.set<boolean>(STORAGE_KEYS.PROTECTION_ENABLED, enabled);
}

export function onProtectionStateChanged(callback: (enabled: boolean) => void): () => void {
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) {
    return () => {};
  }

  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName === 'local' && changes[STORAGE_KEYS.PROTECTION_ENABLED]) {
      const newValue = changes[STORAGE_KEYS.PROTECTION_ENABLED].newValue;
      if (typeof newValue === 'boolean') {
        callback(newValue);
      }
    }
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
