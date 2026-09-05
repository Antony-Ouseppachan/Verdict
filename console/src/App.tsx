import React, { useState, useEffect, useCallback } from 'react';
import { TopBar } from './components/TopBar';
import { LiveFeedPanel } from './components/LiveFeedPanel';
import { InvestigationPanel } from './components/InvestigationPanel';
import { QuickIntelPanel } from './components/QuickIntelPanel';
import {
  fetchRecentEvents,
  subscribeToEventStream,
  checkHealth,
  analyzeUrl,
  clearAllEvents,
} from './services/apiClient';
import type { FeedEvent, HealthResponse } from './types';

export const App: React.FC = () => {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [isHealthy, setIsHealthy] = useState<boolean>(false);
  const [isIngesting, setIsIngesting] = useState<boolean>(false);
  const [hasUnreadNewEvents, setHasUnreadNewEvents] = useState<boolean>(false);
  const [ingestError, setIngestError] = useState<string | null>(null);

  // Selected event resolution
  const selectedEvent = events.find((e) => e.id === selectedEventId) || null;

  // Track session stats
  const stats = {
    safe: events.filter((e) => e.verdict === 'SAFE').length,
    suspicious: events.filter((e) => e.verdict === 'SUSPICIOUS').length,
    highRisk: events.filter((e) => e.verdict === 'HIGH RISK').length,
    payment: events.filter((e) => e.analysis?.paymentDetected).length,
  };

  // 1. Initial Health Check
  const fetchHealthStatus = useCallback(async () => {
    try {
      const data = await checkHealth();
      setHealth(data);
      setIsHealthy(data.modelsLoaded);
    } catch {
      setIsHealthy(false);
    }
  }, []);

  useEffect(() => {
    fetchHealthStatus();
    const interval = setInterval(fetchHealthStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchHealthStatus]);

  // 2. Real-Time Events Load & Periodic Sync
  useEffect(() => {
    let isMounted = true;

    const syncRecentEvents = async () => {
      try {
        const latest = await fetchRecentEvents(100);
        if (isMounted && latest.length > 0) {
          setEvents((prev) => {
            let hasNew = false;
            const merged = [...prev];

            for (const item of latest) {
              const existingIdx = merged.findIndex(
                (e) => e.id === item.id || (e.url === item.url && Math.abs(e.timestamp - item.timestamp) < 3000)
              );
              if (existingIdx >= 0) {
                // Keep the freshest backend record
                merged[existingIdx] = item;
              } else {
                hasNew = true;
                merged.unshift(item);
              }
            }

            if (hasNew) {
              merged.sort((a, b) => b.timestamp - a.timestamp);
              return merged.slice(0, 500);
            }
            return prev;
          });
        }
      } catch {
        // ignore fetch error during transition
      }
    };

    syncRecentEvents();
    const syncInterval = setInterval(syncRecentEvents, 2500);

    return () => {
      isMounted = false;
      clearInterval(syncInterval);
    };
  }, []);

  // 3. SSE Stream Subscription for Live Extension / Ingest Events
  useEffect(() => {
    const unsubscribe = subscribeToEventStream(
      (newEvent: FeedEvent) => {
        setEvents((prev) => {
          // If already exists by ID or matching URL in the last 3 seconds, update in place
          const existingIdx = prev.findIndex(
            (e) => e.id === newEvent.id || (e.url === newEvent.url && Math.abs(e.timestamp - newEvent.timestamp) < 3000)
          );
          if (existingIdx >= 0) {
            const updated = [...prev];
            updated[existingIdx] = newEvent;
            return updated;
          }

          // Prepend new event
          const next = [newEvent, ...prev];
          if (next.length > 500) {
            return next.slice(0, 500);
          }
          return next;
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // 4. Keyboard global shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedEventId(null);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Handlers
  const handleSelectEvent = (event: FeedEvent) => {
    setSelectedEventId(event.id);
  };

  const handleClearSelection = () => {
    setSelectedEventId(null);
  };

  const handleScrollToTop = () => {
    setHasUnreadNewEvents(false);
    const feedContainer = document.querySelector('.feed-list');
    if (feedContainer) {
      feedContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteEvents = (idsToDelete: string[]) => {
    const idSet = new Set(idsToDelete);
    setEvents((prev) => {
      const remaining = prev.filter((e) => !idSet.has(e.id));
      if (remaining.length === 0) {
        clearAllEvents();
      }
      return remaining;
    });

    if (selectedEventId && idSet.has(selectedEventId)) {
      setSelectedEventId(null);
    }
  };

  const handleManualIngest = async (url: string) => {
    setIsIngesting(true);
    setIngestError(null);
    try {
      const response = await analyzeUrl(url);
      if (response) {
        const targetId = response.requestId || `evt-${Date.now()}`;
        setEvents((prev) => {
          const existingIdx = prev.findIndex(
            (e) => e.id === targetId || (e.url === response.url && Math.abs(e.timestamp - Date.now()) < 3000)
          );

          if (existingIdx >= 0) {
            setSelectedEventId(prev[existingIdx].id);
            return prev;
          }

          const newEvt: FeedEvent = {
            id: targetId,
            timestamp: Date.now(),
            url: response.url,
            finalUrl: response.finalUrl,
            hostname: new URL(response.url).hostname,
            verdict: response.verdict,
            riskScore: response.riskScore,
            models: response.models,
            findings: response.findings,
            analysis: response.analysis,
            telemetry: response.telemetry as any,
            scanDuration: response.scanDuration,
            initiator: 'console-manual-ingest',
          };

          setSelectedEventId(newEvt.id);
          return [newEvt, ...prev];
        });
      }
    } catch (err: any) {
      setIngestError(err.detail || err.message || 'Failed to analyze URL');
      setTimeout(() => setIngestError(null), 5000);
    } finally {
      setIsIngesting(false);
    }
  };

  return (
    <div className="soc-workstation-root">
      {/* Top Command Bar */}
      <TopBar
        health={health}
        isHealthy={isHealthy}
        isOverviewActive={selectedEventId === null}
        onGoToDashboard={handleClearSelection}
        onManualIngest={handleManualIngest}
        isIngesting={isIngesting}
      />

      {/* Global Ingestion Error Notification */}
      {ingestError && (
        <div className="soc-error-toast font-mono">
          <span>⚠️ {ingestError}</span>
          <button onClick={() => setIngestError(null)}>✕</button>
        </div>
      )}

      {/* 3-Column SOC Grid Layout */}
      <div className="soc-grid-container">
        {/* Left: Live Activity Feed */}
        <LiveFeedPanel
          events={events}
          selectedEventId={selectedEventId}
          onSelectEvent={handleSelectEvent}
          onDeleteEvents={handleDeleteEvents}
          hasUnreadNewEvents={hasUnreadNewEvents}
          onScrollToTop={handleScrollToTop}
        />

        {/* Center: Selected Event AI Deep Dive / Operations Overview */}
        <InvestigationPanel
          event={selectedEvent}
          events={events}
          totalEventsCount={events.length}
          stats={stats}
          onQuickIngestPreset={handleManualIngest}
          onClearSelection={handleClearSelection}
        />

        {/* Right: Security Intelligence Sidebar */}
        <QuickIntelPanel
          selectedEvent={selectedEvent}
          events={events}
          health={health}
          backendConnected={isHealthy}
          extensionConnected={events.length > 0}
          onSelectEvent={handleSelectEvent}
        />
      </div>
    </div>
  );
};

export default App;
