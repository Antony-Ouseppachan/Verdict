import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Investigation,
  ConsoleEvent,
  SystemHealth,
} from '../types/index.ts';
import { apiClient } from '../services/apiClient.ts';
import { eventStream } from '../services/eventStream.ts';

export type ConsolePage =
  | 'OVERVIEW'
  | 'INVESTIGATIONS'
  | 'INVESTIGATION_DETAIL'
  | 'SANDBOX'
  | 'PAYMENT'
  | 'WEBSITE_INTEL'
  | 'BRAND_CONTENT'
  | 'AI_INVESTIGATOR'
  | 'VERDICT'
  | 'SYSTEM';

interface ConsoleContextValue {
  currentPage: ConsolePage;
  setCurrentPage: (page: ConsolePage) => void;
  investigations: Investigation[];
  selectedInvestigationId: string | null;
  setSelectedInvestigationId: (id: string | null) => void;
  selectedInvestigation: Investigation | null;
  events: ConsoleEvent[];
  systemHealth: SystemHealth | null;
  isAnalyzing: boolean;
  startNewInvestigation: (url: string) => Promise<Investigation>;
  refreshData: () => Promise<void>;
}

const ConsoleContext = createContext<ConsoleContextValue | undefined>(undefined);

export const ConsoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<ConsolePage>('OVERVIEW');
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [selectedInvestigationId, setSelectedInvestigationId] = useState<string | null>(null);
  const [events, setEvents] = useState<ConsoleEvent[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const refreshData = async () => {
    const [invs, health] = await Promise.all([
      apiClient.getInvestigations(),
      apiClient.getSystemHealth(),
    ]);
    setInvestigations(invs);
    setSystemHealth(health);
  };

  useEffect(() => {
    refreshData();

    // Subscribe to live event stream
    const unsubscribeEvents = eventStream.subscribeEvents((event) => {
      setEvents((prev) => [event, ...prev].slice(0, 100));
    });

    // Subscribe to real-time investigation updates
    const unsubscribeInv = eventStream.subscribeInvestigationUpdates((updatedInv) => {
      apiClient.saveInvestigation(updatedInv);
      setInvestigations((prev) => {
        const idx = prev.findIndex((i) => i.id === updatedInv.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = updatedInv;
          return next;
        }
        return [updatedInv, ...prev];
      });
    });

    // Live polling for browser extension incoming analysis requests from backend
    const pollInterval = setInterval(async () => {
      const newItems = await apiClient.syncWithBackend();
      if (newItems.length > 0) {
        setInvestigations((prev) => {
          const combined = [...newItems, ...prev.filter((p) => !newItems.some((n) => n.id === p.id))];
          return combined;
        });
        setSelectedInvestigationId((prevId) => prevId || newItems[0].id);
        for (const item of newItems) {
          eventStream.emitEvent({
            id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            investigationId: item.id,
            type: 'REQUEST_RECEIVED',
            timestamp: Date.now(),
            message: `[Extension Ingestion] Ingested live tab URL: ${item.hostname}`,
            severity: item.verdict === 'DANGER' ? 'ERROR' : item.verdict === 'CAUTION' ? 'WARN' : 'SUCCESS',
          });
        }
      }
    }, 1500);

    return () => {
      clearInterval(pollInterval);
      unsubscribeEvents();
      unsubscribeInv();
    };
  }, []);

  const startNewInvestigation = async (url: string): Promise<Investigation> => {
    setIsAnalyzing(true);
    try {
      const inv = await eventStream.simulateRealtimeInvestigation(url);
      setSelectedInvestigationId(inv.id);
      return inv;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectedInvestigation = investigations.find((i) => i.id === selectedInvestigationId) || null;

  return (
    <ConsoleContext.Provider
      value={{
        currentPage,
        setCurrentPage,
        investigations,
        selectedInvestigationId,
        setSelectedInvestigationId,
        selectedInvestigation,
        events,
        systemHealth,
        isAnalyzing,
        startNewInvestigation,
        refreshData,
      }}
    >
      {children}
    </ConsoleContext.Provider>
  );
};

export function useConsole(): ConsoleContextValue {
  const ctx = useContext(ConsoleContext);
  if (!ctx) {
    throw new Error('useConsole must be used within a ConsoleProvider');
  }
  return ctx;
}
