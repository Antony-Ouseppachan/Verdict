export type SandboxSessionStatus = 'QUEUED' | 'ACTIVE' | 'COMPLETED' | 'FAILED';

export interface NetworkRequest {
  id: string;
  method: string;
  url: string;
  domain: string;
  status: number;
  type: 'document' | 'script' | 'xhr' | 'fetch' | 'stylesheet' | 'image' | 'iframe' | 'other';
  durationMs: number;
  isThirdParty: boolean;
  isSuspicious: boolean;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  requestBody?: string;
  responseBodySnippet?: string;
}

export interface ScriptExecution {
  id: string;
  src: string;
  isInline: boolean;
  origin: string;
  functionsHooked: string[];
  isObfuscated: boolean;
  evalDetected: boolean;
  storageAccess: boolean;
}

export interface FormInputEvent {
  id: string;
  formAction: string;
  fieldType: 'text' | 'password' | 'email' | 'credit-card' | 'cvv' | 'expiry' | 'tel';
  fieldName: string;
  isAutocompleteDisabled: boolean;
  isThirdPartyForm: boolean;
  redactedValuePreview: string;
}

export interface PopupEvent {
  id: string;
  type: 'window.open' | 'alert' | 'confirm' | 'prompt' | 'notification-request';
  targetUrl?: string;
  text?: string;
  blocked: boolean;
}

export interface DownloadEvent {
  id: string;
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  isExecutable: boolean;
  blocked: boolean;
}

export interface SandboxBehaviorFlag {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'DOM' | 'NETWORK' | 'SCRIPT' | 'INPUT' | 'NAVIGATION';
  title: string;
  description: string;
  timestamp: number;
}

export interface SandboxSession {
  id: string; // Session ID e.g. sbx-0831-4012
  investigationId: string;
  workerId: string;
  targetUrl: string;
  status: SandboxSessionStatus;
  startedAt: number;
  completedAt?: number;
  durationMs?: number;
  redirects: string[];
  domainsContacted: string[];
  networkRequests: NetworkRequest[];
  scripts: ScriptExecution[];
  forms: FormInputEvent[];
  popups: PopupEvent[];
  downloads: DownloadEvent[];
  behaviorFlags: SandboxBehaviorFlag[];
  screenshotUrl?: string;
}
