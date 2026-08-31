import type { BrandSignals } from '../../shared/types/signals.ts';

export function collectBrandSignals(doc: Document = document): BrandSignals {
  // 1. Claimed brand name from OpenGraph, schema.org or document structure
  let claimedBrandName: string | undefined;

  const ogSiteName = doc.querySelector('meta[property="og:site_name"]');
  if (ogSiteName) {
    claimedBrandName = ogSiteName.getAttribute('content') || undefined;
  }

  if (!claimedBrandName) {
    const metaAppTitle = doc.querySelector('meta[name="application-name"]');
    if (metaAppTitle) {
      claimedBrandName = metaAppTitle.getAttribute('content') || undefined;
    }
  }

  // 2. Copyright claim in footer
  let copyrightClaim: string | undefined;
  const footerElements = Array.from(
    doc.querySelectorAll('footer, [class*="footer"], [id*="footer"], [class*="copyright"]')
  );

  for (const el of footerElements) {
    const text = el.textContent || '';
    if (text.includes('©') || /copyright/i.test(text)) {
      const match = text.match(/(?:©|copyright)\s*[\d\s–-]+([A-Za-z0-9\s.,&'-]{2,50})/i);
      if (match && match[1]) {
        copyrightClaim = match[1].trim();
        break;
      }
    }
  }

  // 3. Logo alt texts
  const logoImgs = Array.from(
    doc.querySelectorAll('img[class*="logo" i], img[id*="logo" i], [class*="brand" i] img, header img')
  );
  const logoAltTexts = logoImgs
    .map((img) => img.getAttribute('alt') || '')
    .filter((alt) => alt.trim().length > 0)
    .slice(0, 5);

  // 4. Favicon URL
  const faviconEl = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
  const faviconUrl = faviconEl ? faviconEl.getAttribute('href') || undefined : undefined;

  return {
    claimedBrandName,
    copyrightClaim,
    logoAltTexts,
    faviconUrl,
  };
}
