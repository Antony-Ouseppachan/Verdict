import type { ActiveTabInfo, ProtectionEventItem, ProtectionStats, VerdictDecision } from './decision.ts';
import type { VerdictSignals } from './signals.ts';

export type ExtensionMessageType =
  | 'COLLECT_SIGNALS'
  | 'SIGNALS_COLLECTED'
  | 'GET_PROTECTION_STATE'
  | 'SET_PROTECTION_STATE'
  | 'GET_CURRENT_DECISION'
  | 'GET_ACTIVE_TAB_INFO'
  | 'GET_DASHBOARD_DATA'
  | 'CLEAR_HISTORY'
  | 'SHOW_DECISION'
  | 'DISMISS_WARNING'
  | 'NAVIGATE_BACK';

export interface CollectSignalsMessage {
  type: 'COLLECT_SIGNALS';
}

export interface SignalsCollectedMessage {
  type: 'SIGNALS_COLLECTED';
  payload: {
    signals: VerdictSignals;
  };
}

export interface GetProtectionStateMessage {
  type: 'GET_PROTECTION_STATE';
}

export interface SetProtectionStateMessage {
  type: 'SET_PROTECTION_STATE';
  payload: {
    enabled: boolean;
  };
}

export interface GetCurrentDecisionMessage {
  type: 'GET_CURRENT_DECISION';
  payload?: {
    tabId?: number;
  };
}

export interface GetActiveTabInfoMessage {
  type: 'GET_ACTIVE_TAB_INFO';
}

export interface GetDashboardDataMessage {
  type: 'GET_DASHBOARD_DATA';
}

export interface ClearHistoryMessage {
  type: 'CLEAR_HISTORY';
}

export interface ShowDecisionMessage {
  type: 'SHOW_DECISION';
  payload: {
    decision: VerdictDecision;
  };
}

export interface DismissWarningMessage {
  type: 'DISMISS_WARNING';
  payload?: {
    decisionId?: string;
  };
}

export interface NavigateBackMessage {
  type: 'NAVIGATE_BACK';
}

export interface GetOverlayStateMessage {
  type: 'GET_OVERLAY_STATE';
}

export interface SetOverlayStateMessage {
  type: 'SET_OVERLAY_STATE';
  payload: {
    enabled: boolean;
  };
}

export interface AllowBypassMessage {
  type: 'ALLOW_BYPASS';
  payload: {
    url: string;
    decisionId?: string;
  };
}

export interface CheckBypassMessage {
  type: 'CHECK_BYPASS';
  payload: {
    url: string;
  };
}

export interface ClearBypassMessage {
  type: 'CLEAR_BYPASS';
  payload: {
    url: string;
  };
}

export type ExtensionMessage =
  | CollectSignalsMessage
  | SignalsCollectedMessage
  | GetProtectionStateMessage
  | SetProtectionStateMessage
  | GetOverlayStateMessage
  | SetOverlayStateMessage
  | GetCurrentDecisionMessage
  | GetActiveTabInfoMessage
  | GetDashboardDataMessage
  | ClearHistoryMessage
  | ShowDecisionMessage
  | DismissWarningMessage
  | NavigateBackMessage
  | AllowBypassMessage
  | CheckBypassMessage
  | ClearBypassMessage;

export interface DashboardData {
  protectionEnabled: boolean;
  activeTab: ActiveTabInfo | null;
  stats: ProtectionStats;
  recentEvents: ProtectionEventItem[];
  deviceId: string;
}

export interface MessageResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
