export interface ConsoleEnvironment {
  backendApiUrl: string;
  webUrl: string;
  streamUrl: string;
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
  };
}

function getEnvVar(key: string, defaultValue: string): string {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const val = import.meta.env[key];
    if (typeof val === 'string' && val.trim().length > 0) {
      return val.trim();
    }
  }
  return defaultValue;
}

export const env: ConsoleEnvironment = {
  backendApiUrl: getEnvVar('VITE_VERDICT_BACKEND_API_URL', 'https://api.verdict.example.com'),
  webUrl: getEnvVar('VITE_VERDICT_WEB_URL', 'https://verdict.example.com'),
  streamUrl: getEnvVar('VITE_VERDICT_STREAM_URL', 'wss://stream.verdict.example.com/events'),
  firebase: {
    apiKey: getEnvVar('VITE_FIREBASE_API_KEY', ''),
    authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', ''),
    projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', ''),
    storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', ''),
    messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', ''),
    appId: getEnvVar('VITE_FIREBASE_APP_ID', ''),
  },
};
