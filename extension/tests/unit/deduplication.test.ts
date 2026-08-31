import { describe, expect, it, vi } from 'vitest';
import { RequestDeduplicator } from '../../src/shared/utils/deduplication.ts';

describe('Request Deduplication and Caching Engine', () => {
  it('should deduplicate simultaneous in-flight requests for the same key', async () => {
    const deduplicator = new RequestDeduplicator<string>();
    const factory = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 20));
      return 'analysis_result';
    });

    const [res1, res2, res3] = await Promise.all([
      deduplicator.deduplicate('https://example.com', factory),
      deduplicator.deduplicate('https://example.com', factory),
      deduplicator.deduplicate('https://example.com', factory),
    ]);

    expect(res1).toBe('analysis_result');
    expect(res2).toBe('analysis_result');
    expect(res3).toBe('analysis_result');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('should return cached result on subsequent calls', async () => {
    const deduplicator = new RequestDeduplicator<string>();
    const factory = vi.fn(async () => 'cached_result');

    const first = await deduplicator.deduplicate('https://example.com', factory);
    const second = await deduplicator.deduplicate('https://example.com', factory);

    expect(first).toBe('cached_result');
    expect(second).toBe('cached_result');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('should abort in-flight requests when cancel is invoked', async () => {
    const deduplicator = new RequestDeduplicator<string>();
    let wasAborted = false;

    const promise = deduplicator.deduplicate('https://slow-site.com', async (signal) => {
      return new Promise<string>((resolve, reject) => {
        const timer = setTimeout(() => resolve('done'), 1000);
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          wasAborted = true;
          reject(new Error('aborted'));
        });
      });
    });

    // Cancel after 10ms
    setTimeout(() => deduplicator.cancel('https://slow-site.com'), 10);

    await expect(promise).rejects.toThrow('aborted');
    expect(wasAborted).toBe(true);
  });
});
