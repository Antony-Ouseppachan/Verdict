import { initializeLifecycle } from './lifecycle.ts';
import { registerMessageHandlers } from './messaging.ts';
import { navigationManager } from './navigation.ts';
import { protectionCoordinator } from './protection.ts';

// 1. Initialize Service Worker lifecycle
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onInstalled.addListener(() => {
    initializeLifecycle();
  });

  chrome.runtime.onStartup.addListener(() => {
    initializeLifecycle();
  });
}

// 2. Register Navigation listener
navigationManager.setNavigationHandler((tabId, url) => {
  // Cancel any prior stale request when navigation changes
  protectionCoordinator.cancelTabAnalysis(tabId, url);
  // Automatically evaluate tab URL on navigation
  protectionCoordinator.analyzeUrl(tabId, url);
});
navigationManager.registerListeners();

// 3. Register Typed IPC Message Handlers
registerMessageHandlers();
