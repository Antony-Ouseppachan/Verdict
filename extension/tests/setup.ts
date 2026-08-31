import '@testing-library/jest-dom';
import { beforeEach, vi } from 'vitest';

// In-memory chrome storage simulator for tests
const memoryStorage = new Map<string, unknown>();

const chromeMock = {
  runtime: {
    lastError: null,
    sendMessage: vi.fn((_message, callback) => {
      if (callback) callback({ success: true });
    }),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onInstalled: {
      addListener: vi.fn(),
    },
    onStartup: {
      addListener: vi.fn(),
    },
  },
  storage: {
    local: {
      get: vi.fn((keys: string[], callback: (res: Record<string, unknown>) => void) => {
        const result: Record<string, unknown> = {};
        for (const key of keys) {
          if (memoryStorage.has(key)) {
            result[key] = memoryStorage.get(key);
          }
        }
        callback(result);
      }),
      set: vi.fn((items: Record<string, unknown>, callback?: () => void) => {
        for (const [key, value] of Object.entries(items)) {
          memoryStorage.set(key, value);
        }
        if (callback) callback();
      }),
      remove: vi.fn((keys: string[], callback?: () => void) => {
        for (const key of keys) {
          memoryStorage.delete(key);
        }
        if (callback) callback();
      }),
      clear: vi.fn((callback?: () => void) => {
        memoryStorage.clear();
        if (callback) callback();
      }),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  tabs: {
    sendMessage: vi.fn((_tabId, _msg, callback) => {
      if (callback) callback({ success: true });
    }),
    onUpdated: {
      addListener: vi.fn(),
    },
    onRemoved: {
      addListener: vi.fn(),
    },
    goBack: vi.fn((_tabId, callback) => {
      if (callback) callback();
    }),
    remove: vi.fn(),
    create: vi.fn(),
  },
  action: {
    setBadgeText: vi.fn(),
    setBadgeBackgroundColor: vi.fn(),
  },
  permissions: {
    contains: vi.fn(async () => true),
  },
};

// Assign mock to globalThis
Object.defineProperty(globalThis, 'chrome', {
  value: chromeMock,
  writable: true,
});

beforeEach(() => {
  memoryStorage.clear();
  vi.clearAllMocks();
});
