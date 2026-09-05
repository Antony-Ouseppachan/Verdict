import type { FormMetadata } from '../../shared/types/signals.ts';

const PAYMENT_INPUT_NAMES = [
  'card',
  'cc-number',
  'cc-exp',
  'cc-cvc',
  'cvv',
  'cvc',
  'cardnumber',
  'exp-date',
];

export function collectFormMetadata(doc: Document = document): FormMetadata[] {
  const forms = Array.from(doc.querySelectorAll('form'));

  return forms.slice(0, 10).map((form) => {
    const action = form.getAttribute('action') || undefined;
    const method = form.getAttribute('method') || 'GET';
    const isHttpsAction = action ? action.startsWith('https:') : true;

    const inputElements = Array.from(
      form.querySelectorAll('input, select, textarea')
    ) as (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[];

    let hasPasswordField = false;
    let hasPaymentFields = false;

    const inputs = inputElements.slice(0, 20).map((el) => {
      const type = (el.getAttribute('type') || el.tagName.toLowerCase()).toLowerCase();
      const nameAttribute = el.getAttribute('name') || undefined;
      const idAttribute = el.getAttribute('id') || undefined;
      const placeholder = (el.getAttribute('placeholder') || '').toLowerCase();
      const autocomplete = el.getAttribute('autocomplete') || undefined;
      const isRequired = el.hasAttribute('required');

      if (type === 'password' || autocomplete?.includes('current-password') || autocomplete?.includes('new-password')) {
        hasPasswordField = true;
      }

      const isPaymentNamed =
        (nameAttribute && PAYMENT_INPUT_NAMES.some((pn) => nameAttribute.toLowerCase().includes(pn))) ||
        (idAttribute && PAYMENT_INPUT_NAMES.some((pn) => idAttribute.toLowerCase().includes(pn))) ||
        (autocomplete && autocomplete.toLowerCase().includes('cc-')) ||
        placeholder.includes('1234') ||
        placeholder.includes('•••') ||
        placeholder.includes('cvv') ||
        placeholder.includes('cvc') ||
        placeholder.includes('mm/yy');

      if (isPaymentNamed) {
        hasPaymentFields = true;
      }

      // STRICT PRIVACY GUARANTEE: NEVER ACCESS el.value OR SENSITIVE TEXT
      return {
        type,
        nameAttribute,
        autocomplete,
        isRequired,
      };
    });

    return {
      action,
      method,
      isHttpsAction,
      inputs,
      hasPasswordField,
      hasPaymentFields,
    };
  });
}
