import { STORAGE_KEYS } from '../shared/constants/index.ts';
import { storage } from './storage.ts';

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4 UUID
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getOrCreateDeviceId(): Promise<string> {
  let deviceId = await storage.get<string | null>(STORAGE_KEYS.DEVICE_ID, null);
  if (!deviceId) {
    deviceId = generateUUID();
    await storage.set<string>(STORAGE_KEYS.DEVICE_ID, deviceId);
  }
  return deviceId;
}
