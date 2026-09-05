"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // src/shared/constants/index.ts
  var SCHEMA_VERSION = "1.0.0";
  var COLLECTOR_VERSION = "0.1.0";

  // src/content/collectors/brandSignals.ts
  function collectBrandSignals(doc = document) {
    let claimedBrandName;
    const ogSiteName = doc.querySelector('meta[property="og:site_name"]');
    if (ogSiteName) {
      claimedBrandName = ogSiteName.getAttribute("content") || void 0;
    }
    if (!claimedBrandName) {
      const metaAppTitle = doc.querySelector('meta[name="application-name"]');
      if (metaAppTitle) {
        claimedBrandName = metaAppTitle.getAttribute("content") || void 0;
      }
    }
    let copyrightClaim;
    const footerElements = Array.from(
      doc.querySelectorAll('footer, [class*="footer"], [id*="footer"], [class*="copyright"]')
    );
    for (const el of footerElements) {
      const text = el.textContent || "";
      if (text.includes("\xA9") || /copyright/i.test(text)) {
        const match = text.match(/(?:©|copyright)\s*[\d\s–-]+([A-Za-z0-9\s.,&'-]{2,50})/i);
        if (match && match[1]) {
          copyrightClaim = match[1].trim();
          break;
        }
      }
    }
    const logoImgs = Array.from(
      doc.querySelectorAll('img[class*="logo" i], img[id*="logo" i], [class*="brand" i] img, header img')
    );
    const logoAltTexts = logoImgs.map((img) => img.getAttribute("alt") || "").filter((alt) => alt.trim().length > 0).slice(0, 5);
    const faviconEl = doc.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    const faviconUrl = faviconEl ? faviconEl.getAttribute("href") || void 0 : void 0;
    return {
      claimedBrandName,
      copyrightClaim,
      logoAltTexts,
      faviconUrl
    };
  }

  // src/content/collectors/forms.ts
  var PAYMENT_INPUT_NAMES = [
    "card",
    "cc-number",
    "cc-exp",
    "cc-cvc",
    "cvv",
    "cvc",
    "cardnumber",
    "exp-date"
  ];
  function collectFormMetadata(doc = document) {
    const forms = Array.from(doc.querySelectorAll("form"));
    return forms.slice(0, 10).map((form) => {
      const action = form.getAttribute("action") || void 0;
      const method = form.getAttribute("method") || "GET";
      const isHttpsAction = action ? action.startsWith("https:") : true;
      const inputElements = Array.from(
        form.querySelectorAll("input, select, textarea")
      );
      let hasPasswordField = false;
      let hasPaymentFields = false;
      const inputs = inputElements.slice(0, 20).map((el) => {
        const type = (el.getAttribute("type") || el.tagName.toLowerCase()).toLowerCase();
        const nameAttribute = el.getAttribute("name") || void 0;
        const idAttribute = el.getAttribute("id") || void 0;
        const placeholder = (el.getAttribute("placeholder") || "").toLowerCase();
        const autocomplete = el.getAttribute("autocomplete") || void 0;
        const isRequired = el.hasAttribute("required");
        if (type === "password" || autocomplete?.includes("current-password") || autocomplete?.includes("new-password")) {
          hasPasswordField = true;
        }
        const isPaymentNamed = nameAttribute && PAYMENT_INPUT_NAMES.some((pn) => nameAttribute.toLowerCase().includes(pn)) || idAttribute && PAYMENT_INPUT_NAMES.some((pn) => idAttribute.toLowerCase().includes(pn)) || autocomplete && autocomplete.toLowerCase().includes("cc-") || placeholder.includes("1234") || placeholder.includes("\u2022\u2022\u2022") || placeholder.includes("cvv") || placeholder.includes("cvc") || placeholder.includes("mm/yy");
        if (isPaymentNamed) {
          hasPaymentFields = true;
        }
        return {
          type,
          nameAttribute,
          autocomplete,
          isRequired
        };
      });
      return {
        action,
        method,
        isHttpsAction,
        inputs,
        hasPasswordField,
        hasPaymentFields
      };
    });
  }

  // src/content/collectors/navigationSignals.ts
  function collectNavigationSignals(doc = document, win = window) {
    const referrer = doc.referrer || "";
    const isIframe = win.self !== win.top;
    let frameDepth = 0;
    try {
      let currentWin = win;
      while (currentWin !== currentWin.parent && frameDepth < 10) {
        frameDepth++;
        currentWin = currentWin.parent;
      }
    } catch {
      frameDepth = Math.max(1, frameDepth);
    }
    const hasHistoryTransitions = Boolean(win.history && win.history.length > 1);
    return {
      referrer,
      isIframe,
      frameDepth,
      hasHistoryTransitions
    };
  }

  // src/content/collectors/pageMetadata.ts
  function collectPageMetadata(doc = document, win = window) {
    const url = win.location.href;
    const origin = win.location.origin;
    const hostname = win.location.hostname;
    const protocol = win.location.protocol;
    const title = doc.title || "";
    const canonicalEl = doc.querySelector('link[rel="canonical"]');
    const canonicalUrl = canonicalEl ? canonicalEl.getAttribute("href") || void 0 : void 0;
    const metaDescEl = doc.querySelector('meta[name="description"]');
    const metaDescription = metaDescEl ? metaDescEl.getAttribute("content") || void 0 : void 0;
    const hasSsl = protocol === "https:";
    return {
      url,
      origin,
      hostname,
      protocol,
      title,
      canonicalUrl,
      metaDescription,
      hasSsl
    };
  }

  // src/content/collectors/paymentSignals.ts
  var KNOWN_GATEWAY_PATTERNS = {
    Stripe: [/js\.stripe\.com/i, /stripe-elements/i, /__privateStripeFrame/i],
    PayPal: [/paypal\.com/i, /paypal-buttons/i, /braintree/i],
    Shopify: [/cdn\.shopify\.com/i, /shopify-payment-button/i],
    Square: [/squareupsandbox\.com/i, /squareup\.com/i, /sq-payment-form/i],
    Razorpay: [/razorpay\.com/i, /checkout\.razorpay/i],
    Adyen: [/adyen\.com/i, /adyen-checkout/i]
  };
  var CHECKOUT_BUTTON_KEYWORDS = [
    "checkout",
    "place order",
    "pay now",
    "complete order",
    "buy now",
    "proceed to pay"
  ];
  var CURRENCY_SYMBOLS = ["$", "\u20AC", "\xA3", "\xA5", "\u20B9", "\u20A9", "R$", "CHF", "CAD", "AUD"];
  function collectPaymentSignals(doc = document) {
    const iframes = Array.from(doc.querySelectorAll("iframe"));
    const scripts = Array.from(doc.querySelectorAll("script[src]"));
    const detectedGateways = /* @__PURE__ */ new Set();
    const iframeSrcs = iframes.map((f) => f.getAttribute("src") || "");
    const scriptSrcs = scripts.map((s) => s.getAttribute("src") || "");
    const allExternalSrcs = [...iframeSrcs, ...scriptSrcs];
    for (const [gateway, patterns] of Object.entries(KNOWN_GATEWAY_PATTERNS)) {
      for (const src of allExternalSrcs) {
        if (patterns.some((pattern) => pattern.test(src))) {
          detectedGateways.add(gateway);
        }
      }
    }
    const hasCardInputs = doc.querySelector(
      'input[name*="card" i], input[name*="cvv" i], input[name*="cvc" i], input[autocomplete*="cc-" i], input[placeholder*="1234" i], input[placeholder*="\u2022\u2022\u2022" i]'
    ) !== null;
    const hasPaymentForm = detectedGateways.size > 0 || hasCardInputs || doc.querySelector(
      'form[action*="checkout"], form[action*="pay"], form[class*="checkout"], form[id*="checkout"], form[class*="payment"], form[id*="payment"]'
    ) !== null;
    const buttons = Array.from(doc.querySelectorAll('button, input[type="submit"], a.button, a.btn'));
    const hasCheckoutButton = buttons.some((btn) => {
      const text = (btn.textContent || btn.getAttribute("value") || "").toLowerCase().trim();
      return CHECKOUT_BUTTON_KEYWORDS.some((kw) => text.includes(kw));
    });
    const hasCartIndicator = doc.querySelector('[class*="cart"], [id*="cart"], [aria-label*="cart" i]') !== null;
    const bodyTextSample = (doc.body?.innerText || "").slice(0, 5e3);
    const currencySymbolsDetected = CURRENCY_SYMBOLS.filter(
      (symbol) => bodyTextSample.includes(symbol)
    );
    const claimedGateways = /* @__PURE__ */ new Set();
    const lowerBodyText = bodyTextSample.toLowerCase();
    const images = Array.from(doc.querySelectorAll('img, svg, [class*="logo" i]'));
    for (const gateway of Object.keys(KNOWN_GATEWAY_PATTERNS)) {
      const gwLower = gateway.toLowerCase();
      const hasTextClaim = lowerBodyText.includes(gwLower);
      const hasImgClaim = images.some((img) => {
        const alt = (img.getAttribute("alt") || "").toLowerCase();
        const src = (img.getAttribute("src") || "").toLowerCase();
        const className = (img.getAttribute("class") || "").toLowerCase();
        return alt.includes(gwLower) || src.includes(gwLower) || className.includes(gwLower);
      });
      if (hasTextClaim || hasImgClaim) {
        claimedGateways.add(gateway);
      }
    }
    const isFakeGatewayImpersonation = claimedGateways.size > 0 && Array.from(claimedGateways).some((gw) => !detectedGateways.has(gw));
    if (isFakeGatewayImpersonation) {
      console.log("[Verdict] Fake payment gateway impersonation detected:", {
        claimed: Array.from(claimedGateways),
        verifiedSDKs: Array.from(detectedGateways)
      });
    }
    return {
      hasPaymentForm,
      detectedGateways: Array.from(detectedGateways),
      hasCheckoutButton,
      hasCartIndicator,
      currencySymbolsDetected,
      isFakeGatewayImpersonation,
      claimedGateways: Array.from(claimedGateways)
    };
  }

  // src/collectors/collector.ts
  function collectSecuritySignals(win = window) {
    const isSecureContext = Boolean(win.isSecureContext);
    const protocol = win.location.protocol;
    return {
      isSecureContext,
      protocol,
      hasMixedContentWarnings: false,
      hasCertificateIssue: false
    };
  }
  function collectAllSignals(doc = document, win = window, deviceId) {
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
      security
    };
  }

  // src/security/redaction.ts
  var ALLOWED_METADATA_KEYS = /* @__PURE__ */ new Set([
    "schemaVersion",
    "collectorVersion",
    "hasPasswordField",
    "hasPaymentFields",
    "hasPaymentForm",
    "detectedGateways",
    "hasCheckoutButton",
    "hasCartIndicator",
    "currencySymbolsDetected",
    "hasHistoryTransitions",
    "hasMixedContentWarnings",
    "hasCertificateIssue"
  ]);
  var SENSITIVE_KEY_PATTERNS = [
    /(^|[_-])pass(word)?([_-]|$)/i,
    /password/i,
    /secret/i,
    /token/i,
    /auth(orization)?/i,
    /bearer/i,
    /card(_)?(number|num|no)?/i,
    /cc(_)?(number|num|no|exp|cvv|cvc)?/i,
    /cvv/i,
    /cvc/i,
    /exp(ir(y|ation))?/i,
    /exp(_)?date/i,
    /(^|[_-])exp([_-]|$)/i,
    /(^|[_-])pan([_-]|$)/i,
    /(^|[_-])ssn([_-]|$)/i,
    /(^|[_-])pin([_-]|$)/i,
    /credit(_)?card/i,
    /account(_)?(number|no)/i,
    /(^|[_-])cookie([_-]|$)/i,
    /session(_)?(id)?/i,
    /jwt/i,
    /api(_)?key/i,
    /private(_)?key/i
  ];
  var SENSITIVE_VALUE_PATTERNS = [
    // Credit card format (Luhn candidates with/without dashes)
    /\b(?:\d{4}[ -]?){3}\d{4}\b/,
    // 3 or 4 digit CVV/CVC
    /\b\d{3,4}\b/,
    // Bearer tokens or JWTs (header.payload.signature where parts are base64 >= 10 chars)
    /^[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_]+$/,
    // Hex/Base64 API keys or hashes > 24 chars
    /^[a-fA-F0-9]{32,64}$/
  ];
  function isSensitiveKey(key) {
    if (ALLOWED_METADATA_KEYS.has(key)) {
      return false;
    }
    return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
  }
  function isSensitiveValue(value) {
    if (!value || typeof value !== "string") return false;
    const trimmed = value.trim();
    if (trimmed.length === 0) return false;
    return SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(trimmed));
  }
  function sanitizeString(value) {
    if (!value || typeof value !== "string") return "";
    let sanitized = value;
    sanitized = sanitized.replace(/\b(?:\d{4}[ -]?){3}\d{4}\b/g, "[REDACTED_CARD]");
    if (sanitized.length > 500) {
      sanitized = sanitized.substring(0, 500) + "...";
    }
    return sanitized;
  }
  function redactObject(obj) {
    if (obj === null || obj === void 0) {
      return obj;
    }
    if (typeof obj === "string") {
      return sanitizeString(obj);
    }
    if (typeof obj !== "object") {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => redactObject(item));
    }
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      if (isSensitiveKey(key)) {
        continue;
      }
      if (typeof value === "object" && value !== null) {
        result[key] = redactObject(value);
      } else if (typeof value === "string") {
        if (isSensitiveValue(value)) {
          continue;
        }
        result[key] = sanitizeString(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  // src/security/url.ts
  var INTERNAL_PROTOCOLS = /* @__PURE__ */ new Set([
    "chrome:",
    "chrome-extension:",
    "chrome-untrusted:",
    "edge:",
    "about:",
    "devtools:",
    "view-source:",
    "brave:",
    "opera:",
    "vivaldi:"
  ]);
  var UNSUPPORTED_PROTOCOLS = /* @__PURE__ */ new Set([
    "file:",
    "data:",
    "javascript:",
    "blob:",
    "mailto:",
    "tel:",
    "ftp:",
    "ws:",
    "wss:"
  ]);
  var SENSITIVE_QUERY_PARAM_PATTERNS = [
    /token/i,
    /auth/i,
    /key/i,
    /pass(word)?/i,
    /pwd/i,
    /secret/i,
    /session/i,
    /jwt/i,
    /code/i,
    /state/i,
    /bearer/i,
    /credential/i
  ];
  var TRACKING_QUERY_PARAMS_PREFIXES = ["utm_", "fbclid", "gclid", "msclkid", "mc_eid"];
  var SEARCH_ENGINE_HOST_REGEXES = [
    /^(.*\.)?google\.(com|co\.[a-z]{2}|[a-z]{2,3})$/i,
    /^(.*\.)?bing\.com$/i,
    /^(.*\.)?duckduckgo\.com$/i,
    /^(.*\.)?yahoo\.com$/i,
    /^(.*\.)?ecosia\.org$/i,
    /^(.*\.)?yandex\.(com|ru|by|kz|uz)$/i,
    /^(.*\.)?baidu\.com$/i,
    /^(.*\.)?search\.brave\.com$/i,
    /^(.*\.)?kagi\.com$/i,
    /^(.*\.)?startpage\.com$/i,
    /^(.*\.)?qwant\.com$/i,
    /^(.*\.)?ask\.com$/i,
    /^(.*\.)?search\.naver\.com$/i,
    /^(.*\.)?search\.aol\.com$/i,
    /^(.*\.)?searx\.[a-z]+$/i
  ];
  function classifyPage(rawUrl) {
    if (!rawUrl || typeof rawUrl !== "string") {
      return "UNSUPPORTED_PAGE";
    }
    try {
      const parsed = new URL(rawUrl);
      if (INTERNAL_PROTOCOLS.has(parsed.protocol)) {
        return "INTERNAL_BROWSER_PAGE";
      }
      if (UNSUPPORTED_PROTOCOLS.has(parsed.protocol)) {
        return "UNSUPPORTED_PAGE";
      }
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return "UNSUPPORTED_PAGE";
      }
      if (isLocalhostUrl(rawUrl)) {
        return "INTERNAL_BROWSER_PAGE";
      }
      if (isSearchEngineHost(parsed.hostname)) {
        return "SEARCH_ENGINE";
      }
      return "NORMAL_WEBSITE";
    } catch {
      return "UNSUPPORTED_PAGE";
    }
  }
  function isSearchEngineHost(hostname) {
    const normalized = hostname.toLowerCase();
    return SEARCH_ENGINE_HOST_REGEXES.some((regex) => regex.test(normalized));
  }
  function isValidBrowsingUrl(rawUrl) {
    return classifyPage(rawUrl) === "NORMAL_WEBSITE";
  }
  function sanitizeAndNormalizeUrl(rawUrl) {
    try {
      const parsed = new URL(rawUrl);
      const searchParams = new URLSearchParams(parsed.search);
      const keysToRemove = [];
      searchParams.forEach((_, key) => {
        const lowerKey = key.toLowerCase();
        if (SENSITIVE_QUERY_PARAM_PATTERNS.some((pattern) => pattern.test(lowerKey)) || TRACKING_QUERY_PARAMS_PREFIXES.some((prefix) => lowerKey.startsWith(prefix))) {
          keysToRemove.push(key);
        }
      });
      keysToRemove.forEach((k) => searchParams.delete(k));
      parsed.search = searchParams.toString();
      parsed.hash = "";
      return parsed.toString();
    } catch {
      return rawUrl;
    }
  }
  function isLocalhostUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== "string") return false;
    if (rawUrl.includes("/payment-test/") || rawUrl.includes("test-phish") || rawUrl.includes("verdict-test")) {
      return false;
    }
    try {
      const parsed = new URL(rawUrl);
      const host = parsed.hostname.toLowerCase();
      return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "[::1]" || host.endsWith(".local") || host.endsWith(".localhost") || rawUrl.includes("localhost:") || rawUrl.includes("127.0.0.1:");
    } catch {
      return false;
    }
  }

  // node_modules/zod/v3/external.js
  var external_exports = {};
  __export(external_exports, {
    BRAND: () => BRAND,
    DIRTY: () => DIRTY,
    EMPTY_PATH: () => EMPTY_PATH,
    INVALID: () => INVALID,
    NEVER: () => NEVER,
    OK: () => OK,
    ParseStatus: () => ParseStatus,
    Schema: () => ZodType,
    ZodAny: () => ZodAny,
    ZodArray: () => ZodArray,
    ZodBigInt: () => ZodBigInt,
    ZodBoolean: () => ZodBoolean,
    ZodBranded: () => ZodBranded,
    ZodCatch: () => ZodCatch,
    ZodDate: () => ZodDate,
    ZodDefault: () => ZodDefault,
    ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
    ZodEffects: () => ZodEffects,
    ZodEnum: () => ZodEnum,
    ZodError: () => ZodError,
    ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
    ZodFunction: () => ZodFunction,
    ZodIntersection: () => ZodIntersection,
    ZodIssueCode: () => ZodIssueCode,
    ZodLazy: () => ZodLazy,
    ZodLiteral: () => ZodLiteral,
    ZodMap: () => ZodMap,
    ZodNaN: () => ZodNaN,
    ZodNativeEnum: () => ZodNativeEnum,
    ZodNever: () => ZodNever,
    ZodNull: () => ZodNull,
    ZodNullable: () => ZodNullable,
    ZodNumber: () => ZodNumber,
    ZodObject: () => ZodObject,
    ZodOptional: () => ZodOptional,
    ZodParsedType: () => ZodParsedType,
    ZodPipeline: () => ZodPipeline,
    ZodPromise: () => ZodPromise,
    ZodReadonly: () => ZodReadonly,
    ZodRecord: () => ZodRecord,
    ZodSchema: () => ZodType,
    ZodSet: () => ZodSet,
    ZodString: () => ZodString,
    ZodSymbol: () => ZodSymbol,
    ZodTransformer: () => ZodEffects,
    ZodTuple: () => ZodTuple,
    ZodType: () => ZodType,
    ZodUndefined: () => ZodUndefined,
    ZodUnion: () => ZodUnion,
    ZodUnknown: () => ZodUnknown,
    ZodVoid: () => ZodVoid,
    addIssueToContext: () => addIssueToContext,
    any: () => anyType,
    array: () => arrayType,
    bigint: () => bigIntType,
    boolean: () => booleanType,
    coerce: () => coerce,
    custom: () => custom,
    date: () => dateType,
    datetimeRegex: () => datetimeRegex,
    defaultErrorMap: () => en_default,
    discriminatedUnion: () => discriminatedUnionType,
    effect: () => effectsType,
    enum: () => enumType,
    function: () => functionType,
    getErrorMap: () => getErrorMap,
    getParsedType: () => getParsedType,
    instanceof: () => instanceOfType,
    intersection: () => intersectionType,
    isAborted: () => isAborted,
    isAsync: () => isAsync,
    isDirty: () => isDirty,
    isValid: () => isValid,
    late: () => late,
    lazy: () => lazyType,
    literal: () => literalType,
    makeIssue: () => makeIssue,
    map: () => mapType,
    nan: () => nanType,
    nativeEnum: () => nativeEnumType,
    never: () => neverType,
    null: () => nullType,
    nullable: () => nullableType,
    number: () => numberType,
    object: () => objectType,
    objectUtil: () => objectUtil,
    oboolean: () => oboolean,
    onumber: () => onumber,
    optional: () => optionalType,
    ostring: () => ostring,
    pipeline: () => pipelineType,
    preprocess: () => preprocessType,
    promise: () => promiseType,
    quotelessJson: () => quotelessJson,
    record: () => recordType,
    set: () => setType,
    setErrorMap: () => setErrorMap,
    strictObject: () => strictObjectType,
    string: () => stringType,
    symbol: () => symbolType,
    transformer: () => effectsType,
    tuple: () => tupleType,
    undefined: () => undefinedType,
    union: () => unionType,
    unknown: () => unknownType,
    util: () => util,
    void: () => voidType
  });

  // node_modules/zod/v3/helpers/util.js
  var util;
  (function(util2) {
    util2.assertEqual = (_) => {
    };
    function assertIs(_arg) {
    }
    util2.assertIs = assertIs;
    function assertNever(_x) {
      throw new Error();
    }
    util2.assertNever = assertNever;
    util2.arrayToEnum = (items) => {
      const obj = {};
      for (const item of items) {
        obj[item] = item;
      }
      return obj;
    };
    util2.getValidEnumValues = (obj) => {
      const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
      const filtered = {};
      for (const k of validKeys) {
        filtered[k] = obj[k];
      }
      return util2.objectValues(filtered);
    };
    util2.objectValues = (obj) => {
      return util2.objectKeys(obj).map(function(e) {
        return obj[e];
      });
    };
    util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
      const keys = [];
      for (const key in object) {
        if (Object.prototype.hasOwnProperty.call(object, key)) {
          keys.push(key);
        }
      }
      return keys;
    };
    util2.find = (arr, checker) => {
      for (const item of arr) {
        if (checker(item))
          return item;
      }
      return void 0;
    };
    util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
    function joinValues(array, separator = " | ") {
      return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
    }
    util2.joinValues = joinValues;
    util2.jsonStringifyReplacer = (_, value) => {
      if (typeof value === "bigint") {
        return value.toString();
      }
      return value;
    };
  })(util || (util = {}));
  var objectUtil;
  (function(objectUtil2) {
    objectUtil2.mergeShapes = (first, second) => {
      return {
        ...first,
        ...second
        // second overwrites first
      };
    };
  })(objectUtil || (objectUtil = {}));
  var ZodParsedType = util.arrayToEnum([
    "string",
    "nan",
    "number",
    "integer",
    "float",
    "boolean",
    "date",
    "bigint",
    "symbol",
    "function",
    "undefined",
    "null",
    "array",
    "object",
    "unknown",
    "promise",
    "void",
    "never",
    "map",
    "set"
  ]);
  var getParsedType = (data) => {
    const t2 = typeof data;
    switch (t2) {
      case "undefined":
        return ZodParsedType.undefined;
      case "string":
        return ZodParsedType.string;
      case "number":
        return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
      case "boolean":
        return ZodParsedType.boolean;
      case "function":
        return ZodParsedType.function;
      case "bigint":
        return ZodParsedType.bigint;
      case "symbol":
        return ZodParsedType.symbol;
      case "object":
        if (Array.isArray(data)) {
          return ZodParsedType.array;
        }
        if (data === null) {
          return ZodParsedType.null;
        }
        if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
          return ZodParsedType.promise;
        }
        if (typeof Map !== "undefined" && data instanceof Map) {
          return ZodParsedType.map;
        }
        if (typeof Set !== "undefined" && data instanceof Set) {
          return ZodParsedType.set;
        }
        if (typeof Date !== "undefined" && data instanceof Date) {
          return ZodParsedType.date;
        }
        return ZodParsedType.object;
      default:
        return ZodParsedType.unknown;
    }
  };

  // node_modules/zod/v3/ZodError.js
  var ZodIssueCode = util.arrayToEnum([
    "invalid_type",
    "invalid_literal",
    "custom",
    "invalid_union",
    "invalid_union_discriminator",
    "invalid_enum_value",
    "unrecognized_keys",
    "invalid_arguments",
    "invalid_return_type",
    "invalid_date",
    "invalid_string",
    "too_small",
    "too_big",
    "invalid_intersection_types",
    "not_multiple_of",
    "not_finite"
  ]);
  var quotelessJson = (obj) => {
    const json = JSON.stringify(obj, null, 2);
    return json.replace(/"([^"]+)":/g, "$1:");
  };
  var ZodError = class _ZodError extends Error {
    get errors() {
      return this.issues;
    }
    constructor(issues) {
      super();
      this.issues = [];
      this.addIssue = (sub) => {
        this.issues = [...this.issues, sub];
      };
      this.addIssues = (subs = []) => {
        this.issues = [...this.issues, ...subs];
      };
      const actualProto = new.target.prototype;
      if (Object.setPrototypeOf) {
        Object.setPrototypeOf(this, actualProto);
      } else {
        this.__proto__ = actualProto;
      }
      this.name = "ZodError";
      this.issues = issues;
    }
    format(_mapper) {
      const mapper = _mapper || function(issue) {
        return issue.message;
      };
      const fieldErrors = { _errors: [] };
      const processError = (error) => {
        for (const issue of error.issues) {
          if (issue.code === "invalid_union") {
            issue.unionErrors.map(processError);
          } else if (issue.code === "invalid_return_type") {
            processError(issue.returnTypeError);
          } else if (issue.code === "invalid_arguments") {
            processError(issue.argumentsError);
          } else if (issue.path.length === 0) {
            fieldErrors._errors.push(mapper(issue));
          } else {
            let curr = fieldErrors;
            let i = 0;
            while (i < issue.path.length) {
              const el = issue.path[i];
              const terminal = i === issue.path.length - 1;
              if (!terminal) {
                curr[el] = curr[el] || { _errors: [] };
              } else {
                curr[el] = curr[el] || { _errors: [] };
                curr[el]._errors.push(mapper(issue));
              }
              curr = curr[el];
              i++;
            }
          }
        }
      };
      processError(this);
      return fieldErrors;
    }
    static assert(value) {
      if (!(value instanceof _ZodError)) {
        throw new Error(`Not a ZodError: ${value}`);
      }
    }
    toString() {
      return this.message;
    }
    get message() {
      return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
    }
    get isEmpty() {
      return this.issues.length === 0;
    }
    flatten(mapper = (issue) => issue.message) {
      const fieldErrors = {};
      const formErrors = [];
      for (const sub of this.issues) {
        if (sub.path.length > 0) {
          const firstEl = sub.path[0];
          fieldErrors[firstEl] = fieldErrors[firstEl] || [];
          fieldErrors[firstEl].push(mapper(sub));
        } else {
          formErrors.push(mapper(sub));
        }
      }
      return { formErrors, fieldErrors };
    }
    get formErrors() {
      return this.flatten();
    }
  };
  ZodError.create = (issues) => {
    const error = new ZodError(issues);
    return error;
  };

  // node_modules/zod/v3/locales/en.js
  var errorMap = (issue, _ctx) => {
    let message;
    switch (issue.code) {
      case ZodIssueCode.invalid_type:
        if (issue.received === ZodParsedType.undefined) {
          message = "Required";
        } else {
          message = `Expected ${issue.expected}, received ${issue.received}`;
        }
        break;
      case ZodIssueCode.invalid_literal:
        message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
        break;
      case ZodIssueCode.unrecognized_keys:
        message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
        break;
      case ZodIssueCode.invalid_union:
        message = `Invalid input`;
        break;
      case ZodIssueCode.invalid_union_discriminator:
        message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
        break;
      case ZodIssueCode.invalid_enum_value:
        message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
        break;
      case ZodIssueCode.invalid_arguments:
        message = `Invalid function arguments`;
        break;
      case ZodIssueCode.invalid_return_type:
        message = `Invalid function return type`;
        break;
      case ZodIssueCode.invalid_date:
        message = `Invalid date`;
        break;
      case ZodIssueCode.invalid_string:
        if (typeof issue.validation === "object") {
          if ("includes" in issue.validation) {
            message = `Invalid input: must include "${issue.validation.includes}"`;
            if (typeof issue.validation.position === "number") {
              message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
            }
          } else if ("startsWith" in issue.validation) {
            message = `Invalid input: must start with "${issue.validation.startsWith}"`;
          } else if ("endsWith" in issue.validation) {
            message = `Invalid input: must end with "${issue.validation.endsWith}"`;
          } else {
            util.assertNever(issue.validation);
          }
        } else if (issue.validation !== "regex") {
          message = `Invalid ${issue.validation}`;
        } else {
          message = "Invalid";
        }
        break;
      case ZodIssueCode.too_small:
        if (issue.type === "array")
          message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
        else if (issue.type === "string")
          message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
        else if (issue.type === "number")
          message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
        else if (issue.type === "bigint")
          message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
        else if (issue.type === "date")
          message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
        else
          message = "Invalid input";
        break;
      case ZodIssueCode.too_big:
        if (issue.type === "array")
          message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
        else if (issue.type === "string")
          message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
        else if (issue.type === "number")
          message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
        else if (issue.type === "bigint")
          message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
        else if (issue.type === "date")
          message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
        else
          message = "Invalid input";
        break;
      case ZodIssueCode.custom:
        message = `Invalid input`;
        break;
      case ZodIssueCode.invalid_intersection_types:
        message = `Intersection results could not be merged`;
        break;
      case ZodIssueCode.not_multiple_of:
        message = `Number must be a multiple of ${issue.multipleOf}`;
        break;
      case ZodIssueCode.not_finite:
        message = "Number must be finite";
        break;
      default:
        message = _ctx.defaultError;
        util.assertNever(issue);
    }
    return { message };
  };
  var en_default = errorMap;

  // node_modules/zod/v3/errors.js
  var overrideErrorMap = en_default;
  function setErrorMap(map) {
    overrideErrorMap = map;
  }
  function getErrorMap() {
    return overrideErrorMap;
  }

  // node_modules/zod/v3/helpers/parseUtil.js
  var makeIssue = (params) => {
    const { data, path, errorMaps, issueData } = params;
    const fullPath = [...path, ...issueData.path || []];
    const fullIssue = {
      ...issueData,
      path: fullPath
    };
    if (issueData.message !== void 0) {
      return {
        ...issueData,
        path: fullPath,
        message: issueData.message
      };
    }
    let errorMessage = "";
    const maps = errorMaps.filter((m) => !!m).slice().reverse();
    for (const map of maps) {
      errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
    }
    return {
      ...issueData,
      path: fullPath,
      message: errorMessage
    };
  };
  var EMPTY_PATH = [];
  function addIssueToContext(ctx, issueData) {
    const overrideMap = getErrorMap();
    const issue = makeIssue({
      issueData,
      data: ctx.data,
      path: ctx.path,
      errorMaps: [
        ctx.common.contextualErrorMap,
        // contextual error map is first priority
        ctx.schemaErrorMap,
        // then schema-bound map if available
        overrideMap,
        // then global override map
        overrideMap === en_default ? void 0 : en_default
        // then global default map
      ].filter((x) => !!x)
    });
    ctx.common.issues.push(issue);
  }
  var ParseStatus = class _ParseStatus {
    constructor() {
      this.value = "valid";
    }
    dirty() {
      if (this.value === "valid")
        this.value = "dirty";
    }
    abort() {
      if (this.value !== "aborted")
        this.value = "aborted";
    }
    static mergeArray(status, results) {
      const arrayValue = [];
      for (const s of results) {
        if (s.status === "aborted")
          return INVALID;
        if (s.status === "dirty")
          status.dirty();
        arrayValue.push(s.value);
      }
      return { status: status.value, value: arrayValue };
    }
    static async mergeObjectAsync(status, pairs) {
      const syncPairs = [];
      for (const pair of pairs) {
        const key = await pair.key;
        const value = await pair.value;
        syncPairs.push({
          key,
          value
        });
      }
      return _ParseStatus.mergeObjectSync(status, syncPairs);
    }
    static mergeObjectSync(status, pairs) {
      const finalObject = {};
      for (const pair of pairs) {
        const { key, value } = pair;
        if (key.status === "aborted")
          return INVALID;
        if (value.status === "aborted")
          return INVALID;
        if (key.status === "dirty")
          status.dirty();
        if (value.status === "dirty")
          status.dirty();
        if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
          finalObject[key.value] = value.value;
        }
      }
      return { status: status.value, value: finalObject };
    }
  };
  var INVALID = Object.freeze({
    status: "aborted"
  });
  var DIRTY = (value) => ({ status: "dirty", value });
  var OK = (value) => ({ status: "valid", value });
  var isAborted = (x) => x.status === "aborted";
  var isDirty = (x) => x.status === "dirty";
  var isValid = (x) => x.status === "valid";
  var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

  // node_modules/zod/v3/helpers/errorUtil.js
  var errorUtil;
  (function(errorUtil2) {
    errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
    errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
  })(errorUtil || (errorUtil = {}));

  // node_modules/zod/v3/types.js
  var ParseInputLazyPath = class {
    constructor(parent, value, path, key) {
      this._cachedPath = [];
      this.parent = parent;
      this.data = value;
      this._path = path;
      this._key = key;
    }
    get path() {
      if (!this._cachedPath.length) {
        if (Array.isArray(this._key)) {
          this._cachedPath.push(...this._path, ...this._key);
        } else {
          this._cachedPath.push(...this._path, this._key);
        }
      }
      return this._cachedPath;
    }
  };
  var handleResult = (ctx, result) => {
    if (isValid(result)) {
      return { success: true, data: result.value };
    } else {
      if (!ctx.common.issues.length) {
        throw new Error("Validation failed but no issues detected.");
      }
      return {
        success: false,
        get error() {
          if (this._error)
            return this._error;
          const error = new ZodError(ctx.common.issues);
          this._error = error;
          return this._error;
        }
      };
    }
  };
  function processCreateParams(params) {
    if (!params)
      return {};
    const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
    if (errorMap2 && (invalid_type_error || required_error)) {
      throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
    }
    if (errorMap2)
      return { errorMap: errorMap2, description };
    const customMap = (iss, ctx) => {
      const { message } = params;
      if (iss.code === "invalid_enum_value") {
        return { message: message ?? ctx.defaultError };
      }
      if (typeof ctx.data === "undefined") {
        return { message: message ?? required_error ?? ctx.defaultError };
      }
      if (iss.code !== "invalid_type")
        return { message: ctx.defaultError };
      return { message: message ?? invalid_type_error ?? ctx.defaultError };
    };
    return { errorMap: customMap, description };
  }
  var ZodType = class {
    get description() {
      return this._def.description;
    }
    _getType(input) {
      return getParsedType(input.data);
    }
    _getOrReturnCtx(input, ctx) {
      return ctx || {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      };
    }
    _processInputParams(input) {
      return {
        status: new ParseStatus(),
        ctx: {
          common: input.parent.common,
          data: input.data,
          parsedType: getParsedType(input.data),
          schemaErrorMap: this._def.errorMap,
          path: input.path,
          parent: input.parent
        }
      };
    }
    _parseSync(input) {
      const result = this._parse(input);
      if (isAsync(result)) {
        throw new Error("Synchronous parse encountered promise.");
      }
      return result;
    }
    _parseAsync(input) {
      const result = this._parse(input);
      return Promise.resolve(result);
    }
    parse(data, params) {
      const result = this.safeParse(data, params);
      if (result.success)
        return result.data;
      throw result.error;
    }
    safeParse(data, params) {
      const ctx = {
        common: {
          issues: [],
          async: params?.async ?? false,
          contextualErrorMap: params?.errorMap
        },
        path: params?.path || [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data,
        parsedType: getParsedType(data)
      };
      const result = this._parseSync({ data, path: ctx.path, parent: ctx });
      return handleResult(ctx, result);
    }
    "~validate"(data) {
      const ctx = {
        common: {
          issues: [],
          async: !!this["~standard"].async
        },
        path: [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data,
        parsedType: getParsedType(data)
      };
      if (!this["~standard"].async) {
        try {
          const result = this._parseSync({ data, path: [], parent: ctx });
          return isValid(result) ? {
            value: result.value
          } : {
            issues: ctx.common.issues
          };
        } catch (err) {
          if (err?.message?.toLowerCase()?.includes("encountered")) {
            this["~standard"].async = true;
          }
          ctx.common = {
            issues: [],
            async: true
          };
        }
      }
      return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
        value: result.value
      } : {
        issues: ctx.common.issues
      });
    }
    async parseAsync(data, params) {
      const result = await this.safeParseAsync(data, params);
      if (result.success)
        return result.data;
      throw result.error;
    }
    async safeParseAsync(data, params) {
      const ctx = {
        common: {
          issues: [],
          contextualErrorMap: params?.errorMap,
          async: true
        },
        path: params?.path || [],
        schemaErrorMap: this._def.errorMap,
        parent: null,
        data,
        parsedType: getParsedType(data)
      };
      const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
      const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
      return handleResult(ctx, result);
    }
    refine(check, message) {
      const getIssueProperties = (val) => {
        if (typeof message === "string" || typeof message === "undefined") {
          return { message };
        } else if (typeof message === "function") {
          return message(val);
        } else {
          return message;
        }
      };
      return this._refinement((val, ctx) => {
        const result = check(val);
        const setError = () => ctx.addIssue({
          code: ZodIssueCode.custom,
          ...getIssueProperties(val)
        });
        if (typeof Promise !== "undefined" && result instanceof Promise) {
          return result.then((data) => {
            if (!data) {
              setError();
              return false;
            } else {
              return true;
            }
          });
        }
        if (!result) {
          setError();
          return false;
        } else {
          return true;
        }
      });
    }
    refinement(check, refinementData) {
      return this._refinement((val, ctx) => {
        if (!check(val)) {
          ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
          return false;
        } else {
          return true;
        }
      });
    }
    _refinement(refinement) {
      return new ZodEffects({
        schema: this,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect: { type: "refinement", refinement }
      });
    }
    superRefine(refinement) {
      return this._refinement(refinement);
    }
    constructor(def) {
      this.spa = this.safeParseAsync;
      this._def = def;
      this.parse = this.parse.bind(this);
      this.safeParse = this.safeParse.bind(this);
      this.parseAsync = this.parseAsync.bind(this);
      this.safeParseAsync = this.safeParseAsync.bind(this);
      this.spa = this.spa.bind(this);
      this.refine = this.refine.bind(this);
      this.refinement = this.refinement.bind(this);
      this.superRefine = this.superRefine.bind(this);
      this.optional = this.optional.bind(this);
      this.nullable = this.nullable.bind(this);
      this.nullish = this.nullish.bind(this);
      this.array = this.array.bind(this);
      this.promise = this.promise.bind(this);
      this.or = this.or.bind(this);
      this.and = this.and.bind(this);
      this.transform = this.transform.bind(this);
      this.brand = this.brand.bind(this);
      this.default = this.default.bind(this);
      this.catch = this.catch.bind(this);
      this.describe = this.describe.bind(this);
      this.pipe = this.pipe.bind(this);
      this.readonly = this.readonly.bind(this);
      this.isNullable = this.isNullable.bind(this);
      this.isOptional = this.isOptional.bind(this);
      this["~standard"] = {
        version: 1,
        vendor: "zod",
        validate: (data) => this["~validate"](data)
      };
    }
    optional() {
      return ZodOptional.create(this, this._def);
    }
    nullable() {
      return ZodNullable.create(this, this._def);
    }
    nullish() {
      return this.nullable().optional();
    }
    array() {
      return ZodArray.create(this);
    }
    promise() {
      return ZodPromise.create(this, this._def);
    }
    or(option) {
      return ZodUnion.create([this, option], this._def);
    }
    and(incoming) {
      return ZodIntersection.create(this, incoming, this._def);
    }
    transform(transform) {
      return new ZodEffects({
        ...processCreateParams(this._def),
        schema: this,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect: { type: "transform", transform }
      });
    }
    default(def) {
      const defaultValueFunc = typeof def === "function" ? def : () => def;
      return new ZodDefault({
        ...processCreateParams(this._def),
        innerType: this,
        defaultValue: defaultValueFunc,
        typeName: ZodFirstPartyTypeKind.ZodDefault
      });
    }
    brand() {
      return new ZodBranded({
        typeName: ZodFirstPartyTypeKind.ZodBranded,
        type: this,
        ...processCreateParams(this._def)
      });
    }
    catch(def) {
      const catchValueFunc = typeof def === "function" ? def : () => def;
      return new ZodCatch({
        ...processCreateParams(this._def),
        innerType: this,
        catchValue: catchValueFunc,
        typeName: ZodFirstPartyTypeKind.ZodCatch
      });
    }
    describe(description) {
      const This = this.constructor;
      return new This({
        ...this._def,
        description
      });
    }
    pipe(target) {
      return ZodPipeline.create(this, target);
    }
    readonly() {
      return ZodReadonly.create(this);
    }
    isOptional() {
      return this.safeParse(void 0).success;
    }
    isNullable() {
      return this.safeParse(null).success;
    }
  };
  var cuidRegex = /^c[^\s-]{8,}$/i;
  var cuid2Regex = /^[0-9a-z]+$/;
  var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
  var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
  var nanoidRegex = /^[a-z0-9_-]{21}$/i;
  var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
  var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
  var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
  var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
  var emojiRegex;
  var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
  var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
  var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
  var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
  var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
  var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
  var dateRegex = new RegExp(`^${dateRegexSource}$`);
  function timeRegexSource(args) {
    let secondsRegexSource = `[0-5]\\d`;
    if (args.precision) {
      secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
    } else if (args.precision == null) {
      secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
    }
    const secondsQuantifier = args.precision ? "+" : "?";
    return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
  }
  function timeRegex(args) {
    return new RegExp(`^${timeRegexSource(args)}$`);
  }
  function datetimeRegex(args) {
    let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
    const opts = [];
    opts.push(args.local ? `Z?` : `Z`);
    if (args.offset)
      opts.push(`([+-]\\d{2}:?\\d{2})`);
    regex = `${regex}(${opts.join("|")})`;
    return new RegExp(`^${regex}$`);
  }
  function isValidIP(ip, version) {
    if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
      return true;
    }
    if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
      return true;
    }
    return false;
  }
  function isValidJWT(jwt, alg) {
    if (!jwtRegex.test(jwt))
      return false;
    try {
      const [header] = jwt.split(".");
      if (!header)
        return false;
      const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
      const decoded = JSON.parse(atob(base64));
      if (typeof decoded !== "object" || decoded === null)
        return false;
      if ("typ" in decoded && decoded?.typ !== "JWT")
        return false;
      if (!decoded.alg)
        return false;
      if (alg && decoded.alg !== alg)
        return false;
      return true;
    } catch {
      return false;
    }
  }
  function isValidCidr(ip, version) {
    if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
      return true;
    }
    if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
      return true;
    }
    return false;
  }
  var ZodString = class _ZodString extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = String(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.string) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.string,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      const status = new ParseStatus();
      let ctx = void 0;
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          if (input.data.length < check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          if (input.data.length > check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "length") {
          const tooBig = input.data.length > check.value;
          const tooSmall = input.data.length < check.value;
          if (tooBig || tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            if (tooBig) {
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "string",
                inclusive: true,
                exact: true,
                message: check.message
              });
            } else if (tooSmall) {
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "string",
                inclusive: true,
                exact: true,
                message: check.message
              });
            }
            status.dirty();
          }
        } else if (check.kind === "email") {
          if (!emailRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "email",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "emoji") {
          if (!emojiRegex) {
            emojiRegex = new RegExp(_emojiRegex, "u");
          }
          if (!emojiRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "emoji",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "uuid") {
          if (!uuidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "uuid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "nanoid") {
          if (!nanoidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "nanoid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cuid") {
          if (!cuidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cuid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cuid2") {
          if (!cuid2Regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cuid2",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "ulid") {
          if (!ulidRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "ulid",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "url") {
          try {
            new URL(input.data);
          } catch {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "url",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "regex") {
          check.regex.lastIndex = 0;
          const testResult = check.regex.test(input.data);
          if (!testResult) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "regex",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "trim") {
          input.data = input.data.trim();
        } else if (check.kind === "includes") {
          if (!input.data.includes(check.value, check.position)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { includes: check.value, position: check.position },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "toLowerCase") {
          input.data = input.data.toLowerCase();
        } else if (check.kind === "toUpperCase") {
          input.data = input.data.toUpperCase();
        } else if (check.kind === "startsWith") {
          if (!input.data.startsWith(check.value)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { startsWith: check.value },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "endsWith") {
          if (!input.data.endsWith(check.value)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: { endsWith: check.value },
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "datetime") {
          const regex = datetimeRegex(check);
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "datetime",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "date") {
          const regex = dateRegex;
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "date",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "time") {
          const regex = timeRegex(check);
          if (!regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_string,
              validation: "time",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "duration") {
          if (!durationRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "duration",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "ip") {
          if (!isValidIP(input.data, check.version)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "ip",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "jwt") {
          if (!isValidJWT(input.data, check.alg)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "jwt",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "cidr") {
          if (!isValidCidr(input.data, check.version)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "cidr",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "base64") {
          if (!base64Regex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "base64",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "base64url") {
          if (!base64urlRegex.test(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              validation: "base64url",
              code: ZodIssueCode.invalid_string,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    _regex(regex, validation, message) {
      return this.refinement((data) => regex.test(data), {
        validation,
        code: ZodIssueCode.invalid_string,
        ...errorUtil.errToObj(message)
      });
    }
    _addCheck(check) {
      return new _ZodString({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    email(message) {
      return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
    }
    url(message) {
      return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
    }
    emoji(message) {
      return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
    }
    uuid(message) {
      return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
    }
    nanoid(message) {
      return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
    }
    cuid(message) {
      return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
    }
    cuid2(message) {
      return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
    }
    ulid(message) {
      return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
    }
    base64(message) {
      return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
    }
    base64url(message) {
      return this._addCheck({
        kind: "base64url",
        ...errorUtil.errToObj(message)
      });
    }
    jwt(options) {
      return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
    }
    ip(options) {
      return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
    }
    cidr(options) {
      return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
    }
    datetime(options) {
      if (typeof options === "string") {
        return this._addCheck({
          kind: "datetime",
          precision: null,
          offset: false,
          local: false,
          message: options
        });
      }
      return this._addCheck({
        kind: "datetime",
        precision: typeof options?.precision === "undefined" ? null : options?.precision,
        offset: options?.offset ?? false,
        local: options?.local ?? false,
        ...errorUtil.errToObj(options?.message)
      });
    }
    date(message) {
      return this._addCheck({ kind: "date", message });
    }
    time(options) {
      if (typeof options === "string") {
        return this._addCheck({
          kind: "time",
          precision: null,
          message: options
        });
      }
      return this._addCheck({
        kind: "time",
        precision: typeof options?.precision === "undefined" ? null : options?.precision,
        ...errorUtil.errToObj(options?.message)
      });
    }
    duration(message) {
      return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
    }
    regex(regex, message) {
      return this._addCheck({
        kind: "regex",
        regex,
        ...errorUtil.errToObj(message)
      });
    }
    includes(value, options) {
      return this._addCheck({
        kind: "includes",
        value,
        position: options?.position,
        ...errorUtil.errToObj(options?.message)
      });
    }
    startsWith(value, message) {
      return this._addCheck({
        kind: "startsWith",
        value,
        ...errorUtil.errToObj(message)
      });
    }
    endsWith(value, message) {
      return this._addCheck({
        kind: "endsWith",
        value,
        ...errorUtil.errToObj(message)
      });
    }
    min(minLength, message) {
      return this._addCheck({
        kind: "min",
        value: minLength,
        ...errorUtil.errToObj(message)
      });
    }
    max(maxLength, message) {
      return this._addCheck({
        kind: "max",
        value: maxLength,
        ...errorUtil.errToObj(message)
      });
    }
    length(len, message) {
      return this._addCheck({
        kind: "length",
        value: len,
        ...errorUtil.errToObj(message)
      });
    }
    /**
     * Equivalent to `.min(1)`
     */
    nonempty(message) {
      return this.min(1, errorUtil.errToObj(message));
    }
    trim() {
      return new _ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "trim" }]
      });
    }
    toLowerCase() {
      return new _ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "toLowerCase" }]
      });
    }
    toUpperCase() {
      return new _ZodString({
        ...this._def,
        checks: [...this._def.checks, { kind: "toUpperCase" }]
      });
    }
    get isDatetime() {
      return !!this._def.checks.find((ch) => ch.kind === "datetime");
    }
    get isDate() {
      return !!this._def.checks.find((ch) => ch.kind === "date");
    }
    get isTime() {
      return !!this._def.checks.find((ch) => ch.kind === "time");
    }
    get isDuration() {
      return !!this._def.checks.find((ch) => ch.kind === "duration");
    }
    get isEmail() {
      return !!this._def.checks.find((ch) => ch.kind === "email");
    }
    get isURL() {
      return !!this._def.checks.find((ch) => ch.kind === "url");
    }
    get isEmoji() {
      return !!this._def.checks.find((ch) => ch.kind === "emoji");
    }
    get isUUID() {
      return !!this._def.checks.find((ch) => ch.kind === "uuid");
    }
    get isNANOID() {
      return !!this._def.checks.find((ch) => ch.kind === "nanoid");
    }
    get isCUID() {
      return !!this._def.checks.find((ch) => ch.kind === "cuid");
    }
    get isCUID2() {
      return !!this._def.checks.find((ch) => ch.kind === "cuid2");
    }
    get isULID() {
      return !!this._def.checks.find((ch) => ch.kind === "ulid");
    }
    get isIP() {
      return !!this._def.checks.find((ch) => ch.kind === "ip");
    }
    get isCIDR() {
      return !!this._def.checks.find((ch) => ch.kind === "cidr");
    }
    get isBase64() {
      return !!this._def.checks.find((ch) => ch.kind === "base64");
    }
    get isBase64url() {
      return !!this._def.checks.find((ch) => ch.kind === "base64url");
    }
    get minLength() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxLength() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
  };
  ZodString.create = (params) => {
    return new ZodString({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodString,
      coerce: params?.coerce ?? false,
      ...processCreateParams(params)
    });
  };
  function floatSafeRemainder(val, step) {
    const valDecCount = (val.toString().split(".")[1] || "").length;
    const stepDecCount = (step.toString().split(".")[1] || "").length;
    const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
    const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
    const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
    return valInt % stepInt / 10 ** decCount;
  }
  var ZodNumber = class _ZodNumber extends ZodType {
    constructor() {
      super(...arguments);
      this.min = this.gte;
      this.max = this.lte;
      this.step = this.multipleOf;
    }
    _parse(input) {
      if (this._def.coerce) {
        input.data = Number(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.number) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.number,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      let ctx = void 0;
      const status = new ParseStatus();
      for (const check of this._def.checks) {
        if (check.kind === "int") {
          if (!util.isInteger(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_type,
              expected: "integer",
              received: "float",
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "min") {
          const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
          if (tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "number",
              inclusive: check.inclusive,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
          if (tooBig) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "number",
              inclusive: check.inclusive,
              exact: false,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "multipleOf") {
          if (floatSafeRemainder(input.data, check.value) !== 0) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_multiple_of,
              multipleOf: check.value,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "finite") {
          if (!Number.isFinite(input.data)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_finite,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    gte(value, message) {
      return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
      return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
      return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
      return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
      return new _ZodNumber({
        ...this._def,
        checks: [
          ...this._def.checks,
          {
            kind,
            value,
            inclusive,
            message: errorUtil.toString(message)
          }
        ]
      });
    }
    _addCheck(check) {
      return new _ZodNumber({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    int(message) {
      return this._addCheck({
        kind: "int",
        message: errorUtil.toString(message)
      });
    }
    positive(message) {
      return this._addCheck({
        kind: "min",
        value: 0,
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    negative(message) {
      return this._addCheck({
        kind: "max",
        value: 0,
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    nonpositive(message) {
      return this._addCheck({
        kind: "max",
        value: 0,
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    nonnegative(message) {
      return this._addCheck({
        kind: "min",
        value: 0,
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    multipleOf(value, message) {
      return this._addCheck({
        kind: "multipleOf",
        value,
        message: errorUtil.toString(message)
      });
    }
    finite(message) {
      return this._addCheck({
        kind: "finite",
        message: errorUtil.toString(message)
      });
    }
    safe(message) {
      return this._addCheck({
        kind: "min",
        inclusive: true,
        value: Number.MIN_SAFE_INTEGER,
        message: errorUtil.toString(message)
      })._addCheck({
        kind: "max",
        inclusive: true,
        value: Number.MAX_SAFE_INTEGER,
        message: errorUtil.toString(message)
      });
    }
    get minValue() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxValue() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
    get isInt() {
      return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
    }
    get isFinite() {
      let max = null;
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
          return true;
        } else if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        } else if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return Number.isFinite(min) && Number.isFinite(max);
    }
  };
  ZodNumber.create = (params) => {
    return new ZodNumber({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodNumber,
      coerce: params?.coerce || false,
      ...processCreateParams(params)
    });
  };
  var ZodBigInt = class _ZodBigInt extends ZodType {
    constructor() {
      super(...arguments);
      this.min = this.gte;
      this.max = this.lte;
    }
    _parse(input) {
      if (this._def.coerce) {
        try {
          input.data = BigInt(input.data);
        } catch {
          return this._getInvalidInput(input);
        }
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.bigint) {
        return this._getInvalidInput(input);
      }
      let ctx = void 0;
      const status = new ParseStatus();
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
          if (tooSmall) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              type: "bigint",
              minimum: check.value,
              inclusive: check.inclusive,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
          if (tooBig) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              type: "bigint",
              maximum: check.value,
              inclusive: check.inclusive,
              message: check.message
            });
            status.dirty();
          }
        } else if (check.kind === "multipleOf") {
          if (input.data % check.value !== BigInt(0)) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.not_multiple_of,
              multipleOf: check.value,
              message: check.message
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return { status: status.value, value: input.data };
    }
    _getInvalidInput(input) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.bigint,
        received: ctx.parsedType
      });
      return INVALID;
    }
    gte(value, message) {
      return this.setLimit("min", value, true, errorUtil.toString(message));
    }
    gt(value, message) {
      return this.setLimit("min", value, false, errorUtil.toString(message));
    }
    lte(value, message) {
      return this.setLimit("max", value, true, errorUtil.toString(message));
    }
    lt(value, message) {
      return this.setLimit("max", value, false, errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
      return new _ZodBigInt({
        ...this._def,
        checks: [
          ...this._def.checks,
          {
            kind,
            value,
            inclusive,
            message: errorUtil.toString(message)
          }
        ]
      });
    }
    _addCheck(check) {
      return new _ZodBigInt({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    positive(message) {
      return this._addCheck({
        kind: "min",
        value: BigInt(0),
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    negative(message) {
      return this._addCheck({
        kind: "max",
        value: BigInt(0),
        inclusive: false,
        message: errorUtil.toString(message)
      });
    }
    nonpositive(message) {
      return this._addCheck({
        kind: "max",
        value: BigInt(0),
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    nonnegative(message) {
      return this._addCheck({
        kind: "min",
        value: BigInt(0),
        inclusive: true,
        message: errorUtil.toString(message)
      });
    }
    multipleOf(value, message) {
      return this._addCheck({
        kind: "multipleOf",
        value,
        message: errorUtil.toString(message)
      });
    }
    get minValue() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min;
    }
    get maxValue() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max;
    }
  };
  ZodBigInt.create = (params) => {
    return new ZodBigInt({
      checks: [],
      typeName: ZodFirstPartyTypeKind.ZodBigInt,
      coerce: params?.coerce ?? false,
      ...processCreateParams(params)
    });
  };
  var ZodBoolean = class extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = Boolean(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.boolean) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.boolean,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodBoolean.create = (params) => {
    return new ZodBoolean({
      typeName: ZodFirstPartyTypeKind.ZodBoolean,
      coerce: params?.coerce || false,
      ...processCreateParams(params)
    });
  };
  var ZodDate = class _ZodDate extends ZodType {
    _parse(input) {
      if (this._def.coerce) {
        input.data = new Date(input.data);
      }
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.date) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.date,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      if (Number.isNaN(input.data.getTime())) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_date
        });
        return INVALID;
      }
      const status = new ParseStatus();
      let ctx = void 0;
      for (const check of this._def.checks) {
        if (check.kind === "min") {
          if (input.data.getTime() < check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              message: check.message,
              inclusive: true,
              exact: false,
              minimum: check.value,
              type: "date"
            });
            status.dirty();
          }
        } else if (check.kind === "max") {
          if (input.data.getTime() > check.value) {
            ctx = this._getOrReturnCtx(input, ctx);
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              message: check.message,
              inclusive: true,
              exact: false,
              maximum: check.value,
              type: "date"
            });
            status.dirty();
          }
        } else {
          util.assertNever(check);
        }
      }
      return {
        status: status.value,
        value: new Date(input.data.getTime())
      };
    }
    _addCheck(check) {
      return new _ZodDate({
        ...this._def,
        checks: [...this._def.checks, check]
      });
    }
    min(minDate, message) {
      return this._addCheck({
        kind: "min",
        value: minDate.getTime(),
        message: errorUtil.toString(message)
      });
    }
    max(maxDate, message) {
      return this._addCheck({
        kind: "max",
        value: maxDate.getTime(),
        message: errorUtil.toString(message)
      });
    }
    get minDate() {
      let min = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "min") {
          if (min === null || ch.value > min)
            min = ch.value;
        }
      }
      return min != null ? new Date(min) : null;
    }
    get maxDate() {
      let max = null;
      for (const ch of this._def.checks) {
        if (ch.kind === "max") {
          if (max === null || ch.value < max)
            max = ch.value;
        }
      }
      return max != null ? new Date(max) : null;
    }
  };
  ZodDate.create = (params) => {
    return new ZodDate({
      checks: [],
      coerce: params?.coerce || false,
      typeName: ZodFirstPartyTypeKind.ZodDate,
      ...processCreateParams(params)
    });
  };
  var ZodSymbol = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.symbol) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.symbol,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodSymbol.create = (params) => {
    return new ZodSymbol({
      typeName: ZodFirstPartyTypeKind.ZodSymbol,
      ...processCreateParams(params)
    });
  };
  var ZodUndefined = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.undefined) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.undefined,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodUndefined.create = (params) => {
    return new ZodUndefined({
      typeName: ZodFirstPartyTypeKind.ZodUndefined,
      ...processCreateParams(params)
    });
  };
  var ZodNull = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.null) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.null,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodNull.create = (params) => {
    return new ZodNull({
      typeName: ZodFirstPartyTypeKind.ZodNull,
      ...processCreateParams(params)
    });
  };
  var ZodAny = class extends ZodType {
    constructor() {
      super(...arguments);
      this._any = true;
    }
    _parse(input) {
      return OK(input.data);
    }
  };
  ZodAny.create = (params) => {
    return new ZodAny({
      typeName: ZodFirstPartyTypeKind.ZodAny,
      ...processCreateParams(params)
    });
  };
  var ZodUnknown = class extends ZodType {
    constructor() {
      super(...arguments);
      this._unknown = true;
    }
    _parse(input) {
      return OK(input.data);
    }
  };
  ZodUnknown.create = (params) => {
    return new ZodUnknown({
      typeName: ZodFirstPartyTypeKind.ZodUnknown,
      ...processCreateParams(params)
    });
  };
  var ZodNever = class extends ZodType {
    _parse(input) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.never,
        received: ctx.parsedType
      });
      return INVALID;
    }
  };
  ZodNever.create = (params) => {
    return new ZodNever({
      typeName: ZodFirstPartyTypeKind.ZodNever,
      ...processCreateParams(params)
    });
  };
  var ZodVoid = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.undefined) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.void,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return OK(input.data);
    }
  };
  ZodVoid.create = (params) => {
    return new ZodVoid({
      typeName: ZodFirstPartyTypeKind.ZodVoid,
      ...processCreateParams(params)
    });
  };
  var ZodArray = class _ZodArray extends ZodType {
    _parse(input) {
      const { ctx, status } = this._processInputParams(input);
      const def = this._def;
      if (ctx.parsedType !== ZodParsedType.array) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.array,
          received: ctx.parsedType
        });
        return INVALID;
      }
      if (def.exactLength !== null) {
        const tooBig = ctx.data.length > def.exactLength.value;
        const tooSmall = ctx.data.length < def.exactLength.value;
        if (tooBig || tooSmall) {
          addIssueToContext(ctx, {
            code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
            minimum: tooSmall ? def.exactLength.value : void 0,
            maximum: tooBig ? def.exactLength.value : void 0,
            type: "array",
            inclusive: true,
            exact: true,
            message: def.exactLength.message
          });
          status.dirty();
        }
      }
      if (def.minLength !== null) {
        if (ctx.data.length < def.minLength.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: def.minLength.value,
            type: "array",
            inclusive: true,
            exact: false,
            message: def.minLength.message
          });
          status.dirty();
        }
      }
      if (def.maxLength !== null) {
        if (ctx.data.length > def.maxLength.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: def.maxLength.value,
            type: "array",
            inclusive: true,
            exact: false,
            message: def.maxLength.message
          });
          status.dirty();
        }
      }
      if (ctx.common.async) {
        return Promise.all([...ctx.data].map((item, i) => {
          return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        })).then((result2) => {
          return ParseStatus.mergeArray(status, result2);
        });
      }
      const result = [...ctx.data].map((item, i) => {
        return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      });
      return ParseStatus.mergeArray(status, result);
    }
    get element() {
      return this._def.type;
    }
    min(minLength, message) {
      return new _ZodArray({
        ...this._def,
        minLength: { value: minLength, message: errorUtil.toString(message) }
      });
    }
    max(maxLength, message) {
      return new _ZodArray({
        ...this._def,
        maxLength: { value: maxLength, message: errorUtil.toString(message) }
      });
    }
    length(len, message) {
      return new _ZodArray({
        ...this._def,
        exactLength: { value: len, message: errorUtil.toString(message) }
      });
    }
    nonempty(message) {
      return this.min(1, message);
    }
  };
  ZodArray.create = (schema, params) => {
    return new ZodArray({
      type: schema,
      minLength: null,
      maxLength: null,
      exactLength: null,
      typeName: ZodFirstPartyTypeKind.ZodArray,
      ...processCreateParams(params)
    });
  };
  function deepPartialify(schema) {
    if (schema instanceof ZodObject) {
      const newShape = {};
      for (const key in schema.shape) {
        const fieldSchema = schema.shape[key];
        newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
      }
      return new ZodObject({
        ...schema._def,
        shape: () => newShape
      });
    } else if (schema instanceof ZodArray) {
      return new ZodArray({
        ...schema._def,
        type: deepPartialify(schema.element)
      });
    } else if (schema instanceof ZodOptional) {
      return ZodOptional.create(deepPartialify(schema.unwrap()));
    } else if (schema instanceof ZodNullable) {
      return ZodNullable.create(deepPartialify(schema.unwrap()));
    } else if (schema instanceof ZodTuple) {
      return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
    } else {
      return schema;
    }
  }
  var ZodObject = class _ZodObject extends ZodType {
    constructor() {
      super(...arguments);
      this._cached = null;
      this.nonstrict = this.passthrough;
      this.augment = this.extend;
    }
    _getCached() {
      if (this._cached !== null)
        return this._cached;
      const shape = this._def.shape();
      const keys = util.objectKeys(shape);
      this._cached = { shape, keys };
      return this._cached;
    }
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.object) {
        const ctx2 = this._getOrReturnCtx(input);
        addIssueToContext(ctx2, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx2.parsedType
        });
        return INVALID;
      }
      const { status, ctx } = this._processInputParams(input);
      const { shape, keys: shapeKeys } = this._getCached();
      const extraKeys = [];
      if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
        for (const key in ctx.data) {
          if (!shapeKeys.includes(key)) {
            extraKeys.push(key);
          }
        }
      }
      const pairs = [];
      for (const key of shapeKeys) {
        const keyValidator = shape[key];
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
      if (this._def.catchall instanceof ZodNever) {
        const unknownKeys = this._def.unknownKeys;
        if (unknownKeys === "passthrough") {
          for (const key of extraKeys) {
            pairs.push({
              key: { status: "valid", value: key },
              value: { status: "valid", value: ctx.data[key] }
            });
          }
        } else if (unknownKeys === "strict") {
          if (extraKeys.length > 0) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.unrecognized_keys,
              keys: extraKeys
            });
            status.dirty();
          }
        } else if (unknownKeys === "strip") {
        } else {
          throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
        }
      } else {
        const catchall = this._def.catchall;
        for (const key of extraKeys) {
          const value = ctx.data[key];
          pairs.push({
            key: { status: "valid", value: key },
            value: catchall._parse(
              new ParseInputLazyPath(ctx, value, ctx.path, key)
              //, ctx.child(key), value, getParsedType(value)
            ),
            alwaysSet: key in ctx.data
          });
        }
      }
      if (ctx.common.async) {
        return Promise.resolve().then(async () => {
          const syncPairs = [];
          for (const pair of pairs) {
            const key = await pair.key;
            const value = await pair.value;
            syncPairs.push({
              key,
              value,
              alwaysSet: pair.alwaysSet
            });
          }
          return syncPairs;
        }).then((syncPairs) => {
          return ParseStatus.mergeObjectSync(status, syncPairs);
        });
      } else {
        return ParseStatus.mergeObjectSync(status, pairs);
      }
    }
    get shape() {
      return this._def.shape();
    }
    strict(message) {
      errorUtil.errToObj;
      return new _ZodObject({
        ...this._def,
        unknownKeys: "strict",
        ...message !== void 0 ? {
          errorMap: (issue, ctx) => {
            const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
            if (issue.code === "unrecognized_keys")
              return {
                message: errorUtil.errToObj(message).message ?? defaultError
              };
            return {
              message: defaultError
            };
          }
        } : {}
      });
    }
    strip() {
      return new _ZodObject({
        ...this._def,
        unknownKeys: "strip"
      });
    }
    passthrough() {
      return new _ZodObject({
        ...this._def,
        unknownKeys: "passthrough"
      });
    }
    // const AugmentFactory =
    //   <Def extends ZodObjectDef>(def: Def) =>
    //   <Augmentation extends ZodRawShape>(
    //     augmentation: Augmentation
    //   ): ZodObject<
    //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
    //     Def["unknownKeys"],
    //     Def["catchall"]
    //   > => {
    //     return new ZodObject({
    //       ...def,
    //       shape: () => ({
    //         ...def.shape(),
    //         ...augmentation,
    //       }),
    //     }) as any;
    //   };
    extend(augmentation) {
      return new _ZodObject({
        ...this._def,
        shape: () => ({
          ...this._def.shape(),
          ...augmentation
        })
      });
    }
    /**
     * Prior to zod@1.0.12 there was a bug in the
     * inferred type of merged objects. Please
     * upgrade if you are experiencing issues.
     */
    merge(merging) {
      const merged = new _ZodObject({
        unknownKeys: merging._def.unknownKeys,
        catchall: merging._def.catchall,
        shape: () => ({
          ...this._def.shape(),
          ...merging._def.shape()
        }),
        typeName: ZodFirstPartyTypeKind.ZodObject
      });
      return merged;
    }
    // merge<
    //   Incoming extends AnyZodObject,
    //   Augmentation extends Incoming["shape"],
    //   NewOutput extends {
    //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
    //       ? Augmentation[k]["_output"]
    //       : k extends keyof Output
    //       ? Output[k]
    //       : never;
    //   },
    //   NewInput extends {
    //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
    //       ? Augmentation[k]["_input"]
    //       : k extends keyof Input
    //       ? Input[k]
    //       : never;
    //   }
    // >(
    //   merging: Incoming
    // ): ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"],
    //   NewOutput,
    //   NewInput
    // > {
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    setKey(key, schema) {
      return this.augment({ [key]: schema });
    }
    // merge<Incoming extends AnyZodObject>(
    //   merging: Incoming
    // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
    // ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"]
    // > {
    //   // const mergedShape = objectUtil.mergeShapes(
    //   //   this._def.shape(),
    //   //   merging._def.shape()
    //   // );
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    catchall(index) {
      return new _ZodObject({
        ...this._def,
        catchall: index
      });
    }
    pick(mask) {
      const shape = {};
      for (const key of util.objectKeys(mask)) {
        if (mask[key] && this.shape[key]) {
          shape[key] = this.shape[key];
        }
      }
      return new _ZodObject({
        ...this._def,
        shape: () => shape
      });
    }
    omit(mask) {
      const shape = {};
      for (const key of util.objectKeys(this.shape)) {
        if (!mask[key]) {
          shape[key] = this.shape[key];
        }
      }
      return new _ZodObject({
        ...this._def,
        shape: () => shape
      });
    }
    /**
     * @deprecated
     */
    deepPartial() {
      return deepPartialify(this);
    }
    partial(mask) {
      const newShape = {};
      for (const key of util.objectKeys(this.shape)) {
        const fieldSchema = this.shape[key];
        if (mask && !mask[key]) {
          newShape[key] = fieldSchema;
        } else {
          newShape[key] = fieldSchema.optional();
        }
      }
      return new _ZodObject({
        ...this._def,
        shape: () => newShape
      });
    }
    required(mask) {
      const newShape = {};
      for (const key of util.objectKeys(this.shape)) {
        if (mask && !mask[key]) {
          newShape[key] = this.shape[key];
        } else {
          const fieldSchema = this.shape[key];
          let newField = fieldSchema;
          while (newField instanceof ZodOptional) {
            newField = newField._def.innerType;
          }
          newShape[key] = newField;
        }
      }
      return new _ZodObject({
        ...this._def,
        shape: () => newShape
      });
    }
    keyof() {
      return createZodEnum(util.objectKeys(this.shape));
    }
  };
  ZodObject.create = (shape, params) => {
    return new ZodObject({
      shape: () => shape,
      unknownKeys: "strip",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  ZodObject.strictCreate = (shape, params) => {
    return new ZodObject({
      shape: () => shape,
      unknownKeys: "strict",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  ZodObject.lazycreate = (shape, params) => {
    return new ZodObject({
      shape,
      unknownKeys: "strip",
      catchall: ZodNever.create(),
      typeName: ZodFirstPartyTypeKind.ZodObject,
      ...processCreateParams(params)
    });
  };
  var ZodUnion = class extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const options = this._def.options;
      function handleResults(results) {
        for (const result of results) {
          if (result.result.status === "valid") {
            return result.result;
          }
        }
        for (const result of results) {
          if (result.result.status === "dirty") {
            ctx.common.issues.push(...result.ctx.common.issues);
            return result.result;
          }
        }
        const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union,
          unionErrors
        });
        return INVALID;
      }
      if (ctx.common.async) {
        return Promise.all(options.map(async (option) => {
          const childCtx = {
            ...ctx,
            common: {
              ...ctx.common,
              issues: []
            },
            parent: null
          };
          return {
            result: await option._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx
            }),
            ctx: childCtx
          };
        })).then(handleResults);
      } else {
        let dirty = void 0;
        const issues = [];
        for (const option of options) {
          const childCtx = {
            ...ctx,
            common: {
              ...ctx.common,
              issues: []
            },
            parent: null
          };
          const result = option._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          });
          if (result.status === "valid") {
            return result;
          } else if (result.status === "dirty" && !dirty) {
            dirty = { result, ctx: childCtx };
          }
          if (childCtx.common.issues.length) {
            issues.push(childCtx.common.issues);
          }
        }
        if (dirty) {
          ctx.common.issues.push(...dirty.ctx.common.issues);
          return dirty.result;
        }
        const unionErrors = issues.map((issues2) => new ZodError(issues2));
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union,
          unionErrors
        });
        return INVALID;
      }
    }
    get options() {
      return this._def.options;
    }
  };
  ZodUnion.create = (types, params) => {
    return new ZodUnion({
      options: types,
      typeName: ZodFirstPartyTypeKind.ZodUnion,
      ...processCreateParams(params)
    });
  };
  var getDiscriminator = (type) => {
    if (type instanceof ZodLazy) {
      return getDiscriminator(type.schema);
    } else if (type instanceof ZodEffects) {
      return getDiscriminator(type.innerType());
    } else if (type instanceof ZodLiteral) {
      return [type.value];
    } else if (type instanceof ZodEnum) {
      return type.options;
    } else if (type instanceof ZodNativeEnum) {
      return util.objectValues(type.enum);
    } else if (type instanceof ZodDefault) {
      return getDiscriminator(type._def.innerType);
    } else if (type instanceof ZodUndefined) {
      return [void 0];
    } else if (type instanceof ZodNull) {
      return [null];
    } else if (type instanceof ZodOptional) {
      return [void 0, ...getDiscriminator(type.unwrap())];
    } else if (type instanceof ZodNullable) {
      return [null, ...getDiscriminator(type.unwrap())];
    } else if (type instanceof ZodBranded) {
      return getDiscriminator(type.unwrap());
    } else if (type instanceof ZodReadonly) {
      return getDiscriminator(type.unwrap());
    } else if (type instanceof ZodCatch) {
      return getDiscriminator(type._def.innerType);
    } else {
      return [];
    }
  };
  var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.object) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const discriminator = this.discriminator;
      const discriminatorValue = ctx.data[discriminator];
      const option = this.optionsMap.get(discriminatorValue);
      if (!option) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_union_discriminator,
          options: Array.from(this.optionsMap.keys()),
          path: [discriminator]
        });
        return INVALID;
      }
      if (ctx.common.async) {
        return option._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
      } else {
        return option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
      }
    }
    get discriminator() {
      return this._def.discriminator;
    }
    get options() {
      return this._def.options;
    }
    get optionsMap() {
      return this._def.optionsMap;
    }
    /**
     * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
     * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
     * have a different value for each object in the union.
     * @param discriminator the name of the discriminator property
     * @param types an array of object schemas
     * @param params
     */
    static create(discriminator, options, params) {
      const optionsMap = /* @__PURE__ */ new Map();
      for (const type of options) {
        const discriminatorValues = getDiscriminator(type.shape[discriminator]);
        if (!discriminatorValues.length) {
          throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
        }
        for (const value of discriminatorValues) {
          if (optionsMap.has(value)) {
            throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
          }
          optionsMap.set(value, type);
        }
      }
      return new _ZodDiscriminatedUnion({
        typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
        discriminator,
        options,
        optionsMap,
        ...processCreateParams(params)
      });
    }
  };
  function mergeValues(a, b) {
    const aType = getParsedType(a);
    const bType = getParsedType(b);
    if (a === b) {
      return { valid: true, data: a };
    } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
      const bKeys = util.objectKeys(b);
      const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
      const newObj = { ...a, ...b };
      for (const key of sharedKeys) {
        const sharedValue = mergeValues(a[key], b[key]);
        if (!sharedValue.valid) {
          return { valid: false };
        }
        newObj[key] = sharedValue.data;
      }
      return { valid: true, data: newObj };
    } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
      if (a.length !== b.length) {
        return { valid: false };
      }
      const newArray = [];
      for (let index = 0; index < a.length; index++) {
        const itemA = a[index];
        const itemB = b[index];
        const sharedValue = mergeValues(itemA, itemB);
        if (!sharedValue.valid) {
          return { valid: false };
        }
        newArray.push(sharedValue.data);
      }
      return { valid: true, data: newArray };
    } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
      return { valid: true, data: a };
    } else {
      return { valid: false };
    }
  }
  var ZodIntersection = class extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      const handleParsed = (parsedLeft, parsedRight) => {
        if (isAborted(parsedLeft) || isAborted(parsedRight)) {
          return INVALID;
        }
        const merged = mergeValues(parsedLeft.value, parsedRight.value);
        if (!merged.valid) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_intersection_types
          });
          return INVALID;
        }
        if (isDirty(parsedLeft) || isDirty(parsedRight)) {
          status.dirty();
        }
        return { status: status.value, value: merged.data };
      };
      if (ctx.common.async) {
        return Promise.all([
          this._def.left._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }),
          this._def.right._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          })
        ]).then(([left, right]) => handleParsed(left, right));
      } else {
        return handleParsed(this._def.left._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }), this._def.right._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }));
      }
    }
  };
  ZodIntersection.create = (left, right, params) => {
    return new ZodIntersection({
      left,
      right,
      typeName: ZodFirstPartyTypeKind.ZodIntersection,
      ...processCreateParams(params)
    });
  };
  var ZodTuple = class _ZodTuple extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.array) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.array,
          received: ctx.parsedType
        });
        return INVALID;
      }
      if (ctx.data.length < this._def.items.length) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: this._def.items.length,
          inclusive: true,
          exact: false,
          type: "array"
        });
        return INVALID;
      }
      const rest = this._def.rest;
      if (!rest && ctx.data.length > this._def.items.length) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: this._def.items.length,
          inclusive: true,
          exact: false,
          type: "array"
        });
        status.dirty();
      }
      const items = [...ctx.data].map((item, itemIndex) => {
        const schema = this._def.items[itemIndex] || this._def.rest;
        if (!schema)
          return null;
        return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
      }).filter((x) => !!x);
      if (ctx.common.async) {
        return Promise.all(items).then((results) => {
          return ParseStatus.mergeArray(status, results);
        });
      } else {
        return ParseStatus.mergeArray(status, items);
      }
    }
    get items() {
      return this._def.items;
    }
    rest(rest) {
      return new _ZodTuple({
        ...this._def,
        rest
      });
    }
  };
  ZodTuple.create = (schemas, params) => {
    if (!Array.isArray(schemas)) {
      throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
    }
    return new ZodTuple({
      items: schemas,
      typeName: ZodFirstPartyTypeKind.ZodTuple,
      rest: null,
      ...processCreateParams(params)
    });
  };
  var ZodRecord = class _ZodRecord extends ZodType {
    get keySchema() {
      return this._def.keyType;
    }
    get valueSchema() {
      return this._def.valueType;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.object) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.object,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const pairs = [];
      const keyType = this._def.keyType;
      const valueType = this._def.valueType;
      for (const key in ctx.data) {
        pairs.push({
          key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
          value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
          alwaysSet: key in ctx.data
        });
      }
      if (ctx.common.async) {
        return ParseStatus.mergeObjectAsync(status, pairs);
      } else {
        return ParseStatus.mergeObjectSync(status, pairs);
      }
    }
    get element() {
      return this._def.valueType;
    }
    static create(first, second, third) {
      if (second instanceof ZodType) {
        return new _ZodRecord({
          keyType: first,
          valueType: second,
          typeName: ZodFirstPartyTypeKind.ZodRecord,
          ...processCreateParams(third)
        });
      }
      return new _ZodRecord({
        keyType: ZodString.create(),
        valueType: first,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(second)
      });
    }
  };
  var ZodMap = class extends ZodType {
    get keySchema() {
      return this._def.keyType;
    }
    get valueSchema() {
      return this._def.valueType;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.map) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.map,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const keyType = this._def.keyType;
      const valueType = this._def.valueType;
      const pairs = [...ctx.data.entries()].map(([key, value], index) => {
        return {
          key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
          value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
        };
      });
      if (ctx.common.async) {
        const finalMap = /* @__PURE__ */ new Map();
        return Promise.resolve().then(async () => {
          for (const pair of pairs) {
            const key = await pair.key;
            const value = await pair.value;
            if (key.status === "aborted" || value.status === "aborted") {
              return INVALID;
            }
            if (key.status === "dirty" || value.status === "dirty") {
              status.dirty();
            }
            finalMap.set(key.value, value.value);
          }
          return { status: status.value, value: finalMap };
        });
      } else {
        const finalMap = /* @__PURE__ */ new Map();
        for (const pair of pairs) {
          const key = pair.key;
          const value = pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      }
    }
  };
  ZodMap.create = (keyType, valueType, params) => {
    return new ZodMap({
      valueType,
      keyType,
      typeName: ZodFirstPartyTypeKind.ZodMap,
      ...processCreateParams(params)
    });
  };
  var ZodSet = class _ZodSet extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.set) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.set,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const def = this._def;
      if (def.minSize !== null) {
        if (ctx.data.size < def.minSize.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: def.minSize.value,
            type: "set",
            inclusive: true,
            exact: false,
            message: def.minSize.message
          });
          status.dirty();
        }
      }
      if (def.maxSize !== null) {
        if (ctx.data.size > def.maxSize.value) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: def.maxSize.value,
            type: "set",
            inclusive: true,
            exact: false,
            message: def.maxSize.message
          });
          status.dirty();
        }
      }
      const valueType = this._def.valueType;
      function finalizeSet(elements2) {
        const parsedSet = /* @__PURE__ */ new Set();
        for (const element of elements2) {
          if (element.status === "aborted")
            return INVALID;
          if (element.status === "dirty")
            status.dirty();
          parsedSet.add(element.value);
        }
        return { status: status.value, value: parsedSet };
      }
      const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
      if (ctx.common.async) {
        return Promise.all(elements).then((elements2) => finalizeSet(elements2));
      } else {
        return finalizeSet(elements);
      }
    }
    min(minSize, message) {
      return new _ZodSet({
        ...this._def,
        minSize: { value: minSize, message: errorUtil.toString(message) }
      });
    }
    max(maxSize, message) {
      return new _ZodSet({
        ...this._def,
        maxSize: { value: maxSize, message: errorUtil.toString(message) }
      });
    }
    size(size, message) {
      return this.min(size, message).max(size, message);
    }
    nonempty(message) {
      return this.min(1, message);
    }
  };
  ZodSet.create = (valueType, params) => {
    return new ZodSet({
      valueType,
      minSize: null,
      maxSize: null,
      typeName: ZodFirstPartyTypeKind.ZodSet,
      ...processCreateParams(params)
    });
  };
  var ZodFunction = class _ZodFunction extends ZodType {
    constructor() {
      super(...arguments);
      this.validate = this.implement;
    }
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.function) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.function,
          received: ctx.parsedType
        });
        return INVALID;
      }
      function makeArgsIssue(args, error) {
        return makeIssue({
          data: args,
          path: ctx.path,
          errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
          issueData: {
            code: ZodIssueCode.invalid_arguments,
            argumentsError: error
          }
        });
      }
      function makeReturnsIssue(returns, error) {
        return makeIssue({
          data: returns,
          path: ctx.path,
          errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
          issueData: {
            code: ZodIssueCode.invalid_return_type,
            returnTypeError: error
          }
        });
      }
      const params = { errorMap: ctx.common.contextualErrorMap };
      const fn = ctx.data;
      if (this._def.returns instanceof ZodPromise) {
        const me = this;
        return OK(async function(...args) {
          const error = new ZodError([]);
          const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
            error.addIssue(makeArgsIssue(args, e));
            throw error;
          });
          const result = await Reflect.apply(fn, this, parsedArgs);
          const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
            error.addIssue(makeReturnsIssue(result, e));
            throw error;
          });
          return parsedReturns;
        });
      } else {
        const me = this;
        return OK(function(...args) {
          const parsedArgs = me._def.args.safeParse(args, params);
          if (!parsedArgs.success) {
            throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
          }
          const result = Reflect.apply(fn, this, parsedArgs.data);
          const parsedReturns = me._def.returns.safeParse(result, params);
          if (!parsedReturns.success) {
            throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
          }
          return parsedReturns.data;
        });
      }
    }
    parameters() {
      return this._def.args;
    }
    returnType() {
      return this._def.returns;
    }
    args(...items) {
      return new _ZodFunction({
        ...this._def,
        args: ZodTuple.create(items).rest(ZodUnknown.create())
      });
    }
    returns(returnType) {
      return new _ZodFunction({
        ...this._def,
        returns: returnType
      });
    }
    implement(func) {
      const validatedFunc = this.parse(func);
      return validatedFunc;
    }
    strictImplement(func) {
      const validatedFunc = this.parse(func);
      return validatedFunc;
    }
    static create(args, returns, params) {
      return new _ZodFunction({
        args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
        returns: returns || ZodUnknown.create(),
        typeName: ZodFirstPartyTypeKind.ZodFunction,
        ...processCreateParams(params)
      });
    }
  };
  var ZodLazy = class extends ZodType {
    get schema() {
      return this._def.getter();
    }
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const lazySchema = this._def.getter();
      return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
    }
  };
  ZodLazy.create = (getter, params) => {
    return new ZodLazy({
      getter,
      typeName: ZodFirstPartyTypeKind.ZodLazy,
      ...processCreateParams(params)
    });
  };
  var ZodLiteral = class extends ZodType {
    _parse(input) {
      if (input.data !== this._def.value) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_literal,
          expected: this._def.value
        });
        return INVALID;
      }
      return { status: "valid", value: input.data };
    }
    get value() {
      return this._def.value;
    }
  };
  ZodLiteral.create = (value, params) => {
    return new ZodLiteral({
      value,
      typeName: ZodFirstPartyTypeKind.ZodLiteral,
      ...processCreateParams(params)
    });
  };
  function createZodEnum(values, params) {
    return new ZodEnum({
      values,
      typeName: ZodFirstPartyTypeKind.ZodEnum,
      ...processCreateParams(params)
    });
  }
  var ZodEnum = class _ZodEnum extends ZodType {
    _parse(input) {
      if (typeof input.data !== "string") {
        const ctx = this._getOrReturnCtx(input);
        const expectedValues = this._def.values;
        addIssueToContext(ctx, {
          expected: util.joinValues(expectedValues),
          received: ctx.parsedType,
          code: ZodIssueCode.invalid_type
        });
        return INVALID;
      }
      if (!this._cache) {
        this._cache = new Set(this._def.values);
      }
      if (!this._cache.has(input.data)) {
        const ctx = this._getOrReturnCtx(input);
        const expectedValues = this._def.values;
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_enum_value,
          options: expectedValues
        });
        return INVALID;
      }
      return OK(input.data);
    }
    get options() {
      return this._def.values;
    }
    get enum() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    get Values() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    get Enum() {
      const enumValues = {};
      for (const val of this._def.values) {
        enumValues[val] = val;
      }
      return enumValues;
    }
    extract(values, newDef = this._def) {
      return _ZodEnum.create(values, {
        ...this._def,
        ...newDef
      });
    }
    exclude(values, newDef = this._def) {
      return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
        ...this._def,
        ...newDef
      });
    }
  };
  ZodEnum.create = createZodEnum;
  var ZodNativeEnum = class extends ZodType {
    _parse(input) {
      const nativeEnumValues = util.getValidEnumValues(this._def.values);
      const ctx = this._getOrReturnCtx(input);
      if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
        const expectedValues = util.objectValues(nativeEnumValues);
        addIssueToContext(ctx, {
          expected: util.joinValues(expectedValues),
          received: ctx.parsedType,
          code: ZodIssueCode.invalid_type
        });
        return INVALID;
      }
      if (!this._cache) {
        this._cache = new Set(util.getValidEnumValues(this._def.values));
      }
      if (!this._cache.has(input.data)) {
        const expectedValues = util.objectValues(nativeEnumValues);
        addIssueToContext(ctx, {
          received: ctx.data,
          code: ZodIssueCode.invalid_enum_value,
          options: expectedValues
        });
        return INVALID;
      }
      return OK(input.data);
    }
    get enum() {
      return this._def.values;
    }
  };
  ZodNativeEnum.create = (values, params) => {
    return new ZodNativeEnum({
      values,
      typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
      ...processCreateParams(params)
    });
  };
  var ZodPromise = class extends ZodType {
    unwrap() {
      return this._def.type;
    }
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.promise,
          received: ctx.parsedType
        });
        return INVALID;
      }
      const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
      return OK(promisified.then((data) => {
        return this._def.type.parseAsync(data, {
          path: ctx.path,
          errorMap: ctx.common.contextualErrorMap
        });
      }));
    }
  };
  ZodPromise.create = (schema, params) => {
    return new ZodPromise({
      type: schema,
      typeName: ZodFirstPartyTypeKind.ZodPromise,
      ...processCreateParams(params)
    });
  };
  var ZodEffects = class extends ZodType {
    innerType() {
      return this._def.schema;
    }
    sourceType() {
      return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
    }
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      const effect = this._def.effect || null;
      const checkCtx = {
        addIssue: (arg) => {
          addIssueToContext(ctx, arg);
          if (arg.fatal) {
            status.abort();
          } else {
            status.dirty();
          }
        },
        get path() {
          return ctx.path;
        }
      };
      checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
      if (effect.type === "preprocess") {
        const processed = effect.transform(ctx.data, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(processed).then(async (processed2) => {
            if (status.value === "aborted")
              return INVALID;
            const result = await this._def.schema._parseAsync({
              data: processed2,
              path: ctx.path,
              parent: ctx
            });
            if (result.status === "aborted")
              return INVALID;
            if (result.status === "dirty")
              return DIRTY(result.value);
            if (status.value === "dirty")
              return DIRTY(result.value);
            return result;
          });
        } else {
          if (status.value === "aborted")
            return INVALID;
          const result = this._def.schema._parseSync({
            data: processed,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        }
      }
      if (effect.type === "refinement") {
        const executeRefinement = (acc) => {
          const result = effect.refinement(acc, checkCtx);
          if (ctx.common.async) {
            return Promise.resolve(result);
          }
          if (result instanceof Promise) {
            throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
          }
          return acc;
        };
        if (ctx.common.async === false) {
          const inner = this._def.schema._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          executeRefinement(inner.value);
          return { status: status.value, value: inner.value };
        } else {
          return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
            if (inner.status === "aborted")
              return INVALID;
            if (inner.status === "dirty")
              status.dirty();
            return executeRefinement(inner.value).then(() => {
              return { status: status.value, value: inner.value };
            });
          });
        }
      }
      if (effect.type === "transform") {
        if (ctx.common.async === false) {
          const base = this._def.schema._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (!isValid(base))
            return INVALID;
          const result = effect.transform(base.value, checkCtx);
          if (result instanceof Promise) {
            throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
          }
          return { status: status.value, value: result };
        } else {
          return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
            if (!isValid(base))
              return INVALID;
            return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
              status: status.value,
              value: result
            }));
          });
        }
      }
      util.assertNever(effect);
    }
  };
  ZodEffects.create = (schema, effect, params) => {
    return new ZodEffects({
      schema,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect,
      ...processCreateParams(params)
    });
  };
  ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
    return new ZodEffects({
      schema,
      effect: { type: "preprocess", transform: preprocess },
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      ...processCreateParams(params)
    });
  };
  var ZodOptional = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType === ZodParsedType.undefined) {
        return OK(void 0);
      }
      return this._def.innerType._parse(input);
    }
    unwrap() {
      return this._def.innerType;
    }
  };
  ZodOptional.create = (type, params) => {
    return new ZodOptional({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodOptional,
      ...processCreateParams(params)
    });
  };
  var ZodNullable = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType === ZodParsedType.null) {
        return OK(null);
      }
      return this._def.innerType._parse(input);
    }
    unwrap() {
      return this._def.innerType;
    }
  };
  ZodNullable.create = (type, params) => {
    return new ZodNullable({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodNullable,
      ...processCreateParams(params)
    });
  };
  var ZodDefault = class extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      let data = ctx.data;
      if (ctx.parsedType === ZodParsedType.undefined) {
        data = this._def.defaultValue();
      }
      return this._def.innerType._parse({
        data,
        path: ctx.path,
        parent: ctx
      });
    }
    removeDefault() {
      return this._def.innerType;
    }
  };
  ZodDefault.create = (type, params) => {
    return new ZodDefault({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodDefault,
      defaultValue: typeof params.default === "function" ? params.default : () => params.default,
      ...processCreateParams(params)
    });
  };
  var ZodCatch = class extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const newCtx = {
        ...ctx,
        common: {
          ...ctx.common,
          issues: []
        }
      };
      const result = this._def.innerType._parse({
        data: newCtx.data,
        path: newCtx.path,
        parent: {
          ...newCtx
        }
      });
      if (isAsync(result)) {
        return result.then((result2) => {
          return {
            status: "valid",
            value: result2.status === "valid" ? result2.value : this._def.catchValue({
              get error() {
                return new ZodError(newCtx.common.issues);
              },
              input: newCtx.data
            })
          };
        });
      } else {
        return {
          status: "valid",
          value: result.status === "valid" ? result.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      }
    }
    removeCatch() {
      return this._def.innerType;
    }
  };
  ZodCatch.create = (type, params) => {
    return new ZodCatch({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodCatch,
      catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
      ...processCreateParams(params)
    });
  };
  var ZodNaN = class extends ZodType {
    _parse(input) {
      const parsedType = this._getType(input);
      if (parsedType !== ZodParsedType.nan) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.nan,
          received: ctx.parsedType
        });
        return INVALID;
      }
      return { status: "valid", value: input.data };
    }
  };
  ZodNaN.create = (params) => {
    return new ZodNaN({
      typeName: ZodFirstPartyTypeKind.ZodNaN,
      ...processCreateParams(params)
    });
  };
  var BRAND = /* @__PURE__ */ Symbol("zod_brand");
  var ZodBranded = class extends ZodType {
    _parse(input) {
      const { ctx } = this._processInputParams(input);
      const data = ctx.data;
      return this._def.type._parse({
        data,
        path: ctx.path,
        parent: ctx
      });
    }
    unwrap() {
      return this._def.type;
    }
  };
  var ZodPipeline = class _ZodPipeline extends ZodType {
    _parse(input) {
      const { status, ctx } = this._processInputParams(input);
      if (ctx.common.async) {
        const handleAsync = async () => {
          const inResult = await this._def.in._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inResult.status === "aborted")
            return INVALID;
          if (inResult.status === "dirty") {
            status.dirty();
            return DIRTY(inResult.value);
          } else {
            return this._def.out._parseAsync({
              data: inResult.value,
              path: ctx.path,
              parent: ctx
            });
          }
        };
        return handleAsync();
      } else {
        const inResult = this._def.in._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return {
            status: "dirty",
            value: inResult.value
          };
        } else {
          return this._def.out._parseSync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      }
    }
    static create(a, b) {
      return new _ZodPipeline({
        in: a,
        out: b,
        typeName: ZodFirstPartyTypeKind.ZodPipeline
      });
    }
  };
  var ZodReadonly = class extends ZodType {
    _parse(input) {
      const result = this._def.innerType._parse(input);
      const freeze = (data) => {
        if (isValid(data)) {
          data.value = Object.freeze(data.value);
        }
        return data;
      };
      return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
    }
    unwrap() {
      return this._def.innerType;
    }
  };
  ZodReadonly.create = (type, params) => {
    return new ZodReadonly({
      innerType: type,
      typeName: ZodFirstPartyTypeKind.ZodReadonly,
      ...processCreateParams(params)
    });
  };
  function cleanParams(params, data) {
    const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
    const p2 = typeof p === "string" ? { message: p } : p;
    return p2;
  }
  function custom(check, _params = {}, fatal) {
    if (check)
      return ZodAny.create().superRefine((data, ctx) => {
        const r = check(data);
        if (r instanceof Promise) {
          return r.then((r2) => {
            if (!r2) {
              const params = cleanParams(_params, data);
              const _fatal = params.fatal ?? fatal ?? true;
              ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
            }
          });
        }
        if (!r) {
          const params = cleanParams(_params, data);
          const _fatal = params.fatal ?? fatal ?? true;
          ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
        }
        return;
      });
    return ZodAny.create();
  }
  var late = {
    object: ZodObject.lazycreate
  };
  var ZodFirstPartyTypeKind;
  (function(ZodFirstPartyTypeKind2) {
    ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
    ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
    ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
    ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
    ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
    ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
    ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
    ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
    ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
    ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
    ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
    ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
    ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
    ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
    ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
    ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
    ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
    ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
    ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
    ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
    ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
    ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
    ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
    ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
    ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
    ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
    ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
    ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
    ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
    ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
    ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
    ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
    ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
    ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
    ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
    ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
  })(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
  var instanceOfType = (cls, params = {
    message: `Input not instance of ${cls.name}`
  }) => custom((data) => data instanceof cls, params);
  var stringType = ZodString.create;
  var numberType = ZodNumber.create;
  var nanType = ZodNaN.create;
  var bigIntType = ZodBigInt.create;
  var booleanType = ZodBoolean.create;
  var dateType = ZodDate.create;
  var symbolType = ZodSymbol.create;
  var undefinedType = ZodUndefined.create;
  var nullType = ZodNull.create;
  var anyType = ZodAny.create;
  var unknownType = ZodUnknown.create;
  var neverType = ZodNever.create;
  var voidType = ZodVoid.create;
  var arrayType = ZodArray.create;
  var objectType = ZodObject.create;
  var strictObjectType = ZodObject.strictCreate;
  var unionType = ZodUnion.create;
  var discriminatedUnionType = ZodDiscriminatedUnion.create;
  var intersectionType = ZodIntersection.create;
  var tupleType = ZodTuple.create;
  var recordType = ZodRecord.create;
  var mapType = ZodMap.create;
  var setType = ZodSet.create;
  var functionType = ZodFunction.create;
  var lazyType = ZodLazy.create;
  var literalType = ZodLiteral.create;
  var enumType = ZodEnum.create;
  var nativeEnumType = ZodNativeEnum.create;
  var promiseType = ZodPromise.create;
  var effectsType = ZodEffects.create;
  var optionalType = ZodOptional.create;
  var nullableType = ZodNullable.create;
  var preprocessType = ZodEffects.createWithPreprocess;
  var pipelineType = ZodPipeline.create;
  var ostring = () => stringType().optional();
  var onumber = () => numberType().optional();
  var oboolean = () => booleanType().optional();
  var coerce = {
    string: ((arg) => ZodString.create({ ...arg, coerce: true })),
    number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
    boolean: ((arg) => ZodBoolean.create({
      ...arg,
      coerce: true
    })),
    bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
    date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
  };
  var NEVER = INVALID;

  // src/security/validation.ts
  var VerdictEngineStatusSchema = external_exports.enum(["SAFE", "CAUTION", "DANGER"]);
  var VerdictActionSchema = external_exports.enum(["NONE", "WARN", "GO_BACK"]);
  var PageTypeSchema = external_exports.enum([
    "SEARCH_ENGINE",
    "NORMAL_WEBSITE",
    "INTERNAL_BROWSER_PAGE",
    "UNSUPPORTED_PAGE"
  ]);
  var EvidenceSeveritySchema = external_exports.enum(["HIGH", "MEDIUM", "LOW"]);
  var DecisionReasonSchema = external_exports.object({
    signal: external_exports.string().min(1),
    severity: EvidenceSeveritySchema,
    evidence: external_exports.string()
  });
  var VerdictDecisionSchema = external_exports.object({
    status: VerdictEngineStatusSchema,
    title: external_exports.string().min(1).max(200),
    message: external_exports.string().min(1).max(1e3),
    action: VerdictActionSchema,
    explanationAvailable: external_exports.boolean().optional(),
    decisionId: external_exports.string().optional(),
    timestamp: external_exports.number().optional(),
    reasons: external_exports.array(DecisionReasonSchema).optional(),
    pageType: PageTypeSchema.optional()
  });
  var PageSignalsSchema = external_exports.object({
    url: external_exports.string().url(),
    origin: external_exports.string(),
    hostname: external_exports.string(),
    protocol: external_exports.string(),
    title: external_exports.string(),
    canonicalUrl: external_exports.string().optional(),
    metaDescription: external_exports.string().optional(),
    hasSsl: external_exports.boolean()
  });
  var FormInputMetadataSchema = external_exports.object({
    type: external_exports.string(),
    nameAttribute: external_exports.string().optional(),
    autocomplete: external_exports.string().optional(),
    isRequired: external_exports.boolean()
  });
  var FormMetadataSchema = external_exports.object({
    action: external_exports.string().optional(),
    method: external_exports.string().optional(),
    isHttpsAction: external_exports.boolean(),
    inputs: external_exports.array(FormInputMetadataSchema),
    hasPasswordField: external_exports.boolean(),
    hasPaymentFields: external_exports.boolean()
  });
  var PaymentSignalsSchema = external_exports.object({
    hasPaymentForm: external_exports.boolean(),
    detectedGateways: external_exports.array(external_exports.string()),
    hasCheckoutButton: external_exports.boolean(),
    hasCartIndicator: external_exports.boolean(),
    currencySymbolsDetected: external_exports.array(external_exports.string()),
    isFakeGatewayImpersonation: external_exports.boolean().optional(),
    claimedGateways: external_exports.array(external_exports.string()).optional()
  });
  var NavigationSignalsSchema = external_exports.object({
    referrer: external_exports.string(),
    isIframe: external_exports.boolean(),
    frameDepth: external_exports.number(),
    hasHistoryTransitions: external_exports.boolean()
  });
  var BrandSignalsSchema = external_exports.object({
    claimedBrandName: external_exports.string().optional(),
    copyrightClaim: external_exports.string().optional(),
    logoAltTexts: external_exports.array(external_exports.string()),
    faviconUrl: external_exports.string().optional()
  });
  var SecuritySignalsSchema = external_exports.object({
    isSecureContext: external_exports.boolean(),
    protocol: external_exports.string(),
    hasMixedContentWarnings: external_exports.boolean(),
    hasCertificateIssue: external_exports.boolean()
  });
  var VerdictSignalsSchema = external_exports.object({
    schemaVersion: external_exports.string(),
    collectorVersion: external_exports.string(),
    timestamp: external_exports.number(),
    deviceId: external_exports.string().optional(),
    page: PageSignalsSchema,
    forms: external_exports.array(FormMetadataSchema),
    payment: PaymentSignalsSchema,
    navigation: NavigationSignalsSchema,
    brand: BrandSignalsSchema,
    security: SecuritySignalsSchema
  });
  var ExtensionMessageSchema = external_exports.discriminatedUnion("type", [
    external_exports.object({ type: external_exports.literal("COLLECT_SIGNALS") }),
    external_exports.object({
      type: external_exports.literal("SIGNALS_COLLECTED"),
      payload: external_exports.object({ signals: VerdictSignalsSchema })
    }),
    external_exports.object({ type: external_exports.literal("GET_PROTECTION_STATE") }),
    external_exports.object({
      type: external_exports.literal("SET_PROTECTION_STATE"),
      payload: external_exports.object({ enabled: external_exports.boolean() })
    }),
    external_exports.object({ type: external_exports.literal("GET_OVERLAY_STATE") }),
    external_exports.object({
      type: external_exports.literal("SET_OVERLAY_STATE"),
      payload: external_exports.object({ enabled: external_exports.boolean() })
    }),
    external_exports.object({
      type: external_exports.literal("GET_CURRENT_DECISION"),
      payload: external_exports.object({ tabId: external_exports.number().optional() }).optional()
    }),
    external_exports.object({ type: external_exports.literal("GET_ACTIVE_TAB_INFO") }),
    external_exports.object({ type: external_exports.literal("GET_DASHBOARD_DATA") }),
    external_exports.object({ type: external_exports.literal("CLEAR_HISTORY") }),
    external_exports.object({
      type: external_exports.literal("SHOW_DECISION"),
      payload: external_exports.object({ decision: VerdictDecisionSchema })
    }),
    external_exports.object({
      type: external_exports.literal("DISMISS_WARNING"),
      payload: external_exports.object({ decisionId: external_exports.string().optional() }).optional()
    }),
    external_exports.object({
      type: external_exports.literal("ALLOW_BYPASS"),
      payload: external_exports.object({
        url: external_exports.string(),
        decisionId: external_exports.string().optional()
      })
    }),
    external_exports.object({
      type: external_exports.literal("CHECK_BYPASS"),
      payload: external_exports.object({
        url: external_exports.string()
      })
    }),
    external_exports.object({
      type: external_exports.literal("CLEAR_BYPASS"),
      payload: external_exports.object({
        url: external_exports.string()
      })
    }),
    external_exports.object({ type: external_exports.literal("NAVIGATE_BACK") })
  ]);

  // src/collectors/normalization.ts
  function sanitizeSignals(rawSignals) {
    const normalizedUrl = sanitizeAndNormalizeUrl(rawSignals.page.url);
    const normalizedCanonical = rawSignals.page.canonicalUrl ? sanitizeAndNormalizeUrl(rawSignals.page.canonicalUrl) : void 0;
    const redacted = redactObject(rawSignals);
    const sanitized = {
      ...redacted,
      page: {
        ...redacted.page,
        url: normalizedUrl,
        canonicalUrl: normalizedCanonical,
        title: redacted.page.title.slice(0, 200),
        metaDescription: redacted.page.metaDescription?.slice(0, 300)
      },
      brand: {
        ...redacted.brand,
        claimedBrandName: redacted.brand.claimedBrandName?.slice(0, 100),
        copyrightClaim: redacted.brand.copyrightClaim?.slice(0, 150),
        logoAltTexts: redacted.brand.logoAltTexts.map((alt) => alt.slice(0, 100))
      },
      // Ensure form inputs strictly only contain metadata, never values
      forms: redacted.forms.map((form) => ({
        action: form.action ? sanitizeAndNormalizeUrl(form.action) : void 0,
        method: form.method?.toUpperCase(),
        isHttpsAction: form.isHttpsAction,
        hasPasswordField: form.hasPasswordField,
        hasPaymentFields: form.hasPaymentFields,
        inputs: form.inputs.map((inp) => ({
          type: inp.type.slice(0, 30),
          nameAttribute: inp.nameAttribute ? inp.nameAttribute.slice(0, 50) : void 0,
          autocomplete: inp.autocomplete ? inp.autocomplete.slice(0, 50) : void 0,
          isRequired: inp.isRequired
        }))
      }))
    };
    const parsed = VerdictSignalsSchema.parse(sanitized);
    return parsed;
  }

  // src/shared/utils/logger.ts
  var Logger = class {
    isDevelopment;
    constructor() {
      this.isDevelopment = typeof process !== "undefined" && true;
    }
    setDevelopment(isDev) {
      this.isDevelopment = isDev;
    }
    formatMessage(level, message) {
      const timestamp = (/* @__PURE__ */ new Date()).toISOString();
      return `[Verdict][${timestamp}][${level.toUpperCase()}] ${message}`;
    }
    debug(message, context) {
      if (this.isDevelopment) {
        if (context) {
          console.debug(this.formatMessage("debug", message), context);
        } else {
          console.debug(this.formatMessage("debug", message));
        }
      }
    }
    info(message, context) {
      if (this.isDevelopment) {
        if (context) {
          console.info(this.formatMessage("info", message), context);
        } else {
          console.info(this.formatMessage("info", message));
        }
      }
    }
    warn(message, context) {
      if (context) {
        console.warn(this.formatMessage("warn", message), context);
      } else {
        console.warn(this.formatMessage("warn", message));
      }
    }
    error(message, error) {
      if (error) {
        console.error(this.formatMessage("error", message), error);
      } else {
        console.error(this.formatMessage("error", message));
      }
    }
  };
  var logger = new Logger();

  // src/content/messaging.ts
  function sendToBackground(message) {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
        resolve({ success: false, error: "Chrome runtime unavailable" });
        return;
      }
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            logger.debug("Runtime message error:", { error: chrome.runtime.lastError.message });
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else {
            resolve(response || { success: true });
          }
        });
      } catch (err) {
        resolve({
          success: false,
          error: err instanceof Error ? err.message : String(err)
        });
      }
    });
  }

  // src/shared/utils/i18n.ts
  var STRINGS = {
    popup: {
      title: "VERDICT",
      tagline: "Browser Security",
      connected: "Protected",
      disconnected: "Protection Paused",
      connecting: "Connecting...",
      disconnecting: "Disconnecting...",
      statusActive: "Verdict is actively safeguarding your browsing.",
      statusInactive: "Protection is paused. Click the shield to reconnect.",
      settings: "Account",
      openDashboard: "Open Dashboard",
      currentSite: "CURRENT SITE",
      looksGood: "Looks good",
      beCareful: "Be careful here",
      dontPay: "Don't pay here"
    },
    warnings: {
      cautionBadge: "VERDICT ADVISORY",
      cautionTitle: "Caution Advised",
      cautionDefaultMessage: "Unverified operator signals detected. Proceed with heightened scrutiny.",
      dangerBadge: "THREAT PREVENTED",
      dangerTitle: "Don't pay here",
      dangerDefaultMessage: "This looks like a fake shop. Your money may not be safe.",
      takeMeBack: "Take me back",
      understandRisk: "I understand the risk",
      dismiss: "Dismiss",
      verdictBadge: "VERDICT SECURITY"
    },
    engine: {
      unavailable: "Service Offline",
      unavailableMessage: "Could not connect to Verdict security engine."
    }
  };
  function t(category, key) {
    return STRINGS[category][key];
  }

  // src/content/warning/styles.ts
  var WARNING_STYLES = `
  :host {
    all: initial !important;
    display: block !important;
    position: fixed !important;
    top: 0 !important;
    right: 0 !important;
    width: 0 !important;
    height: 0 !important;
    overflow: visible !important;
    z-index: 2147483647 !important;
    pointer-events: none !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
    color: #e4e4e7 !important;
    font-size: 12px !important;
    line-height: 1 !important;
    -webkit-font-smoothing: antialiased !important;
  }

  *, *::before, *::after {
    box-sizing: border-box !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  /* 28px comfortable indicator with hover & proximity ghosting */
  .verdict-floating-pill,
  .verdict-floating-pill * {
    pointer-events: none !important;
    user-select: none !important;
    -webkit-user-select: none !important;
  }

  .verdict-floating-pill {
    position: fixed !important;
    top: 12px !important;
    right: 14px !important;
    z-index: 2147483647 !important;
    width: auto !important;
    height: 28px !important;
    background: #18181b !important;
    border: 1px solid #27272a !important;
    border-radius: 6px !important;
    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4) !important;
    padding: 0 10px !important;
    display: inline-flex !important;
    align-items: center !important;
    gap: 7px !important;
    animation: verdictToastIn 0.15s ease-out !important;
    transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
  }

  /* Proximity evasion: vanishes completely when mouse pointer gets nearby so buttons underneath are accessible */
  .verdict-floating-pill.is-evading,
  .verdict-floating-pill.status-safe.is-evading,
  .verdict-floating-pill.status-danger.is-evading,
  .verdict-floating-pill.status-caution.is-evading,
  .verdict-floating-pill.status-scanning.is-evading {
    opacity: 0 !important;
    visibility: hidden !important;
    pointer-events: none !important;
    transform: translateY(-8px) scale(0.9) !important;
    transition: opacity 0.12s ease-out, visibility 0.12s ease-out, transform 0.12s ease-out !important;
  }

  /* Persistent Safe Badge - Always remains visible */
  .verdict-floating-pill.status-safe {
    background: #141a24 !important;
    border-color: rgba(34, 197, 94, 0.35) !important;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.5), 0 0 8px rgba(34, 197, 94, 0.15) !important;
  }

  /* Persistent Unsafe Badge - Red theme with caution alert */
  .verdict-floating-pill.status-danger {
    background: #1a0808 !important;
    border-color: rgba(239, 68, 68, 0.65) !important;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.6), 0 0 10px rgba(239, 68, 68, 0.3) !important;
    opacity: 1 !important;
  }

  .verdict-floating-pill.status-danger .danger-text {
    color: #ef4444 !important;
    font-weight: 700 !important;
  }

  .verdict-floating-pill:hover {
    border-color: rgba(34, 197, 94, 0.5) !important;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.6), 0 0 12px rgba(34, 197, 94, 0.25) !important;
    transform: translateY(-1px) scale(1.02) !important;
  }

  .verdict-floating-pill.status-danger:hover {
    border-color: rgba(239, 68, 68, 0.9) !important;
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.7), 0 0 16px rgba(239, 68, 68, 0.5) !important;
  }

  .verdict-floating-pill.status-caution {
    height: auto !important;
    min-height: 32px !important;
    padding: 6px 10px !important;
    border-color: #78350f !important;
    background: #1c1917 !important;
  }

  /* Vector icon container */
  .verdict-pill-icon {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    flex-shrink: 0 !important;
  }

  .verdict-pill-icon.scanning {
    color: #a1a1aa !important;
  }

  .verdict-pill-icon.safe {
    color: #22c55e !important;
  }

  .verdict-pill-icon.caution {
    color: #f59e0b !important;
  }

  .verdict-pill-icon.danger {
    color: #ef4444 !important;
  }

  /* Micro text */
  .verdict-pill-text {
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
    white-space: nowrap !important;
    color: #f4f4f5 !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    letter-spacing: -0.01em !important;
  }

  .verdict-pill-title {
    font-weight: 600 !important;
    color: #ffffff !important;
  }

  .verdict-pill-subtitle {
    color: #a1a1aa !important;
    font-weight: 400 !important;
  }

  /* Dismiss Button */
  .verdict-pill-close {
    background: transparent !important;
    border: none !important;
    color: #71717a !important;
    cursor: pointer !important;
    padding: 2px !important;
    border-radius: 3px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: color 0.12s ease !important;
    margin-left: 2px !important;
    pointer-events: auto !important;
  }

  .verdict-pill-close:hover {
    color: #f4f4f5 !important;
  }

  /* Danger Security Warning Firewall Backdrop & Atmosphere */
  .verdict-danger-backdrop {
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: radial-gradient(circle at 50% 32%, #22080d 0%, #0f0a0e 55%, #050406 100%) !important;
    backdrop-filter: blur(30px) saturate(200%) !important;
    -webkit-backdrop-filter: blur(30px) saturate(200%) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 24px 16px !important;
    pointer-events: auto !important;
    animation: verdictFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
    z-index: 2147483647 !important;
    overflow-y: auto !important;
    box-sizing: border-box !important;
  }

  .verdict-danger-backdrop::before {
    content: '' !important;
    position: absolute !important;
    inset: 0 !important;
    background-image: 
      linear-gradient(rgba(239, 68, 68, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(239, 68, 68, 0.04) 1px, transparent 1px) !important;
    background-size: 32px 32px !important;
    pointer-events: none !important;
    opacity: 0.8 !important;
  }

  .verdict-danger-card {
    position: relative !important;
    background: linear-gradient(165deg, rgba(24, 16, 20, 0.95) 0%, rgba(13, 11, 15, 0.98) 100%) !important;
    border: 1px solid rgba(239, 68, 68, 0.45) !important;
    border-top: 1px solid rgba(248, 113, 113, 0.75) !important;
    border-radius: 16px !important;
    width: min(520px, 94vw) !important;
    padding: 32px 28px 24px !important;
    box-shadow: 
      0 28px 70px -10px rgba(0, 0, 0, 0.9),
      0 0 50px -10px rgba(239, 68, 68, 0.3),
      inset 0 1px 1px rgba(255, 255, 255, 0.15) !important;
    text-align: center !important;
    pointer-events: auto !important;
    animation: verdictCardPop 0.32s cubic-bezier(0.16, 1, 0.3, 1) !important;
    box-sizing: border-box !important;
    z-index: 2 !important;
  }

  /* Shield & Radar Pulse Header */
  .verdict-danger-header {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    margin-bottom: 20px !important;
    gap: 12px !important;
  }

  .verdict-danger-shield-wrapper {
    position: relative !important;
    width: 64px !important;
    height: 64px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .verdict-danger-shield-pulse {
    position: absolute !important;
    inset: -6px !important;
    border-radius: 50% !important;
    background: rgba(239, 68, 68, 0.22) !important;
    animation: verdictRadarPulse 2.2s ease-out infinite !important;
  }

  .verdict-danger-shield-icon {
    position: relative !important;
    width: 58px !important;
    height: 58px !important;
    border-radius: 16px !important;
    background: linear-gradient(145deg, rgba(239, 68, 68, 0.2) 0%, rgba(153, 27, 27, 0.35) 100%) !important;
    border: 1px solid rgba(239, 68, 68, 0.5) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: #ef4444 !important;
    box-shadow: 0 0 24px rgba(239, 68, 68, 0.4), inset 0 0 12px rgba(239, 68, 68, 0.25) !important;
  }

  /* Explicit Payment Hazard Callout */
  .verdict-danger-payment-warning {
    display: flex !important;
    align-items: flex-start !important;
    gap: 12px !important;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.18) 0%, rgba(185, 28, 28, 0.28) 100%) !important;
    border: 1px solid rgba(239, 68, 68, 0.65) !important;
    border-radius: 10px !important;
    padding: 12px 14px !important;
    margin-bottom: 18px !important;
    text-align: left !important;
    box-shadow: 0 4px 14px rgba(239, 68, 68, 0.15) !important;
  }

  .verdict-payment-warning-icon {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: #ef4444 !important;
    flex-shrink: 0 !important;
    margin-top: 1px !important;
  }

  .verdict-payment-warning-content {
    display: flex !important;
    flex-direction: column !important;
    gap: 3px !important;
  }

  .verdict-payment-warning-title {
    font-size: 11px !important;
    font-weight: 800 !important;
    color: #fca5a5 !important;
    letter-spacing: 0.05em !important;
    text-transform: uppercase !important;
  }

  .verdict-payment-warning-text {
    font-size: 12px !important;
    color: #ffffff !important;
    font-weight: 600 !important;
    line-height: 1.4 !important;
  }

  .verdict-danger-badge-dot {
    width: 7px !important;
    height: 7px !important;
    border-radius: 50% !important;
    background: #ef4444 !important;
    box-shadow: 0 0 8px #ef4444 !important;
    animation: verdictBlink 1.4s ease-in-out infinite !important;
  }

  .verdict-danger-badge-text {
    font-size: 11px !important;
    font-weight: 700 !important;
    letter-spacing: 0.08em !important;
    text-transform: uppercase !important;
    color: #fca5a5 !important;
  }

  /* Typography */
  .verdict-danger-title {
    font-size: 22px !important;
    font-weight: 700 !important;
    color: #ffffff !important;
    letter-spacing: -0.02em !important;
    line-height: 1.25 !important;
    margin-bottom: 8px !important;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.6) !important;
  }

  .verdict-danger-desc {
    font-size: 13.5px !important;
    color: #cbd5e1 !important;
    line-height: 1.55 !important;
    max-width: 440px !important;
    margin: 0 auto 16px !important;
    font-weight: 400 !important;
  }

  /* Intercepted Target Domain Pill */
  .verdict-danger-target-pill {
    display: inline-flex !important;
    align-items: center !important;
    gap: 8px !important;
    padding: 6px 14px !important;
    background: rgba(0, 0, 0, 0.5) !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 8px !important;
    margin-bottom: 18px !important;
    max-width: 100% !important;
    box-sizing: border-box !important;
  }

  .verdict-target-domain {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 12px !important;
    color: #f1f5f9 !important;
    font-weight: 500 !important;
    max-width: 280px !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
  }

  .verdict-target-status {
    font-size: 9.5px !important;
    font-weight: 700 !important;
    padding: 2px 6px !important;
    border-radius: 4px !important;
    background: rgba(239, 68, 68, 0.25) !important;
    color: #fca5a5 !important;
    letter-spacing: 0.04em !important;
  }

  /* Threat Intelligence Panel */
  .verdict-danger-intel-box {
    background: rgba(10, 8, 12, 0.75) !important;
    border: 1px solid rgba(239, 68, 68, 0.25) !important;
    border-radius: 10px !important;
    padding: 12px 14px !important;
    margin-bottom: 22px !important;
    text-align: left !important;
  }

  .verdict-intel-header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    margin-bottom: 8px !important;
    padding-bottom: 6px !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
  }

  .verdict-intel-tag {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
    font-size: 10px !important;
    font-weight: 700 !important;
    color: #f87171 !important;
    letter-spacing: 0.05em !important;
  }

  .verdict-intel-risk-level {
    font-size: 9.5px !important;
    font-weight: 700 !important;
    color: #ef4444 !important;
    letter-spacing: 0.04em !important;
    background: rgba(239, 68, 68, 0.15) !important;
    padding: 1px 6px !important;
    border-radius: 4px !important;
  }

  .verdict-danger-reasons {
    display: flex !important;
    flex-direction: column !important;
    gap: 6px !important;
  }

  .verdict-danger-reason-item {
    display: flex !important;
    align-items: flex-start !important;
    gap: 8px !important;
    font-size: 12px !important;
    color: #e2e8f0 !important;
    line-height: 1.45 !important;
  }

  .verdict-reason-bullet {
    width: 6px !important;
    height: 6px !important;
    border-radius: 50% !important;
    background: #ef4444 !important;
    flex-shrink: 0 !important;
    margin-top: 5px !important;
    box-shadow: 0 0 6px rgba(239, 68, 68, 0.8) !important;
  }

  /* Actions Layout */
  .verdict-danger-actions {
    display: flex !important;
    flex-direction: column !important;
    gap: 10px !important;
  }

  .verdict-btn {
    position: relative !important;
    border-radius: 10px !important;
    padding: 12px 20px !important;
    font-size: 13.5px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 8px !important;
    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1) !important;
    border: none !important;
    outline: none !important;
    pointer-events: auto !important;
    user-select: none !important;
    -webkit-user-select: none !important;
  }

  .verdict-btn-primary {
    background: linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%) !important;
    color: #ffffff !important;
    box-shadow: 0 4px 18px rgba(239, 68, 68, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.25) !important;
  }

  .verdict-btn-primary:hover {
    background: linear-gradient(135deg, #f87171 0%, #ef4444 50%, #dc2626 100%) !important;
    box-shadow: 0 6px 24px rgba(239, 68, 68, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.35) !important;
    transform: translateY(-1.5px) !important;
  }

  .verdict-btn-primary:active {
    transform: translateY(0.5px) !important;
    box-shadow: 0 2px 10px rgba(239, 68, 68, 0.4) !important;
  }

  .verdict-btn-primary:focus-visible {
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.5), 0 0 0 1px #ffffff !important;
  }

  .verdict-btn-secondary {
    background: rgba(255, 255, 255, 0.04) !important;
    color: #94a3b8 !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    font-size: 12.5px !important;
    font-weight: 500 !important;
    padding: 9px 16px !important;
  }

  .verdict-btn-secondary:hover {
    background: rgba(255, 255, 255, 0.08) !important;
    color: #f1f5f9 !important;
    border-color: rgba(255, 255, 255, 0.2) !important;
  }

  .verdict-btn-secondary:active {
    background: rgba(255, 255, 255, 0.03) !important;
  }

  /* Footer Note */
  .verdict-danger-footer {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px !important;
    margin-top: 18px !important;
    font-size: 10.5px !important;
    color: #64748b !important;
    letter-spacing: 0.01em !important;
  }

  @keyframes verdictToastIn {
    from {
      opacity: 0;
      transform: translateY(-3px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes verdictFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes verdictCardPop {
    from {
      opacity: 0;
      transform: translateY(14px) scale(0.96);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes verdictRadarPulse {
    0% {
      transform: scale(0.9);
      opacity: 0.8;
    }
    50% {
      transform: scale(1.35);
      opacity: 0;
    }
    100% {
      transform: scale(1.35);
      opacity: 0;
    }
  }

  @keyframes verdictBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.35; }
  }

  @keyframes verdictSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .verdict-spinner {
    animation: verdictSpin 0.85s linear infinite !important;
  }

  @media (prefers-reduced-motion: reduce) {
    .verdict-floating-pill,
    .verdict-danger-backdrop,
    .verdict-danger-card,
    .verdict-danger-shield-pulse,
    .verdict-danger-badge-dot,
    .verdict-spinner {
      animation: none !important;
      transition: none !important;
    }
  }
`;

  // src/content/warning/WarningOverlay.ts
  var ICONS = {
    spinner: `
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="verdict-spinner">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  `,
    check: `
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  `,
    alertTriangle: `
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  `,
    alertTriangleRed: `
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  `,
    shieldAlert: `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  `,
    shieldAlertLarge: `
    <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  `,
    arrowLeft: `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m12 19-7-7 7-7"/>
      <path d="M19 12H5"/>
    </svg>
  `,
    arrowRight: `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 12h14"/>
      <path d="m12 5 7 7-7 7"/>
    </svg>
  `,
    lock: `
    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  `,
    creditCardBlocked: `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2"/>
      <line x1="2" x2="22" y1="10" y2="10"/>
      <line x1="2" x2="22" y1="2" y2="22" stroke="#f87171" stroke-width="2.5"/>
    </svg>
  `,
    close: `
    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  `
  };
  var WarningOverlayManager = class {
    hostElement = null;
    shadowRoot = null;
    autoDismissTimer = null;
    proximityCleanups = [];
    isFirewallLocked = false;
    detachedPageContent = [];
    isolatePageDom() {
      try {
        if (typeof window !== "undefined" && typeof window.stop === "function") {
          window.stop();
        }
        if (typeof document !== "undefined" && document.body) {
          const children = Array.from(document.body.childNodes);
          this.detachedPageContent = [];
          for (const child of children) {
            if (child !== this.hostElement) {
              this.detachedPageContent.push(child);
              document.body.removeChild(child);
            }
          }
        }
      } catch {
      }
    }
    restorePageDom() {
      try {
        if (typeof document !== "undefined" && document.body && this.detachedPageContent.length > 0) {
          for (const child of this.detachedPageContent) {
            if (!document.body.contains(child)) {
              document.body.appendChild(child);
            }
          }
          this.detachedPageContent = [];
        }
      } catch {
      }
    }
    activateFirewallLock() {
      if (this.isFirewallLocked) return;
      this.isFirewallLocked = true;
      try {
        if (typeof document !== "undefined") {
          if (document.documentElement) {
            document.documentElement.style.setProperty("overflow", "hidden", "important");
          }
          if (document.body) {
            document.body.style.setProperty("overflow", "hidden", "important");
          }
        }
      } catch {
      }
    }
    releaseFirewallLock() {
      if (!this.isFirewallLocked) return;
      this.isFirewallLocked = false;
      try {
        if (typeof document !== "undefined") {
          if (document.documentElement) {
            document.documentElement.style.removeProperty("overflow");
          }
          if (document.body) {
            document.body.style.removeProperty("overflow");
          }
        }
      } catch {
      }
    }
    removeWarning() {
      this.releaseFirewallLock();
      this.restorePageDom();
      if (this.autoDismissTimer) {
        clearTimeout(this.autoDismissTimer);
        this.autoDismissTimer = null;
      }
      this.proximityCleanups.forEach((cleanup) => cleanup());
      this.proximityCleanups = [];
      if (this.hostElement && this.hostElement.parentNode) {
        this.hostElement.parentNode.removeChild(this.hostElement);
      }
      this.hostElement = null;
      this.shadowRoot = null;
    }
    initProximityEvasion(pill) {
      const onMouseMove = (e) => {
        if (!pill.isConnected) return;
        const rect = pill.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return;
        const buffer = 60;
        const isNear = e.clientX >= rect.left - buffer && e.clientX <= rect.right + buffer && e.clientY >= rect.top - buffer && e.clientY <= rect.bottom + buffer;
        if (isNear) {
          pill.classList.add("is-evading");
          pill.style.setProperty("opacity", "0", "important");
          pill.style.setProperty("visibility", "hidden", "important");
          pill.style.setProperty("pointer-events", "none", "important");
          pill.style.setProperty("transform", "translateY(-6px) scale(0.92)", "important");
        } else {
          pill.classList.remove("is-evading");
          pill.style.removeProperty("opacity");
          pill.style.removeProperty("visibility");
          pill.style.removeProperty("pointer-events");
          pill.style.removeProperty("transform");
        }
      };
      window.addEventListener("mousemove", onMouseMove, { passive: true });
      this.proximityCleanups.push(() => {
        window.removeEventListener("mousemove", onMouseMove);
      });
    }
    attachPassthroughForwarder(element) {
      const handlePassthrough = (e) => {
        const targetEl = e.target;
        if (targetEl && (targetEl.id === "verdict-pill-close-btn" || targetEl.closest("#verdict-pill-close-btn"))) {
          return;
        }
        if (!this.hostElement) return;
        this.hostElement.style.setProperty("visibility", "hidden", "important");
        const underlyingElement = document.elementFromPoint(e.clientX, e.clientY);
        this.hostElement.style.setProperty("visibility", "visible", "important");
        if (underlyingElement && !this.hostElement.contains(underlyingElement)) {
          if (e.type === "click") {
            underlyingElement.click();
          } else {
            const clone = new MouseEvent(e.type, {
              bubbles: true,
              cancelable: true,
              view: window,
              clientX: e.clientX,
              clientY: e.clientY,
              screenX: e.screenX,
              screenY: e.screenY,
              button: e.button,
              buttons: e.buttons,
              ctrlKey: e.ctrlKey,
              shiftKey: e.shiftKey,
              altKey: e.altKey,
              metaKey: e.metaKey
            });
            underlyingElement.dispatchEvent(clone);
          }
        }
      };
      element.addEventListener("click", handlePassthrough);
      element.addEventListener("mousedown", handlePassthrough);
      element.addEventListener("pointerdown", handlePassthrough);
    }
    ensureShadowRoot() {
      if (this.shadowRoot && this.hostElement && this.hostElement.isConnected) {
        return this.shadowRoot;
      }
      this.removeWarning();
      this.hostElement = document.createElement("verdict-warning-container");
      this.hostElement.id = "verdict-security-capsule";
      this.hostElement.style.setProperty("all", "initial", "important");
      this.hostElement.style.setProperty("position", "fixed", "important");
      this.hostElement.style.setProperty("top", "0px", "important");
      this.hostElement.style.setProperty("right", "0px", "important");
      this.hostElement.style.setProperty("width", "0px", "important");
      this.hostElement.style.setProperty("height", "0px", "important");
      this.hostElement.style.setProperty("margin", "0px", "important");
      this.hostElement.style.setProperty("padding", "0px", "important");
      this.hostElement.style.setProperty("border", "none", "important");
      this.hostElement.style.setProperty("pointer-events", "none", "important");
      this.hostElement.style.setProperty("z-index", "2147483647", "important");
      this.hostElement.style.setProperty("display", "block", "important");
      this.shadowRoot = this.hostElement.attachShadow({ mode: "open" });
      const styleEl = document.createElement("style");
      styleEl.textContent = WARNING_STYLES;
      this.shadowRoot.appendChild(styleEl);
      const mount = () => {
        const parent = document.body || document.documentElement;
        if (parent && !parent.contains(this.hostElement)) {
          parent.appendChild(this.hostElement);
        }
      };
      mount();
      if (!document.body && typeof document !== "undefined") {
        window.addEventListener("DOMContentLoaded", mount, { once: true });
      }
      return this.shadowRoot;
    }
    showScanning() {
      const shadow = this.ensureShadowRoot();
      const existingPill = shadow.querySelector(".verdict-floating-pill");
      if (existingPill) existingPill.remove();
      const pill = document.createElement("div");
      pill.className = "verdict-floating-pill status-scanning";
      pill.setAttribute("role", "status");
      pill.setAttribute("aria-live", "polite");
      pill.style.setProperty("pointer-events", "none", "important");
      pill.innerHTML = `
      <div class="verdict-pill-icon scanning" aria-hidden="true">
        ${ICONS.spinner}
      </div>
      <div class="verdict-pill-text">
        <span class="verdict-pill-title">Verdict</span>
        <span class="verdict-pill-subtitle">Scanning</span>
      </div>
    `;
      this.attachPassthroughForwarder(pill);
      this.initProximityEvasion(pill);
      shadow.appendChild(pill);
    }
    showResult(decision, onTakeMeBack, onDismiss) {
      const shadow = this.ensureShadowRoot();
      if (decision.status === "DANGER") {
        this.removeWarning();
        this.isolatePageDom();
        this.activateFirewallLock();
        const newShadow = this.ensureShadowRoot();
        if (this.hostElement) {
          this.hostElement.style.setProperty("width", "100%", "important");
          this.hostElement.style.setProperty("height", "100%", "important");
          this.hostElement.style.setProperty("inset", "0px", "important");
          this.hostElement.style.setProperty("pointer-events", "auto", "important");
        }
        const backdrop = document.createElement("div");
        backdrop.className = "verdict-danger-backdrop";
        backdrop.setAttribute("role", "dialog");
        backdrop.setAttribute("aria-modal", "true");
        backdrop.setAttribute("aria-label", decision.title || "Security Warning");
        let hostDisplay = "Suspicious Domain";
        try {
          if (typeof window !== "undefined" && window.location) {
            hostDisplay = window.location.hostname || window.location.host || "Protected Session";
          }
        } catch {
        }
        const defaultEvidence = [
          "Unverified merchant identity or counterfeit brand signature detected",
          "Unauthorized credential or payment transmission vector intercepted",
          "Zero-Trust isolation enforced: high threat confidence score"
        ];
        const reasonsList = decision.reasons && decision.reasons.length > 0 ? decision.reasons.map((r) => `
            <div class="verdict-danger-reason-item">
              <span class="verdict-reason-bullet"></span>
              <span>${r.signal ? `<strong>${this.escapeHtml(r.signal.replace(/_/g, " "))}: </strong>` : ""}${this.escapeHtml(r.evidence)}</span>
            </div>
          `).join("") : defaultEvidence.map((ev) => `
            <div class="verdict-danger-reason-item">
              <span class="verdict-reason-bullet"></span>
              <span>${this.escapeHtml(ev)}</span>
            </div>
          `).join("");
        backdrop.innerHTML = `
        <div class="verdict-danger-card">
          <div class="verdict-danger-header">
            <div class="verdict-danger-shield-wrapper">
              <div class="verdict-danger-shield-pulse"></div>
              <div class="verdict-danger-shield-icon" aria-hidden="true">
                ${ICONS.shieldAlertLarge}
              </div>
            </div>
          </div>

          <h1 class="verdict-danger-title">${this.escapeHtml(decision.title || t("warnings", "dangerTitle"))}</h1>
          <p class="verdict-danger-desc">${this.escapeHtml(decision.message || t("warnings", "dangerDefaultMessage"))}</p>

          <div class="verdict-danger-payment-warning">
            <div class="verdict-payment-warning-icon" aria-hidden="true">
              ${ICONS.creditCardBlocked}
            </div>
            <div class="verdict-payment-warning-content">
              <span class="verdict-payment-warning-title">PAYMENT &amp; FINANCIAL HAZARD</span>
              <span class="verdict-payment-warning-text">DO NOT MAKE ANY PAYMENTS OR ENTER CREDIT CARD / BANKING DETAILS ON THIS SITE. VERDICT CANNOT GUARANTEE FINANCIAL SAFETY.</span>
            </div>
          </div>

          <div class="verdict-danger-target-pill">
            ${ICONS.lock}
            <span class="verdict-target-domain">${this.escapeHtml(hostDisplay)}</span>
            <span class="verdict-target-status">ISOLATED</span>
          </div>

          <div class="verdict-danger-intel-box">
            <div class="verdict-intel-header">
              <span class="verdict-intel-tag">// VERDICT THREAT TELEMETRY</span>
              <span class="verdict-intel-risk-level">HIGH RISK</span>
            </div>
            <div class="verdict-danger-reasons">
              ${reasonsList}
            </div>
          </div>

          <div class="verdict-danger-actions">
            <button class="verdict-btn verdict-btn-primary" id="verdict-back-btn">
              ${ICONS.arrowLeft}
              <span>${t("warnings", "takeMeBack")} (Recommended)</span>
            </button>
            <button class="verdict-btn verdict-btn-secondary" id="verdict-override-btn">
              <span>${t("warnings", "understandRisk")}</span>
              ${ICONS.arrowRight}
            </button>
          </div>

          <div class="verdict-danger-footer">
            <span>\u{1F6E1}\uFE0F VERDICT protected and secured</span>
          </div>
        </div>
      `;
        const backBtn = backdrop.querySelector("#verdict-back-btn");
        const overrideBtn = backdrop.querySelector("#verdict-override-btn");
        if (backBtn) {
          backBtn.addEventListener("click", () => {
            this.releaseFirewallLock();
            onTakeMeBack();
          });
          setTimeout(() => backBtn.focus(), 50);
        }
        if (overrideBtn) {
          overrideBtn.addEventListener("click", () => {
            this.restorePageDom();
            this.releaseFirewallLock();
            this.removeWarning();
            this.showPersistentUnsafePill(decision);
            onDismiss();
          });
        }
        newShadow.appendChild(backdrop);
        return;
      }
      let pill = shadow.querySelector(".verdict-floating-pill");
      if (!pill) {
        pill = document.createElement("div");
        shadow.appendChild(pill);
      }
      pill.style.setProperty("pointer-events", "none", "important");
      if (decision.status === "SAFE") {
        pill.className = "verdict-floating-pill status-safe";
        pill.innerHTML = `
        <div class="verdict-pill-icon safe" aria-hidden="true">
          ${ICONS.check}
        </div>
        <div class="verdict-pill-text">
          <span class="verdict-pill-title">Verdict</span>
          <span class="verdict-pill-subtitle">Safe</span>
        </div>
      `;
        this.attachPassthroughForwarder(pill);
        this.initProximityEvasion(pill);
        if (this.autoDismissTimer) {
          clearTimeout(this.autoDismissTimer);
          this.autoDismissTimer = null;
        }
      } else if (decision.status === "CAUTION") {
        pill.className = "verdict-floating-pill status-caution";
        pill.innerHTML = `
        <div class="verdict-pill-icon caution" aria-hidden="true">
          ${ICONS.alertTriangle}
        </div>
        <div class="verdict-pill-text">
          <span class="verdict-pill-title">Caution</span>
          <span class="verdict-pill-subtitle">${this.escapeHtml(decision.message || t("warnings", "cautionDefaultMessage"))}</span>
        </div>
        <button class="verdict-pill-close" aria-label="${t("warnings", "dismiss")}" id="verdict-pill-close-btn">
          ${ICONS.close}
        </button>
      `;
        const closeBtn = pill.querySelector("#verdict-pill-close-btn");
        if (closeBtn) {
          closeBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.removeWarning();
            onDismiss();
          });
        }
        this.attachPassthroughForwarder(pill);
        this.initProximityEvasion(pill);
        if (this.autoDismissTimer) clearTimeout(this.autoDismissTimer);
        this.autoDismissTimer = setTimeout(() => {
          if (pill) {
            pill.classList.add("is-exiting");
            setTimeout(() => this.removeWarning(), 180);
          }
        }, 4e3);
      }
    }
    showPersistentUnsafePill(_decision) {
      if (this.autoDismissTimer) {
        clearTimeout(this.autoDismissTimer);
        this.autoDismissTimer = null;
      }
      const shadow = this.ensureShadowRoot();
      const existingPill = shadow.querySelector(".verdict-floating-pill");
      if (existingPill) existingPill.remove();
      const pill = document.createElement("div");
      pill.className = "verdict-floating-pill status-danger";
      pill.setAttribute("role", "status");
      pill.setAttribute("aria-live", "assertive");
      pill.style.setProperty("pointer-events", "none", "important");
      pill.innerHTML = `
      <div class="verdict-pill-icon danger" aria-hidden="true">
        ${ICONS.alertTriangleRed}
      </div>
      <div class="verdict-pill-text">
        <span class="verdict-pill-title">Verdict</span>
        <span class="verdict-pill-subtitle danger-text">Unsafe</span>
      </div>
    `;
      this.attachPassthroughForwarder(pill);
      this.initProximityEvasion(pill);
      shadow.appendChild(pill);
    }
    render(decision, onTakeMeBack, onDismiss) {
      this.showResult(decision, onTakeMeBack, onDismiss);
    }
    escapeHtml(str) {
      const div = document.createElement("div");
      div.textContent = str;
      return div.innerHTML;
    }
  };

  // src/content/index.ts
  var warningManager = new WarningOverlayManager();
  var overlayEnabled = true;
  function handleTakeMeBack() {
    sendToBackground({ type: "NAVIGATE_BACK" });
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "about:blank";
    }
  }
  var isSessionOverridden = false;
  function isRiskOverridden() {
    return isSessionOverridden;
  }
  function handleDismissWarning(decisionId) {
    isSessionOverridden = true;
    sendToBackground({
      type: "ALLOW_BYPASS",
      payload: { url: window.location.href, decisionId }
    });
    sendToBackground({
      type: "DISMISS_WARNING",
      payload: { decisionId }
    });
  }
  var currentDecision = null;
  function setupFormSubmissionMonitoring() {
    document.addEventListener("submit", (e) => {
      const target = e.target;
      if (!target || target.tagName !== "FORM") {
        return;
      }
      const action = target.getAttribute("action") || window.location.href;
      const method = (target.getAttribute("method") || "GET").toUpperCase();
      const hasCardInput = target.querySelector(
        'input[name*="card" i], input[name*="cvv" i], input[name*="cvc" i], input[autocomplete*="cc-" i], input[placeholder*="1234" i], input[placeholder*="\u2022\u2022\u2022" i]'
      ) !== null;
      const isNonHttpsAction = !action.startsWith("https:") && !window.location.protocol.startsWith("https:");
      console.log("[Verdict] Runtime form submit monitored:", {
        action,
        method,
        hasCardInput,
        isNonHttpsAction,
        currentDecisionStatus: currentDecision?.status,
        isOverridden: isRiskOverridden()
      });
      if (hasCardInput && (isNonHttpsAction || currentDecision?.status === "DANGER" && !isRiskOverridden())) {
        console.warn("[Verdict] Potentially dangerous payment form submission intercepted!", {
          action,
          method
        });
        if (currentDecision?.status === "DANGER" && !isRiskOverridden()) {
          e.preventDefault();
          e.stopPropagation();
          warningManager.showResult(
            currentDecision,
            () => handleTakeMeBack(),
            () => handleDismissWarning(currentDecision?.decisionId)
          );
        }
      }
    }, true);
  }
  function handleDisplayDecision(decision) {
    currentDecision = decision;
    if (!overlayEnabled && decision.status !== "DANGER") {
      warningManager.removeWarning();
      return;
    }
    if (decision.status === "DANGER" && isRiskOverridden()) {
      warningManager.showPersistentUnsafePill(decision);
      return;
    }
    warningManager.showResult(
      decision,
      () => handleTakeMeBack(),
      () => handleDismissWarning(decision.decisionId)
    );
  }
  async function processAndSendSignals() {
    if (!isValidBrowsingUrl(window.location.href)) {
      return;
    }
    try {
      const rawSignals = collectAllSignals(document, window);
      const sanitized = sanitizeSignals(rawSignals);
      console.log("[Verdict] Signals collected for analysis:", {
        url: window.location.href,
        payment: sanitized.payment,
        brand: sanitized.brand,
        formsCount: sanitized.forms.length
      });
      const response = await sendToBackground({
        type: "SIGNALS_COLLECTED",
        payload: { signals: sanitized }
      });
      if (response && response.success && response.data) {
        console.log("[Verdict] Decision received from engine:", response.data);
        handleDisplayDecision(response.data);
      }
    } catch (error) {
      logger.error("Failed to collect and sanitize signals in content script", error);
    }
  }
  function setupMessageListeners() {
    if (typeof chrome === "undefined" || !chrome.runtime?.onMessage) {
      return;
    }
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      const parseResult = ExtensionMessageSchema.safeParse(message);
      if (!parseResult.success) {
        sendResponse({ success: false, error: "Invalid message structure" });
        return false;
      }
      const msg = parseResult.data;
      if (msg.type === "COLLECT_SIGNALS") {
        processAndSendSignals();
        sendResponse({ success: true });
        return false;
      }
      if (msg.type === "SHOW_DECISION") {
        handleDisplayDecision(msg.payload.decision);
        sendResponse({ success: true });
        return false;
      }
      if (msg.type === "SET_OVERLAY_STATE") {
        overlayEnabled = msg.payload.enabled;
        if (!overlayEnabled) {
          warningManager.removeWarning();
        }
        sendResponse({ success: true });
        return false;
      }
      return false;
    });
  }
  async function initialize() {
    if (window.top !== window.self) {
      return;
    }
    const pageType = classifyPage(window.location.href);
    if (pageType !== "NORMAL_WEBSITE") {
      logger.debug("Page classification skipped from threat scanning", {
        url: window.location.href,
        pageType
      });
      return;
    }
    console.log("[Verdict] Initializing safety analysis on:", window.location.href);
    setupMessageListeners();
    setupFormSubmissionMonitoring();
    warningManager.showScanning();
    try {
      const [protectionRes, overlayRes, bypassRes] = await Promise.all([
        sendToBackground({ type: "GET_PROTECTION_STATE" }),
        sendToBackground({ type: "GET_OVERLAY_STATE" }),
        sendToBackground({
          type: "CHECK_BYPASS",
          payload: { url: window.location.href }
        })
      ]);
      const isProtectionEnabled = protectionRes?.data?.enabled ?? true;
      overlayEnabled = overlayRes?.data?.enabled ?? true;
      const isBypassed = bypassRes?.data?.isBypassed ?? false;
      if (isBypassed) {
        isSessionOverridden = true;
      }
      if (!isProtectionEnabled || !overlayEnabled) {
        warningManager.removeWarning();
      }
    } catch (err) {
      logger.debug("Error checking initial states, continuing default scan", {
        error: err instanceof Error ? err.message : String(err)
      });
    }
    if (document.readyState === "complete" || document.readyState === "interactive") {
      processAndSendSignals();
    } else {
      window.addEventListener("DOMContentLoaded", () => processAndSendSignals(), { once: true });
    }
  }
  initialize();
})();
