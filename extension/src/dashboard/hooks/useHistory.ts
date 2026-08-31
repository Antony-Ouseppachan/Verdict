import { useState, useEffect, useCallback } from 'react';
import type { ProtectionEventItem, ProtectionStats } from '../../shared/types/decision.ts';
import {
  clearHistory,
  getHistory,
  getStats,
  onHistoryChanged,
  onStatsChanged,
} from '../../storage/history.ts';

const SAMPLE_FALLBACK_EVENTS: ProtectionEventItem[] = [
  {
    id: 'sample-1',
    url: 'https://suspicious-luxury-outlet.shop/checkout',
    hostname: 'suspicious-luxury-outlet.shop',
    timestamp: Date.now() - 1000 * 60 * 15,
    status: 'DANGER',
    title: "Don't pay here",
    message: 'Verdict found signs that this may be a fake shop.',
    action: 'GO_BACK',
    actionTaken: 'Blocked',
    reasons: [
      'Unverified checkout domain impersonating a luxury brand',
      'Missing genuine merchant payment credentials',
      'Suspicious form submission endpoint',
    ],
    recommendation: 'Leave this site immediately. Do not enter any financial details.',
    technicalDetails: {
      requestId: 'req-danger-9482',
      protocol: 'https:',
      detectionEngine: 'Verdict Cloud Heuristics v1',
      signalsMatched: ['Brand Impersonation', 'Fake Payment Gateway'],
    },
  },
  {
    id: 'sample-2',
    url: 'https://new-artisan-boutique.store/cart',
    hostname: 'new-artisan-boutique.store',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    status: 'CAUTION',
    title: 'Be careful here',
    message: "This shop is very new and we couldn't verify who operates it.",
    action: 'WARN',
    actionTaken: 'Warned',
    reasons: [
      'Merchant domain was registered very recently',
      'Operator identity is unverified',
    ],
    recommendation: 'Verify seller authenticity before submitting card details.',
    technicalDetails: {
      requestId: 'req-caution-4821',
      protocol: 'https:',
      detectionEngine: 'Verdict Cloud Heuristics v1',
      signalsMatched: ['Domain Age Heuristic'],
    },
  },
  {
    id: 'sample-3',
    url: 'https://store.apple.com/shop',
    hostname: 'store.apple.com',
    timestamp: Date.now() - 1000 * 60 * 60 * 5,
    status: 'SAFE',
    title: 'Looks good',
    message: 'Verdict has no concerns about this site.',
    action: 'NONE',
    actionTaken: 'Allowed',
    reasons: ['Verified legitimate brand domain', 'Standard secure payment flow'],
    recommendation: 'Safe to browse and transact normally.',
    technicalDetails: {
      requestId: 'req-safe-1029',
      protocol: 'https:',
      detectionEngine: 'Verdict Cloud Heuristics v1',
      signalsMatched: [],
    },
  },
];

export function useHistory() {
  const [events, setEvents] = useState<ProtectionEventItem[]>(SAMPLE_FALLBACK_EVENTS);
  const [stats, setStats] = useState<ProtectionStats>({
    sitesChecked: 0,
    warningsIssued: 0,
    threatsPrevented: 0,
    lastAnalysisTimestamp: undefined,
  });
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = useCallback(async () => {
    const [fetchedEvents, fetchedStats] = await Promise.all([getHistory(), getStats()]);
    if (fetchedEvents.length > 0) {
      setEvents(fetchedEvents);
    } else {
      setEvents(SAMPLE_FALLBACK_EVENTS);
    }

    if (fetchedStats.sitesChecked > 0) {
      setStats(fetchedStats);
    } else {
      setStats({
        sitesChecked: 42,
        warningsIssued: 3,
        threatsPrevented: 1,
        lastAnalysisTimestamp: Date.now() - 1000 * 60 * 5,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();

    const unsubHistory = onHistoryChanged((newEvents) => {
      setEvents(newEvents);
    });

    const unsubStats = onStatsChanged((newStats) => {
      setStats(newStats);
    });

    return () => {
      unsubHistory();
      unsubStats();
    };
  }, [loadData]);

  const handleClearHistory = async () => {
    await clearHistory();
    setEvents([]);
  };

  return {
    events,
    stats,
    loading,
    clearHistory: handleClearHistory,
    refreshHistory: loadData,
  };
}
