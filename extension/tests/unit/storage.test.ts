import { describe, expect, it } from 'vitest';
import { getOrCreateDeviceId } from '../../src/storage/device.ts';
import {
  getProtectionState,
  setProtectionState,
} from '../../src/storage/protectionState.ts';
import { storage } from '../../src/storage/storage.ts';

describe('Storage & Protection State', () => {
  it('should default protectionEnabled to true', async () => {
    const state = await getProtectionState();
    expect(state).toBe(true);
  });

  it('should toggle and persist protection state', async () => {
    await setProtectionState(false);
    let state = await getProtectionState();
    expect(state).toBe(false);

    await setProtectionState(true);
    state = await getProtectionState();
    expect(state).toBe(true);
  });

  it('should generate and persist device identity UUID', async () => {
    const id1 = await getOrCreateDeviceId();
    expect(id1).toBeDefined();
    expect(typeof id1).toBe('string');
    expect(id1.length).toBeGreaterThan(10);

    const id2 = await getOrCreateDeviceId();
    expect(id2).toBe(id1);
  });

  it('should handle general storage operations', async () => {
    await storage.set('test_key', { a: 1, b: 'two' });
    const res = await storage.get('test_key', null);
    expect(res).toEqual({ a: 1, b: 'two' });

    await storage.remove('test_key');
    const removed = await storage.get('test_key', 'fallback');
    expect(removed).toBe('fallback');
  });
});
