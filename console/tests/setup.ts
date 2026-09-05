import '@testing-library/jest-dom';

class MockEventSource {
  url: string;
  onopen: ((ev: any) => any) | null = null;
  onerror: ((ev: any) => any) | null = null;
  private listeners: Record<string, Function[]> = {};

  constructor(url: string) {
    this.url = url;
  }

  addEventListener(type: string, listener: Function) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(listener);
  }

  removeEventListener(type: string, listener: Function) {
    if (this.listeners[type]) {
      this.listeners[type] = this.listeners[type].filter((l) => l !== listener);
    }
  }

  close() {}
}

(globalThis as any).EventSource = MockEventSource;

// Mock fetch
globalThis.fetch = async (url: string | URL | Request) => {
  const urlStr = url.toString();
  if (urlStr.includes('/api/health')) {
    return {
      ok: true,
      json: async () => ({
        status: 'healthy',
        version: '2.0.0-soc',
        modelsLoaded: true,
        models: {
          url: 'LinearSVC (TF-IDF 10k)',
          html: 'XGBoost v2 (56 features)',
          payment: 'XGBoost (35 features)',
          fusion: 'LogisticRegression (Risk Engine)',
        },
        benchmarkMetrics: {
          url_model: { name: 'LinearSVC', roc_auc: 0.9923, features: 10000, type: 'TF-IDF Vectorizer + SVM' },
          html_model: { name: 'XGBoost v2', roc_auc: 0.991, features: 56, type: 'Static DOM Structural Scanner' },
          payment_model: { name: 'XGBoost', roc_auc: 0.9376, features: 35, type: 'Payment Surface Analyzer' },
          risk_engine: { name: 'Risk Fusion', accuracy: 0.985, precision: 0.991, recall: 0.978, f1_score: 0.984, roc_auc: 0.9964, features: 3, type: 'Calibrated Risk Engine' },
        },
      }),
    } as any;
  }

  if (urlStr.includes('/api/events')) {
    return {
      ok: true,
      json: async () => ({
        success: true,
        total: 0,
        events: [],
      }),
    } as any;
  }

  return {
    ok: true,
    json: async () => ({ success: true }),
  } as any;
};
