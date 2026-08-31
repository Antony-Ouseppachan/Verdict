import { MAX_HISTORY_ITEMS, STORAGE_KEYS } from '../shared/constants/index.ts';
import type { ProtectionEventItem, ProtectionStats } from '../shared/types/decision.ts';
import { storage } from './storage.ts';

const DEFAULT_STATS: ProtectionStats = {
  sitesChecked: 0,
  warningsIssued: 0,
  threatsPrevented: 0,
  lastAnalysisTimestamp: undefined,
};

export async function getHistory(): Promise<ProtectionEventItem[]> {
  const events = await storage.get<ProtectionEventItem[]>(STORAGE_KEYS.HISTORY, []);
  return events;
}

export async function addHistoryEvent(
  item: Omit<ProtectionEventItem, 'id'>
): Promise<ProtectionEventItem> {
  const currentHistory = await getHistory();
  
  const newEvent: ProtectionEventItem = {
    ...item,
    id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  };

  // Prepend new event and cap at MAX_HISTORY_ITEMS
  const updatedHistory = [newEvent, ...currentHistory].slice(0, MAX_HISTORY_ITEMS);
  await storage.set(STORAGE_KEYS.HISTORY, updatedHistory);

  return newEvent;
}

export async function clearHistory(): Promise<void> {
  await storage.set(STORAGE_KEYS.HISTORY, []);
}

export async function getStats(): Promise<ProtectionStats> {
  const stats = await storage.get<ProtectionStats>(STORAGE_KEYS.STATS, DEFAULT_STATS);
  return stats;
}

export async function updateStats(
  status: 'SAFE' | 'CAUTION' | 'DANGER'
): Promise<ProtectionStats> {
  const current = await getStats();

  const updated: ProtectionStats = {
    sitesChecked: current.sitesChecked + 1,
    warningsIssued: status === 'CAUTION' ? current.warningsIssued + 1 : current.warningsIssued,
    threatsPrevented: status === 'DANGER' ? current.threatsPrevented + 1 : current.threatsPrevented,
    lastAnalysisTimestamp: Date.now(),
  };

  await storage.set(STORAGE_KEYS.STATS, updated);
  return updated;
}

export function onHistoryChanged(callback: (events: ProtectionEventItem[]) => void): () => void {
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) {
    return () => {};
  }

  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName === 'local' && changes[STORAGE_KEYS.HISTORY]) {
      const newValue = changes[STORAGE_KEYS.HISTORY].newValue;
      if (Array.isArray(newValue)) {
        callback(newValue as ProtectionEventItem[]);
      }
    }
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}

export function onStatsChanged(callback: (stats: ProtectionStats) => void): () => void {
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) {
    return () => {};
  }

  const listener = (
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: string
  ) => {
    if (areaName === 'local' && changes[STORAGE_KEYS.STATS]) {
      const newValue = changes[STORAGE_KEYS.STATS].newValue;
      if (newValue && typeof newValue === 'object') {
        callback(newValue as ProtectionStats);
      }
    }
  };

  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
}
