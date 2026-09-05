import { NAVIGATION_DEBOUNCE_MS } from '../shared/constants/index.ts';
import { isValidBrowsingUrl } from '../security/url.ts';
import { logger } from '../shared/utils/logger.ts';
import { protectionCoordinator } from './protection.ts';

type NavigationCallback = (tabId: number, url: string) => void;

export class NavigationManager {
  private tabDebounceTimers: Map<number, NodeJS.Timeout> = new Map();
  private knownTabUrls: Map<number, string> = new Map();
  private onNavigateCallback: NavigationCallback | null = null;

  public setNavigationHandler(callback: NavigationCallback): void {
    this.onNavigateCallback = callback;
  }

  public registerListeners(): void {
    if (typeof chrome === 'undefined' || !chrome.tabs) {
      return;
    }

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      // Trigger when URL or status changes
      const currentUrl = changeInfo.url || tab.url;

      if (!currentUrl || !isValidBrowsingUrl(currentUrl)) {
        return;
      }

      if (changeInfo.status === 'complete' || changeInfo.url) {
        this.debounceNavigation(tabId, currentUrl);
      }
    });

    chrome.tabs.onActivated.addListener((activeInfo) => {
      chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab && tab.url && isValidBrowsingUrl(tab.url)) {
          this.debounceNavigation(tab.id || activeInfo.tabId, tab.url);
        }
      });
    });

    chrome.tabs.onRemoved.addListener((tabId) => {
      this.clearTab(tabId);
      protectionCoordinator.clearTab(tabId);
    });
  }

  private debounceNavigation(tabId: number, url: string): void {
    // Clear previous pending navigation debounce for this tab
    const existingTimer = this.tabDebounceTimers.get(tabId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const timer = setTimeout(() => {
      this.tabDebounceTimers.delete(tabId);
      this.knownTabUrls.set(tabId, url);

      if (this.onNavigateCallback) {
        logger.debug('Tab navigation triggered', { tabId, url });
        this.onNavigateCallback(tabId, url);
      }
    }, NAVIGATION_DEBOUNCE_MS);

    this.tabDebounceTimers.set(tabId, timer);
  }

  public clearTab(tabId: number): void {
    const timer = this.tabDebounceTimers.get(tabId);
    if (timer) {
      clearTimeout(timer);
      this.tabDebounceTimers.delete(tabId);
    }
    this.knownTabUrls.delete(tabId);
  }
}

export const navigationManager = new NavigationManager();
