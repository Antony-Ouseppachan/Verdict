import {
  DEFAULT_API_TIMEOUT_MS,
  MAX_RETRY_ATTEMPTS,
  RETRY_BACKOFF_MS,
} from '../shared/constants/index.ts';
import type { VerdictAnalysisResponse } from '../shared/types/decision.ts';
import type { VerdictSignals } from '../shared/types/signals.ts';
import { logger } from '../shared/utils/logger.ts';
import { env, type EnvironmentConfig } from '../config/environment.ts';
import { API_ENDPOINTS } from './endpoints.ts';
import {
  EngineUnavailableError,
  NetworkError,
  TimeoutError,
  ValidationError,
} from './errors.ts';
import {
  AnalyzePageResponseSchema,
  ProtectionEventRequestSchema,
  RegisterDeviceResponseSchema,
} from './schemas.ts';

export interface ProtectionEvent {
  eventType: 'WARNING_SHOWN' | 'WARNING_DISMISSED' | 'NAVIGATE_BACK';
  decisionId?: string;
  url: string;
  timestamp: number;
}

export interface VerdictClient {
  analyzePage(
    signals: VerdictSignals,
    signal?: AbortSignal
  ): Promise<VerdictAnalysisResponse>;
  getProtectionStatus(): Promise<{ operational: boolean }>;
  registerDevice(deviceId: string): Promise<boolean>;
  sendProtectionEvent(event: ProtectionEvent): Promise<boolean>;
}

export class RealVerdictClient implements VerdictClient {
  private baseUrl: string;
  private timeoutMs: number;

  constructor(baseUrl: string = env.apiBaseUrl, timeoutMs: number = DEFAULT_API_TIMEOUT_MS) {
    this.baseUrl = baseUrl.replace(/\/+$/, '');
    this.timeoutMs = timeoutMs;
  }

  private async fetchWithTimeout(
    endpoint: string,
    options: RequestInit,
    externalSignal?: AbortSignal
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    const onExternalAbort = () => {
      clearTimeout(timeoutId);
      controller.abort();
    };

    if (externalSignal) {
      externalSignal.addEventListener('abort', onExternalAbort, { once: true });
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options.headers || {}),
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          if (externalSignal?.aborted) {
            throw new Error('Request aborted by caller');
          }
          throw new TimeoutError(`Request to ${endpoint} timed out after ${this.timeoutMs}ms`);
        }
        throw new NetworkError(`Network failure communicating with ${endpoint}: ${err.message}`);
      }
      throw new NetworkError(`Unknown network failure communicating with ${endpoint}`);
    } finally {
      if (externalSignal) {
        externalSignal.removeEventListener('abort', onExternalAbort);
      }
    }
  }

  public async analyzePage(
    signals: VerdictSignals,
    signal?: AbortSignal
  ): Promise<VerdictAnalysisResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      try {
        const response = await this.fetchWithTimeout(
          API_ENDPOINTS.ANALYZE_PAGE,
          {
            method: 'POST',
            body: JSON.stringify({
              url: signals.page.url,
              hostname: signals.page.hostname,
              timestamp: Date.now(),
              signals,
              clientTimestamp: Date.now(),
            }),
          },
          signal
        );

        if (!response.ok) {
          if (response.status >= 500) {
            throw new EngineUnavailableError(
              `Verdict decision engine returned server error (${response.status})`
            );
          }
          throw new NetworkError(`Verdict engine returned HTTP ${response.status}`);
        }

        const rawJson = await response.json();
        const parsed = AnalyzePageResponseSchema.safeParse(rawJson);

        if (!parsed.success) {
          logger.warn('Verdict engine returned invalid schema', {
            errors: parsed.error.issues,
          });
          throw new ValidationError('Verdict engine response failed schema validation');
        }

        return parsed.data;
      } catch (error: unknown) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (signal?.aborted || error instanceof TimeoutError || attempt === MAX_RETRY_ATTEMPTS) {
          break;
        }

        // Wait brief exponential backoff before retry
        await new Promise((resolve) => setTimeout(resolve, RETRY_BACKOFF_MS * attempt));
      }
    }

    throw lastError || new EngineUnavailableError('Unable to analyze page');
  }

  public async getProtectionStatus(): Promise<{ operational: boolean }> {
    try {
      const response = await this.fetchWithTimeout(API_ENDPOINTS.PROTECTION_STATUS, {
        method: 'GET',
      });
      return { operational: response.ok };
    } catch {
      return { operational: false };
    }
  }

  public async registerDevice(deviceId: string): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(API_ENDPOINTS.REGISTER_DEVICE, {
        method: 'POST',
        body: JSON.stringify({
          deviceId,
          extensionVersion: '0.1.0',
          platform: 'chrome-mv3',
        }),
      });

      if (!response.ok) return false;
      const rawJson = await response.json();
      const parsed = RegisterDeviceResponseSchema.safeParse(rawJson);
      return parsed.success && parsed.data.registered;
    } catch {
      return false;
    }
  }

  public async sendProtectionEvent(event: ProtectionEvent): Promise<boolean> {
    try {
      const validated = ProtectionEventRequestSchema.parse(event);
      const response = await this.fetchWithTimeout(API_ENDPOINTS.PROTECTION_EVENT, {
        method: 'POST',
        body: JSON.stringify(validated),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export class MockVerdictClient implements VerdictClient {
  public async analyzePage(
    signals: VerdictSignals,
    signal?: AbortSignal
  ): Promise<VerdictAnalysisResponse> {
    // Check if external signal is already aborted
    if (signal?.aborted) {
      throw new Error('Request aborted by caller');
    }

    // Simulate brief network latency
    await new Promise((resolve) => setTimeout(resolve, 50));

    if (signal?.aborted) {
      throw new Error('Request aborted by caller');
    }

    const host = signals.page.hostname.toLowerCase();
    const url = signals.page.url.toLowerCase();

    // Deterministic simulation triggers
    if (host.includes('engine-down') || host.includes('offline')) {
      throw new EngineUnavailableError('Mock backend simulation: engine unavailable');
    }

    if (
      host.includes('danger') ||
      host.includes('phishing') ||
      host.includes('fake-shop') ||
      url.includes('danger-test')
    ) {
      return {
        decision: {
          status: 'DANGER',
          title: "Don't pay here",
          message: 'This looks like a fake shop. Your money may not be safe.',
          action: 'GO_BACK',
          explanationAvailable: true,
          decisionId: `mock-danger-${Date.now()}`,
          timestamp: Date.now(),
        },
        requestId: `mock-req-${Date.now()}`,
      };
    }

    if (
      host.includes('caution') ||
      host.includes('suspicious') ||
      host.includes('unverified') ||
      url.includes('caution-test')
    ) {
      return {
        decision: {
          status: 'CAUTION',
          title: 'Be careful here',
          message: "This shop is very new and we couldn't verify who operates it.",
          action: 'WARN',
          explanationAvailable: true,
          decisionId: `mock-caution-${Date.now()}`,
          timestamp: Date.now(),
        },
        requestId: `mock-req-${Date.now()}`,
      };
    }

    return {
      decision: {
        status: 'SAFE',
        title: 'Safe',
        message: 'No threat detected.',
        action: 'NONE',
        decisionId: `mock-safe-${Date.now()}`,
        timestamp: Date.now(),
      },
      requestId: `mock-req-${Date.now()}`,
    };
  }

  public async getProtectionStatus(): Promise<{ operational: boolean }> {
    return { operational: true };
  }

  public async registerDevice(_deviceId: string): Promise<boolean> {
    return true;
  }

  public async sendProtectionEvent(_event: ProtectionEvent): Promise<boolean> {
    return true;
  }
}

export function createVerdictClient(config?: Partial<EnvironmentConfig>): VerdictClient {
  const currentEnv = { ...env, ...config };
  if (currentEnv.useMock) {
    return new MockVerdictClient();
  }
  return new RealVerdictClient(currentEnv.apiBaseUrl);
}
