import type { AnalyzeResponse, HealthResponse, FeedEvent, EventsResponse } from '../types';

const API_BASE = '/api';

export class ApiError extends Error {
  statusCode: number;
  detail: string;

  constructor(statusCode: number, detail: string) {
    super(detail);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.detail = detail;
  }
}

export async function analyzeUrl(url: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    let errorDetail = 'Failed to analyze target website';
    try {
      const errorJson = await response.json();
      if (errorJson.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      errorDetail = `${response.status} ${response.statusText}`;
    }
    throw new ApiError(response.status, errorDetail);
  }

  return response.json();
}

export async function fetchRecentEvents(limit: number = 100): Promise<FeedEvent[]> {
  try {
    const response = await fetch(`${API_BASE}/events?limit=${limit}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      return [];
    }

    const data: EventsResponse = await response.json();
    return data.events || [];
  } catch {
    return [];
  }
}

export async function clearAllEvents(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/events`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_BASE}/health`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, 'Backend service unavailable');
  }

  return response.json();
}

export function subscribeToEventStream(
  onNewEvent: (event: FeedEvent) => void,
  onStatusChange?: (connected: boolean) => void
): () => void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    return () => {};
  }
  const eventSource = new EventSource(`${API_BASE}/events/stream`);

  eventSource.addEventListener('new_event', (e) => {
    try {
      const parsed: FeedEvent = JSON.parse(e.data);
      onNewEvent(parsed);
    } catch (err) {
      console.error('Failed to parse SSE event:', err);
    }
  });

  eventSource.addEventListener('handshake', () => {
    if (onStatusChange) onStatusChange(true);
  });

  eventSource.onopen = () => {
    if (onStatusChange) onStatusChange(true);
  };

  eventSource.onerror = () => {
    if (onStatusChange) onStatusChange(false);
  };

  return () => {
    eventSource.close();
  };
}
