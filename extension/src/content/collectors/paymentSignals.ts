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
  const hasPaymentForm =
    detectedGateways.size > 0 ||
    doc.querySelector(
      'form[action*="checkout"], form[action*="pay"], form[class*="checkout"], form[id*="checkout"]'
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

  return {
    hasPaymentForm,
    detectedGateways: Array.from(detectedGateways),
    hasCheckoutButton,
    hasCartIndicator,
    currencySymbolsDetected,
  };
}
