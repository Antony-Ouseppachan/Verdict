import { redactObject } from '../security/redaction.ts';
import { sanitizeAndNormalizeUrl } from '../security/url.ts';
import { VerdictSignalsSchema } from '../security/validation.ts';
import type { VerdictSignals } from '../shared/types/signals.ts';

export function sanitizeSignals(rawSignals: VerdictSignals): VerdictSignals {
  // 1. Normalize and clean URLs
  const normalizedUrl = sanitizeAndNormalizeUrl(rawSignals.page.url);
  const normalizedCanonical = rawSignals.page.canonicalUrl
    ? sanitizeAndNormalizeUrl(rawSignals.page.canonicalUrl)
    : undefined;

  // 2. Deep redact any sensitive keys/patterns
  const redacted = redactObject(rawSignals);

  // 3. Ensure sanitized URLs and structure
  const sanitized: VerdictSignals = {
    ...redacted,
    page: {
      ...redacted.page,
      url: normalizedUrl,
      canonicalUrl: normalizedCanonical,
      title: redacted.page.title.slice(0, 200),
      metaDescription: redacted.page.metaDescription?.slice(0, 300),
    },
    brand: {
      ...redacted.brand,
      claimedBrandName: redacted.brand.claimedBrandName?.slice(0, 100),
      copyrightClaim: redacted.brand.copyrightClaim?.slice(0, 150),
      logoAltTexts: redacted.brand.logoAltTexts.map((alt) => alt.slice(0, 100)),
    },
    // Ensure form inputs strictly only contain metadata, never values
    forms: redacted.forms.map((form) => ({
      action: form.action ? sanitizeAndNormalizeUrl(form.action) : undefined,
      method: form.method?.toUpperCase(),
      isHttpsAction: form.isHttpsAction,
      hasPasswordField: form.hasPasswordField,
      hasPaymentFields: form.hasPaymentFields,
      inputs: form.inputs.map((inp) => ({
        type: inp.type.slice(0, 30),
        nameAttribute: inp.nameAttribute ? inp.nameAttribute.slice(0, 50) : undefined,
        autocomplete: inp.autocomplete ? inp.autocomplete.slice(0, 50) : undefined,
        isRequired: inp.isRequired,
      })),
    })),
  };

  // 4. Validate output schema
  const parsed = VerdictSignalsSchema.parse(sanitized);
  return parsed;
}
