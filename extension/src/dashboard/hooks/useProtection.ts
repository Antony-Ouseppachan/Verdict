import { useState, useEffect, useCallback } from 'react';
import type { ActiveTabInfo } from '../../shared/types/decision.ts';
import { isValidBrowsingUrl } from '../../security/url.ts';
import {
  getProtectionState,
  setProtectionState,
  onProtectionStateChanged,
} from '../../storage/protectionState.ts';

export function useProtection() {
  const [enabled, setEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<ActiveTabInfo | null>(null);

  const fetchActiveTab = useCallback(async () => {
    // 1. If running in browser tab, check if we can directly find a web tab
    if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
      chrome.tabs.query({ lastFocusedWindow: true }, (tabs) => {
        const webTab = tabs.find((t) => t.url && isValidBrowsingUrl(t.url));
        if (webTab && webTab.url) {
          try {
            const parsed = new URL(webTab.url);
            setActiveTab((prev) => ({
              url: webTab.url || '',
              hostname: parsed.hostname,
              title: webTab.title,
              decision: prev?.decision,
            }));
          } catch {
            // ignore
          }
        }
      });
    }

    // 2. Fetch full decision and tab metadata from background coordinator
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      try {
        chrome.runtime.sendMessage(
          { type: 'GET_ACTIVE_TAB_INFO' },
          (response) => {
            if (response && response.success && response.data) {
              setActiveTab(response.data);
            }
          }
        );
      } catch {
        // standalone mode
      }
    } else {
      setActiveTab({
        url: 'https://example.com/checkout',
        hostname: 'example.com',
        title: 'Example Store',
        decision: {
          status: 'SAFE',
          title: 'Looks good',
          message: 'Verdict has no concerns about this site.',
          action: 'NONE',
          decisionId: 'preview-safe',
          timestamp: Date.now(),
        },
      });
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const state = await getProtectionState();
      if (mounted) {
        setEnabled(state);
        setLoading(false);
      }
    }

    load();
    fetchActiveTab();

    const unsubscribe = onProtectionStateChanged((newState) => {
      if (mounted) {
        setEnabled(newState);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [fetchActiveTab]);

  const toggleProtection = async (nextState: boolean) => {
    setEnabled(nextState);
    await setProtectionState(nextState);
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'SET_PROTECTION_STATE',
        payload: { enabled: nextState },
      });
    }
  };

  return {
    enabled,
    loading,
    activeTab,
    toggleProtection,
    refreshActiveTab: fetchActiveTab,
  };
}
