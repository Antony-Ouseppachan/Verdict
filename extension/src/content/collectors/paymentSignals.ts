import type { PaymentSignals } from '../../shared/types/signals.ts';

const KNOWN_GATEWAY_PATTERNS: Record<string, RegExp[]> = {
  Stripe: [/js\.stripe\.com/i, /stripe-elements/i, /__privateStripeFrame/i],
  PayPal: [/paypal\.com/i, /paypal-buttons/i, /braintree/i],
  Shopify: [/cdn\.shopify\.com/i, /shopify-payment-button/i],
  Square: [/squareupsandbox\.com/i, /squareup\.com/i, /sq-payment-form/i],
  Razorpay: [/razorpay\.com/i, /checkout\.razorpay/i],
  Adyen: [/adyen\.com/i, /adyen-checkout/i],
};

const CHECKOUT_BUTTON_KEYWORDS = [
  'checkout',
  'place order',
  'pay now',
  'complete order',
  'buy now',
  'proceed to pay',
];

const CURRENCY_SYMBOLS = ['$', '€', '£', '¥', '₹', '₩', 'R$', 'CHF', 'CAD', 'AUD'];

export function collectPaymentSignals(doc: Document = document): PaymentSignals {
  // 1. Detect iframe payment sources & scripts
  const iframes = Array.from(doc.querySelectorAll('iframe'));
  const scripts = Array.from(doc.querySelectorAll('script[src]'));
  const detectedGateways = new Set<string>();

  const iframeSrcs = iframes.map((f) => f.getAttribute('src') || '');
  const scriptSrcs = scripts.map((s) => s.getAttribute('src') || '');
  const allExternalSrcs = [...iframeSrcs, ...scriptSrcs];

  for (const [gateway, patterns] of Object.entries(KNOWN_GATEWAY_PATTERNS)) {
    for (const src of allExternalSrcs) {
      if (patterns.some((pattern) => pattern.test(src))) {
        detectedGateways.add(gateway);
      }
    }
  }

  // 2. Detect payment forms
  const hasCardInputs =
    doc.querySelector(
      'input[name*="card" i], input[name*="cvv" i], input[name*="cvc" i], input[autocomplete*="cc-" i], input[placeholder*="1234" i], input[placeholder*="•••" i]'
    ) !== null;

  const hasPaymentForm =
    detectedGateways.size > 0 ||
    hasCardInputs ||
    doc.querySelector(
      'form[action*="checkout"], form[action*="pay"], form[class*="checkout"], form[id*="checkout"], form[class*="payment"], form[id*="payment"]'
    ) !== null;

  // 3. Detect checkout buttons
  const buttons = Array.from(doc.querySelectorAll('button, input[type="submit"], a.button, a.btn'));
  const hasCheckoutButton = buttons.some((btn) => {
    const text = (btn.textContent || btn.getAttribute('value') || '').toLowerCase().trim();
    return CHECKOUT_BUTTON_KEYWORDS.some((kw) => text.includes(kw));
  });

  // 4. Detect cart indicator
  const hasCartIndicator =
    doc.querySelector('[class*="cart"], [id*="cart"], [aria-label*="cart" i]') !== null;

  // 5. Detect visible currency symbols (sample top elements)
  const bodyTextSample = (doc.body?.innerText || '').slice(0, 5000);
  const currencySymbolsDetected = CURRENCY_SYMBOLS.filter((symbol) =>
    bodyTextSample.includes(symbol)
  );

  // 6. Detect fake gateway impersonation (claimed branding without official SDK)
  const claimedGateways = new Set<string>();
  const lowerBodyText = bodyTextSample.toLowerCase();
  const images = Array.from(doc.querySelectorAll('img, svg, [class*="logo" i]'));

  for (const gateway of Object.keys(KNOWN_GATEWAY_PATTERNS)) {
    const gwLower = gateway.toLowerCase();
    const hasTextClaim = lowerBodyText.includes(gwLower);
    const hasImgClaim = images.some((img) => {
      const alt = (img.getAttribute('alt') || '').toLowerCase();
      const src = (img.getAttribute('src') || '').toLowerCase();
      const className = (img.getAttribute('class') || '').toLowerCase();
      return alt.includes(gwLower) || src.includes(gwLower) || className.includes(gwLower);
    });

    if (hasTextClaim || hasImgClaim) {
      claimedGateways.add(gateway);
    }
  }

  const isFakeGatewayImpersonation =
    claimedGateways.size > 0 &&
    Array.from(claimedGateways).some((gw) => !detectedGateways.has(gw));

  if (isFakeGatewayImpersonation) {
    console.log('[Verdict] Fake payment gateway impersonation detected:', {
      claimed: Array.from(claimedGateways),
      verifiedSDKs: Array.from(detectedGateways),
    });
  }

  return {
    hasPaymentForm,
    detectedGateways: Array.from(detectedGateways),
    hasCheckoutButton,
    hasCartIndicator,
    currencySymbolsDetected,
    isFakeGatewayImpersonation,
    claimedGateways: Array.from(claimedGateways),
  };
}
