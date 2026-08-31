import { COLLECTOR_VERSION, SCHEMA_VERSION } from '../shared/constants/index.ts';
import type { SecuritySignals, VerdictSignals } from '../shared/types/signals.ts';
import { collectBrandSignals } from '../content/collectors/brandSignals.ts';
import { collectFormMetadata } from '../content/collectors/forms.ts';
import { collectNavigationSignals } from '../content/collectors/navigationSignals.ts';
import { collectPageMetadata } from '../content/collectors/pageMetadata.ts';
import { collectPaymentSignals } from '../content/collectors/paymentSignals.ts';

export function collectSecuritySignals(win: Window = window): SecuritySignals {
  const isSecureContext = Boolean(win.isSecureContext);
  const protocol = win.location.protocol;

  return {
    isSecureContext,
    protocol,
    hasMixedContentWarnings: false,
    hasCertificateIssue: false,
  };
}

export function collectAllSignals(
  doc: Document = document,
  win: Window = window,
  deviceId?: string
): VerdictSignals {
  const page = collectPageMetadata(doc, win);
  const forms = collectFormMetadata(doc);
  const payment = collectPaymentSignals(doc);
  const navigation = collectNavigationSignals(doc, win);
  const brand = collectBrandSignals(doc);
  const security = collectSecuritySignals(win);

  return {
    schemaVersion: SCHEMA_VERSION,
    collectorVersion: COLLECTOR_VERSION,
    timestamp: Date.now(),
    deviceId,
    page,
    forms,
    payment,
    navigation,
    brand,
    security,
  };
}
