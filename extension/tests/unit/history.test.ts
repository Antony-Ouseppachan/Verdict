import { describe, expect, it, beforeEach } from 'vitest';
import {
  addHistoryEvent,
  clearHistory,
  getHistory,
  getStats,
  updateStats,
} from '../../src/storage/history.ts';
import { storage } from '../../src/storage/storage.ts';

describe('Verdict Protection History Storage', () => {
  beforeEach(async () => {
    await storage.clear();
  });

  it('should return empty list when no history exists', async () => {
    const history = await getHistory();
    expect(history).toEqual([]);
  });

  it('should add history events in reverse chronological order', async () => {
    await addHistoryEvent({
      url: 'https://site-a.com',
      hostname: 'site-a.com',
      timestamp: 1000,
      status: 'SAFE',
      title: 'Looks good',
      message: 'No concerns detected.',
      action: 'NONE',
      actionTaken: 'Allowed',
    });

    await addHistoryEvent({
      url: 'https://site-b.com',
      hostname: 'site-b.com',
      timestamp: 2000,
      status: 'DANGER',
      title: "Don't pay here",
      message: 'Fake shop detected.',
      action: 'GO_BACK',
      actionTaken: 'Blocked',
    });

    const history = await getHistory();
    expect(history.length).toBe(2);
    expect(history[0].hostname).toBe('site-b.com');
    expect(history[0].status).toBe('DANGER');
    expect(history[1].hostname).toBe('site-a.com');
  });

  it('should clear history cleanly', async () => {
    await addHistoryEvent({
      url: 'https://test.com',
      hostname: 'test.com',
      timestamp: Date.now(),
      status: 'SAFE',
      title: 'Safe',
      message: 'Safe',
      action: 'NONE',
      actionTaken: 'Allowed',
    });

    await clearHistory();
    const history = await getHistory();
    expect(history).toEqual([]);
  });

  it('should update and retrieve protection statistics correctly', async () => {
    await updateStats('SAFE');
    await updateStats('CAUTION');
    await updateStats('DANGER');

    const stats = await getStats();
    expect(stats.sitesChecked).toBe(3);
    expect(stats.warningsIssued).toBe(1);
    expect(stats.threatsPrevented).toBe(1);
    expect(stats.lastAnalysisTimestamp).toBeDefined();
  });
});
