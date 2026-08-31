import { CACHE_TTL_MS } from '../constants/index.ts';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class RequestDeduplicator<T> {
  private inFlightRequests: Map<string, Promise<T>> = new Map();
  private cache: Map<string, CacheEntry<T>> = new Map();
  private activeControllers: Map<string, AbortController> = new Map();

  public getOrCreateController(key: string): AbortController {
    // Abort previous in-flight request for this specific key/tab if existing
    const existingController = this.activeControllers.get(key);
    if (existingController) {
      existingController.abort();
    }

    const newController = new AbortController();
    this.activeControllers.set(key, newController);
    return newController;
  }

  public getCached(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > CACHE_TTL_MS;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  public setCache(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  public async deduplicate(key: string, factory: (signal: AbortSignal) => Promise<T>): Promise<T> {
    // Check cached result first
    const cached = this.getCached(key);
    if (cached !== null) {
      return cached;
    }

    // Check if identical request is already in flight
    const existingPromise = this.inFlightRequests.get(key);
    if (existingPromise) {
      return existingPromise;
    }

    const controller = this.getOrCreateController(key);
    const promise = (async () => {
      try {
        const result = await factory(controller.signal);
        this.setCache(key, result);
        return result;
      } finally {
        this.inFlightRequests.delete(key);
        if (this.activeControllers.get(key) === controller) {
          this.activeControllers.delete(key);
        }
      }
    })();

    this.inFlightRequests.set(key, promise);
    return promise;
  }

  public clear(): void {
    for (const controller of this.activeControllers.values()) {
      controller.abort();
    }
    this.activeControllers.clear();
    this.inFlightRequests.clear();
    this.cache.clear();
  }

  public cancel(key: string): void {
    const controller = this.activeControllers.get(key);
    if (controller) {
      controller.abort();
      this.activeControllers.delete(key);
    }
    this.inFlightRequests.delete(key);
  }
}
