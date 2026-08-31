export interface StorageAdapter {
  get<T>(key: string, defaultValue: T): Promise<T>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
}

class ChromeStorageAdapter implements StorageAdapter {
  private memoryFallback: Map<string, unknown> = new Map();

  private isChromeStorageAvailable(): boolean {
    return typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);
  }

  public async get<T>(key: string, defaultValue: T): Promise<T> {
    if (this.isChromeStorageAvailable()) {
      return new Promise<T>((resolve) => {
        chrome.storage.local.get([key], (result) => {
          if (chrome.runtime.lastError || result[key] === undefined) {
            resolve(defaultValue);
          } else {
            resolve(result[key] as T);
          }
        });
      });
    }

    const value = this.memoryFallback.get(key);
    return value !== undefined ? (value as T) : defaultValue;
  }

  public async set<T>(key: string, value: T): Promise<void> {
    if (this.isChromeStorageAvailable()) {
      return new Promise<void>((resolve, reject) => {
        chrome.storage.local.set({ [key]: value }, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    }

    this.memoryFallback.set(key, value);
  }

  public async remove(key: string): Promise<void> {
    if (this.isChromeStorageAvailable()) {
      return new Promise<void>((resolve, reject) => {
        chrome.storage.local.remove([key], () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    }

    this.memoryFallback.delete(key);
  }

  public async clear(): Promise<void> {
    if (this.isChromeStorageAvailable()) {
      return new Promise<void>((resolve, reject) => {
        chrome.storage.local.clear(() => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    }

    this.memoryFallback.clear();
  }
}

export const storage = new ChromeStorageAdapter();
