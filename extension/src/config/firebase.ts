import { env } from './environment.ts';

/**
 * Firebase Configuration for Verdict platform integration.
 * Sourced dynamically from environment variables (VITE_FIREBASE_*).
 */
export const firebaseConfig = {
  apiKey: env.firebase.apiKey,
  authDomain: env.firebase.authDomain,
  projectId: env.firebase.projectId,
  storageBucket: env.firebase.storageBucket,
  messagingSenderId: env.firebase.messagingSenderId,
  appId: env.firebase.appId,
};

export default firebaseConfig;
