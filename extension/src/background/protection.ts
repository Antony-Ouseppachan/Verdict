import { createVerdictClient, type VerdictClient } from '../api/client.ts';
import { EngineUnavailableError } from '../api/errors.ts';
import {
  isValidBrowsingUrl,
  sanitizeAndNormalizeUrl,
  isLocalhostUrl,
  isSearchEngineUrl,
  classifyPage,
} from '../security/url.ts';
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
  private tabBypassedOrigins: Map<number, Set<string>> = new Map();
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

  public allowBypassUrl(url: string, tabId?: number): void {
    const origin = this.getOrigin(url);
    if (tabId && tabId > 0) {
      if (!this.tabBypassedOrigins.has(tabId)) {
        this.tabBypassedOrigins.set(tabId, new Set());
      }
      this.tabBypassedOrigins.get(tabId)!.add(origin);
      try {
        const parsed = new URL(url);
        this.tabBypassedOrigins.get(tabId)!.add(parsed.hostname);
      } catch {
        // ignore
      }
    }
  }

  public clearBypass(url: string, tabId?: number): void {
    const origin = this.getOrigin(url);
    if (tabId && tabId > 0) {
      this.tabBypassedOrigins.get(tabId)?.delete(origin);
    } else {
      this.tabBypassedOrigins.forEach((origins) => origins.delete(origin));
    }
  }

  public clearTab(tabId: number): void {
    this.tabBypassedOrigins.delete(tabId);
    this.activeDecisions.delete(tabId);
    this.activeTabUrls.delete(tabId);
  }

  public isBypassed(url: string, tabId?: number): boolean {
    if (!tabId || tabId <= 0) {
      return false;
    }

    const origin = this.getOrigin(url);
    const tabOrigins = this.tabBypassedOrigins.get(tabId);
    if (!tabOrigins) {
      return false;
    }

    if (tabOrigins.has(origin)) {
      return true;
    }

    try {
      const parsed = new URL(url);
      if (tabOrigins.has(parsed.hostname)) {
        return true;
      }
    } catch {
      // ignore
    }

    return false;
  }

  private getOrigin(url: string): string {
    try {
      const parsed = new URL(url);
      return parsed.origin;
    } catch {
      return url;
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
        if (!activeTab || !activeTab.url) {
          resolve(this.lastRecordedTab);
          return;
        }

        const tabId = activeTab.id || -1;
        const pageType = classifyPage(activeTab.url);

        // If internal browser page (edge://, chrome://, about:, chrome-extension://, etc.)
        if (pageType === 'INTERNAL_BROWSER_PAGE' || pageType === 'UNSUPPORTED_PAGE') {
          let hostDisplay = 'Browser System Page';
          try {
            const parsed = new URL(activeTab.url);
            hostDisplay = parsed.hostname
              ? `${parsed.protocol}//${parsed.hostname}`
              : parsed.protocol.replace(':', '') || 'System Page';
          } catch {
            hostDisplay = 'System Page';
          }

          const internalInfo: ActiveTabInfo = {
            url: activeTab.url,
            hostname: hostDisplay,
            title: activeTab.title || 'Browser System Page',
            decision: {
              status: 'SAFE',
              title: 'Browser System Page',
              message: 'Internal browser pages and extension interfaces are exempt from threat scanning.',
              action: 'NONE',
              decisionId: `internal-${tabId}`,
              timestamp: Date.now(),
              pageType: 'INTERNAL_BROWSER_PAGE',
              reasons: [],
            },
          };
          this.lastRecordedTab = internalInfo;
          resolve(internalInfo);
          return;
        }

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

    // Search Engine Exemption: Search engine result pages are not destination stores
    if (isSearchEngineUrl(targetUrl)) {
      logger.debug('Search engine query page detected. Exempt from destination threat scanning.', { targetUrl });
      const searchDecision: VerdictDecision = {
        status: 'SAFE',
        title: 'Search Engine',
        message: 'Search engine query pages are exempt from destination store analysis.',
        action: 'NONE',
        decisionId: `search-${tabId}-${Date.now()}`,
        timestamp: Date.now(),
        pageType: 'SEARCH_ENGINE',
        reasons: [],
      };
      this.activeDecisions.set(tabId, searchDecision);
      updateExtensionBadge(true, 'SAFE');
      this.dispatchDecisionToTab(tabId, searchDecision);
      return searchDecision;
    }

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
        pageType: 'INTERNAL_BROWSER_PAGE',
        reasons: [],
      };
      this.activeDecisions.set(tabId, exemptDecision);
      updateExtensionBadge(true, 'SAFE');
      this.dispatchDecisionToTab(tabId, exemptDecision);
      return exemptDecision;
    }

    const cacheKey = sanitizeAndNormalizeUrl(targetUrl);

    console.log('[Verdict Background] Dispatching threat analysis for:', targetUrl, {
      hasPaymentForm: signals.payment.hasPaymentForm,
      isFakeGateway: signals.payment.isFakeGatewayImpersonation,
      formsCount: signals.forms.length,
    });

    try {
      const response = await this.deduplicator.deduplicate(cacheKey, async (abortSignal) => {
        return await this.client.analyzePage(signals, abortSignal);
      });

      const decision = response.decision;
      console.log('[Verdict Background] Decision received:', decision);
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

      // If decision is DANGER and URL is not in an active bypass, redirect browser tab to standalone firewall bridge
      const isBypassed = this.isBypassed(targetUrl, tabId);
      if (decision.status === 'DANGER' && !isBypassed) {
        if (typeof chrome !== 'undefined' && chrome.tabs?.update && tabId > 0) {
          const firewallUrl = chrome.runtime.getURL(
            `firewall.html?target=${encodeURIComponent(targetUrl)}&title=${encodeURIComponent(decision.title)}&message=${encodeURIComponent(decision.message)}&decisionId=${encodeURIComponent(decision.decisionId || '')}`
          );
          try {
            const updatePromise = chrome.tabs.update(tabId, { url: firewallUrl });
            if (updatePromise && typeof updatePromise.catch === 'function') {
              updatePromise.catch((err) => {
                logger.debug('Tab redirect to firewall was superseded or aborted', { tabId, err });
              });
            }
          } catch (err) {
            logger.debug('Tab redirect threw exception', { tabId, err });
          }
        }
      }

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

    if (isSearchEngineUrl(url)) {
      const searchDecision: VerdictDecision = {
        status: 'SAFE',
        title: 'Search Engine',
        message: 'Search engine query pages are exempt from destination store analysis.',
        action: 'NONE',
        decisionId: `search-${tabId}-${Date.now()}`,
        timestamp: Date.now(),
        pageType: 'SEARCH_ENGINE',
        reasons: [],
      };
      this.activeDecisions.set(tabId, searchDecision);
      updateExtensionBadge(true, 'SAFE');
      return searchDecision;
    }

    if (isLocalhostUrl(url)) {
      const exemptDecision: VerdictDecision = {
        status: 'SAFE',
        title: 'Local Development Environment',
        message: 'Localhost and private development servers are exempt from Verdict threat scanning.',
        action: 'NONE',
        decisionId: `local-${tabId}-${Date.now()}`,
        timestamp: Date.now(),
        pageType: 'INTERNAL_BROWSER_PAGE',
        reasons: [],
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
