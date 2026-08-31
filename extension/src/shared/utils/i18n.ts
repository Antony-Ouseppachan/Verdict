export const STRINGS = {
  popup: {
    title: 'VERDICT',
    tagline: 'Browser Security',
    connected: 'Protected',
    disconnected: 'Protection Paused',
    connecting: 'Connecting...',
    disconnecting: 'Disconnecting...',
    statusActive: 'Verdict is actively safeguarding your browsing.',
    statusInactive: 'Protection is paused. Click the shield to reconnect.',
    settings: 'Account',
    openDashboard: 'Open Dashboard',
    currentSite: 'CURRENT SITE',
    looksGood: 'Looks good',
    beCareful: 'Be careful here',
    dontPay: "Don't pay here",
  },
  warnings: {
    cautionBadge: 'VERDICT ADVISORY',
    cautionTitle: 'Caution Advised',
    cautionDefaultMessage: 'Unverified operator signals detected. Proceed with heightened scrutiny.',
    dangerBadge: 'THREAT PREVENTED',
    dangerTitle: "Don't pay here",
    dangerDefaultMessage: 'This looks like a fake shop. Your money may not be safe.',
    takeMeBack: 'Take me back',
    understandRisk: 'I understand the risk',
    dismiss: 'Dismiss',
    verdictBadge: 'VERDICT SECURITY',
  },
  engine: {
    unavailable: 'Service Offline',
    unavailableMessage: 'Could not connect to Verdict security engine.',
  },
} as const;

export type StringKeys = typeof STRINGS;

export function t<K extends keyof typeof STRINGS, S extends keyof (typeof STRINGS)[K]>(
  category: K,
  key: S
): string {
  return STRINGS[category][key] as string;
}
