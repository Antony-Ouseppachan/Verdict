import type { PageSignals } from '../../shared/types/signals.ts';

export function collectPageMetadata(doc: Document = document, win: Window = window): PageSignals {
  const url = win.location.href;
  const origin = win.location.origin;
  const hostname = win.location.hostname;
  const protocol = win.location.protocol;
  const title = doc.title || '';

  const canonicalEl = doc.querySelector('link[rel="canonical"]');
  const canonicalUrl = canonicalEl ? canonicalEl.getAttribute('href') || undefined : undefined;

  const metaDescEl = doc.querySelector('meta[name="description"]');
  const metaDescription = metaDescEl ? metaDescEl.getAttribute('content') || undefined : undefined;

  const hasSsl = protocol === 'https:';

  return {
    url,
    origin,
    hostname,
    protocol,
    title,
    canonicalUrl,
    metaDescription,
    hasSsl,
  };
}
