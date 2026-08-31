export const SCHEMA_VERSION = '1.0.0';
export const COLLECTOR_VERSION = '0.1.0';

export const DEFAULT_PROTECTION_ENABLED = true;

export const DEFAULT_API_TIMEOUT_MS = 5000;
export const MAX_RETRY_ATTEMPTS = 2;
export const RETRY_BACKOFF_MS = 300;

export const NAVIGATION_DEBOUNCE_MS = 250;
export const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes short-lived cache
export const MAX_HISTORY_ITEMS = 50;

export const DEFAULT_API_BASE_URL = 'http://localhost:3000';
export const DEFAULT_WEB_URL = 'https://verdict.example.com';
export const SETTINGS_URL_PATH = '/account';

export const STORAGE_KEYS = {
  PROTECTION_ENABLED: 'verdict_protection_enabled',
  DEVICE_ID: 'verdict_device_id',
  DECISION_CACHE: 'verdict_decision_cache',
  DISMISSED_WARNINGS: 'verdict_dismissed_warnings',
  HISTORY: 'verdict_protection_history',
  STATS: 'verdict_protection_stats',
  PREFERENCES: 'verdict_ui_preferences',
} as const;
