import {
  DEFAULT_API_BASE_URL,
  DEFAULT_WEB_URL,
  SETTINGS_URL_PATH,
} from '../shared/constants/index.ts';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export interface EnvironmentConfig {
  apiBaseUrl: string;
  webUrl: string;
  settingsUrl: string;
  useMock: boolean;
  isDevelopment: boolean;
  firebase: FirebaseConfig;
}

function getEnvVar(key: string, defaultValue: string): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const value = import.meta.env[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return defaultValue;
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const apiBaseUrl = getEnvVar('VITE_VERDICT_API_BASE_URL', DEFAULT_API_BASE_URL);
  const webUrl = getEnvVar('VITE_VERDICT_WEB_URL', DEFAULT_WEB_URL);
  const useMock = getEnvVar('VITE_VERDICT_USE_MOCK', 'false').toLowerCase() === 'true';
  const isDevelopment =
    getEnvVar('MODE', 'production') === 'development' ||
    (typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production');

  const firebase: FirebaseConfig = {
    apiKey: getEnvVar('VITE_FIREBASE_API_KEY', ''),
    authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', ''),
    projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', ''),
    storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', ''),
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', ''),
    appId: getEnvVar('VITE_FIREBASE_APP_ID', ''),
  };

  return {
    apiBaseUrl,
    webUrl,
    settingsUrl: `${webUrl.replace(/\/+$/, '')}${SETTINGS_URL_PATH}`,
    useMock,
    isDevelopment,
    firebase,
  };
}

export const env = getEnvironmentConfig();
