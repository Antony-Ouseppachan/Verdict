import { createVerdictClient, type VerdictClient } from '../api/client.ts';
import { EngineUnavailableError } from '../api/errors.ts';
import { isValidBrowsingUrl, sanitizeAndNormalizeUrl, isLocalhostUrl } from '../security/url.ts';
import type {
  ActiveTabInfo,
  VerdictAnalysisResponse,
  VerdictDecision,
} from '../shared/types/decision.ts';
import type { DashboardData } from '../shared/types/messages.ts';
import type { VerdictSignals } from '../shared/types/signals.ts';
import { RequestDeduplicator } from '../shared/utils/deduplication.ts';
import { logger } from '../shared/utils/logger.ts';
import { getOrCreateDeviceId } from '../storage/device.ts';
import {
  addHistoryEvent,
  getHistory,
  getStats,
  updateStats,
} from '../storage/history.ts';
import { getProtectionState } from '../storage/protectionState.ts';
import { updateExtensionBadge } from './lifecycle.ts';

export class ProtectionCoordinator {
  private client: VerdictClient;
  private deduplicator: RequestDeduplicator<VerdictAnalysisResponse> = new RequestDeduplicator();
  private dismissedDecisions: Set<string> = new Set();
  private activeDecisions: Map<number, VerdictDecision> = new Map();
  private activeTabUrls: Map<number, { url: string; hostname: string; title?: string }> = new Map();

  constructor(client: VerdictClient = createVerdictClient()) {
    this.client = client;
  }

  public setClient(client: VerdictClient): void {
    this.client = client;
  }

  public getActiveDecision(tabId: number): VerdictDecision | undefined {
    return this.activeDecisions.get(tabId);
  }

  public dismissWarning(decisionId?: string): void {
    if (decisionId) {
      this.dismissedDecisions.add(decisionId);
    }
  }

  private lastRecordedTab: ActiveTabInfo | null = null;

  public async getActiveTabInfo(queryTabId?: number): Promise<ActiveTabInfo | null> {
    if (typeof chrome === 'undefined' || !chrome.tabs?.query) {
      return this.lastRecordedTab;
    }

    return new Promise((resolve) => {
      // 1. If explicit tab ID requested
      if (queryTabId !== undefined) {
        const tabMeta = this.activeTabUrls.get(queryTabId);
        const decision = this.activeDecisions.get(queryTabId);
        if (tabMeta) {
          resolve({ ...tabMeta, decision });
          return;
        }
      }

      // 2. Query active tab in the last focused window
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, async (tabs) => {
        const activeTab = tabs[0];

        // If the active tab is not a valid web URL (e.g. extension dashboard, options page, or chrome://)
        if (!activeTab || !activeTab.url || !isValidBrowsingUrl(activeTab.url)) {
          // Look for any valid web browsing tab in the window
          chrome.tabs.query({ lastFocusedWindow: true }, async (allTabs) => {
            const webTab = allTabs.find((t) => t.url && isValidBrowsingUrl(t.url));
            if (webTab && webTab.url) {
              const tabId = webTab.id || -1;
              let decision = this.activeDecisions.get(tabId);
              if (!decision) {
                decision = (await this.analyzeUrl(tabId, webTab.url)) || undefined;
              }
              try {
                const parsed = new URL(webTab.url);
                const info: ActiveTabInfo = {
                  url: webTab.url,
                  hostname: parsed.hostname,
                  title: webTab.title,
                  decision,
                };
                this.lastRecordedTab = info;
                resolve(info);
                return;
              } catch {
                // ignore
              }
            }

            // Fallback to last recorded tab
            resolve(this.lastRecordedTab);
          });
          return;
        }

        const tabId = activeTab.id || -1;
        let decision = this.activeDecisions.get(tabId);
        if (!decision && activeTab.url) {
          decision = (await this.analyzeUrl(tabId, activeTab.url)) || undefined;
        }

        try {
          const parsed = new URL(activeTab.url);
          const tabInfo: ActiveTabInfo = {
            url: activeTab.url,
            hostname: parsed.hostname,
            title: activeTab.title,
            decision,
          };
          this.lastRecordedTab = tabInfo;
          resolve(tabInfo);
        } catch {
          resolve(this.lastRecordedTab);
        }
      });
    });
  }

  public async getDashboardData(): Promise<DashboardData> {
    const [protectionEnabled, activeTab, stats, recentEvents, deviceId] = await Promise.all([
      getProtectionState(),
      this.getActiveTabInfo(),
      getStats(),
      getHistory(),
      getOrCreateDeviceId(),
    ]);

    return {
      protectionEnabled,
      activeTab,
      stats,
      recentEvents: recentEvents.slice(0, 10),
      deviceId,
    };
  }

  public async analyzeSignals(
    tabId: number,
    signals: VerdictSignals
  ): Promise<VerdictDecision | null> {
    const isEnabled = await getProtectionState();
    if (!isEnabled) {
      logger.debug('Protection is disabled. Skipping analysis.');
      updateExtensionBadge(false);
      return null;
    }

    const targetUrl = signals.page.url;
    if (!isValidBrowsingUrl(targetUrl)) {
      return null;
    }

    this.activeTabUrls.set(tabId, {
      url: targetUrl,
      hostname: signals.page.hostname,
      title: signals.page.title,
    });

    // Localhost Development Exception: Do not scan local development environments
    if (isLocalhostUrl(targetUrl)) {
      logger.debug('Local development server detected. Exempt from threat scanning.', { targetUrl });
      const exemptDecision: VerdictDecision = {
        status: 'SAFE',
        title: 'Local Development Environment',
        message: 'Localhost and private development servers are exempt from Verdict threat scanning.',
        action: 'NONE',
        decisionId: `local-${tabId}-${Date.now()}`,
        timestamp: Date.now(),
      };
      this.activeDecisions.set(tabId, exemptDecision);
      updateExtensionBadge(true, 'SAFE');
      this.dispatchDecisionToTab(tabId, exemptDecision);
      return exemptDecision;
    }

    const cacheKey = sanitizeAndNormalizeUrl(targetUrl);

    try {
      const response = await this.deduplicator.deduplicate(cacheKey, async (abortSignal) => {
        return await this.client.analyzePage(signals, abortSignal);
      });

      const decision = response.decision;
      this.activeDecisions.set(tabId, decision);

      // Record to history and update stats
      const actionTaken =
        decision.action === 'GO_BACK'
          ? 'Blocked'
          : decision.action === 'WARN'
            ? 'Warned'
            : 'Allowed';

      await Promise.all([
        addHistoryEvent({
          url: targetUrl,
          hostname: signals.page.hostname,
          timestamp: Date.now(),
          status: decision.status,
          title: decision.title,
          message: decision.message,
          action: decision.action,
          actionTaken,
          reasons:
            decision.status === 'DANGER'
              ? ['Brand impersonation pattern detected', 'Unverified checkout mechanism']
              : decision.status === 'CAUTION'
                ? ['Newly registered merchant domain', 'Unverified operator metadata']
                : ['Verified safe domain', 'Standard secure protocol'],
          recommendation:
            decision.status === 'DANGER'
              ? 'Do not enter any financial or personal credentials.'
              : decision.status === 'CAUTION'
                ? 'Verify store reputation before completing checkout.'
                : 'Safe to browse and transact normally.',
          technicalDetails: {
            requestId: response.requestId,
            protocol: signals.security.protocol,
            detectionEngine: 'Verdict Cloud Heuristics v1',
            signalsMatched: decision.status !== 'SAFE' ? ['Domain Heuristic', 'Form Metadata'] : [],
          },
        }),
        updateStats(decision.status),
      ]);

      // Check if user previously dismissed this decision
      if (decision.decisionId && this.dismissedDecisions.has(decision.decisionId)) {
        logger.debug('Decision was previously dismissed by user', { decisionId: decision.decisionId });
        updateExtensionBadge(true, 'SAFE');
        return decision;
      }

      // Update badge
      updateExtensionBadge(true, decision.status);

      // Notify content script to update scanning pill / show warning
      this.dispatchDecisionToTab(tabId, decision);

      return decision;
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('aborted')) {
        logger.debug('Analysis aborted due to subsequent navigation');
        return null;
      }

      if (error instanceof EngineUnavailableError) {
        logger.warn('Verdict decision engine currently unavailable. Browsing continues unimpeded.');
      } else {
        logger.error('Error during autonomous analysis', error);
      }

      // Fail safely without blocking browsing
      updateExtensionBadge(true, 'SAFE');
      return null;
    }
  }

  public async analyzeUrl(tabId: number, url: string): Promise<VerdictDecision | null> {
    if (!isValidBrowsingUrl(url)) {
      return null;
    }

    if (isLocalhostUrl(url)) {
      const exemptDecision: VerdictDecision = {
        status: 'SAFE',
        title: 'Local Development Environment',
        message: 'Localhost and private development servers are exempt from Verdict threat scanning.',
        action: 'NONE',
        decisionId: `local-${tabId}-${Date.now()}`,
        timestamp: Date.now(),
      };
      this.activeDecisions.set(tabId, exemptDecision);
      updateExtensionBadge(true, 'SAFE');
      return exemptDecision;
    }

    try {
      const parsed = new URL(url);
      const minimalSignals: VerdictSignals = {
        schemaVersion: '1.0.0',
        collectorVersion: '0.1.0',
        timestamp: Date.now(),
        page: {
          url: parsed.href,
          origin: parsed.origin,
          hostname: parsed.hostname,
          protocol: parsed.protocol,
          title: parsed.hostname,
          hasSsl: parsed.protocol === 'https:',
        },
        forms: [],
        payment: {
          hasPaymentForm: false,
          detectedGateways: [],
          hasCheckoutButton: false,
          hasCartIndicator: false,
          currencySymbolsDetected: [],
        },
        navigation: {
          referrer: '',
          isIframe: false,
          frameDepth: 0,
          hasHistoryTransitions: false,
        },
        brand: {
          logoAltTexts: [],
        },
        security: {
          isSecureContext: parsed.protocol === 'https:',
          protocol: parsed.protocol,
          hasMixedContentWarnings: false,
          hasCertificateIssue: false,
        },
      };

      return await this.analyzeSignals(tabId, minimalSignals);
    } catch (err) {
      logger.debug('Could not parse navigation URL for early analysis', { url, err });
      return null;
    }
  }

  public cancelTabAnalysis(tabId: number, url?: string): void {
    this.activeDecisions.delete(tabId);
    if (url) {
      const cacheKey = sanitizeAndNormalizeUrl(url);
      this.deduplicator.cancel(cacheKey);
    }
  }

  private dispatchDecisionToTab(tabId: number, decision: VerdictDecision): void {
    if (typeof chrome === 'undefined' || !chrome.tabs?.sendMessage) {
      return;
    }

    chrome.tabs.sendMessage(
      tabId,
      {
        type: 'SHOW_DECISION',
        payload: { decision },
      },
      () => {
        if (chrome.runtime.lastError) {
          logger.debug('Could not send decision to tab (tab may be unloading)', {
            error: chrome.runtime.lastError.message,
          });
        }
      }
    );
  }
}

export const protectionCoordinator = new ProtectionCoordinator();
