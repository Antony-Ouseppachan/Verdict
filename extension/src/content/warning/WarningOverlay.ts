import type { VerdictDecision } from '../../shared/types/decision.ts';
import { t } from '../../shared/utils/i18n.ts';
import { WARNING_STYLES } from './styles.ts';

// Clean vector icons (12px)
const ICONS = {
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
  `,
};

export class WarningOverlayManager {
  private hostElement: HTMLElement | null = null;
  private shadowRoot: ShadowRoot | null = null;
  private autoDismissTimer: NodeJS.Timeout | null = null;
  private proximityCleanups: Array<() => void> = [];

  private isFirewallLocked = false;
  private detachedPageContent: Node[] = [];

  private isolatePageDom(): void {
    try {
      if (typeof window !== 'undefined' && typeof window.stop === 'function') {
        window.stop();
      }
      if (typeof document !== 'undefined' && document.body) {
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
      // ignore
    }
  }

  private restorePageDom(): void {
    try {
      if (typeof document !== 'undefined' && document.body && this.detachedPageContent.length > 0) {
        for (const child of this.detachedPageContent) {
          if (!document.body.contains(child)) {
            document.body.appendChild(child);
          }
        }
        this.detachedPageContent = [];
      }
    } catch {
      // ignore
    }
  }

  private activateFirewallLock(): void {
    if (this.isFirewallLocked) return;
    this.isFirewallLocked = true;
    try {
      if (typeof document !== 'undefined') {
        if (document.documentElement) {
          document.documentElement.style.setProperty('overflow', 'hidden', 'important');
        }
        if (document.body) {
          document.body.style.setProperty('overflow', 'hidden', 'important');
        }
      }
    } catch {
      // ignore
    }
  }

  private releaseFirewallLock(): void {
    if (!this.isFirewallLocked) return;
    this.isFirewallLocked = false;
    try {
      if (typeof document !== 'undefined') {
        if (document.documentElement) {
          document.documentElement.style.removeProperty('overflow');
        }
        if (document.body) {
          document.body.style.removeProperty('overflow');
        }
      }
    } catch {
      // ignore
    }
  }

  public removeWarning(): void {
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

  private initProximityEvasion(pill: HTMLElement): void {
    const onMouseMove = (e: MouseEvent) => {
      if (!pill.isConnected) return;
      const rect = pill.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;

      // 60px proximity buffer around badge perimeter
      const buffer = 60;
      const isNear =
        e.clientX >= rect.left - buffer &&
        e.clientX <= rect.right + buffer &&
        e.clientY >= rect.top - buffer &&
        e.clientY <= rect.bottom + buffer;

      if (isNear) {
        pill.classList.add('is-evading');
        pill.style.setProperty('opacity', '0', 'important');
        pill.style.setProperty('visibility', 'hidden', 'important');
        pill.style.setProperty('pointer-events', 'none', 'important');
        pill.style.setProperty('transform', 'translateY(-6px) scale(0.92)', 'important');
      } else {
        pill.classList.remove('is-evading');
        pill.style.removeProperty('opacity');
        pill.style.removeProperty('visibility');
        pill.style.removeProperty('pointer-events');
        pill.style.removeProperty('transform');
      }
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    this.proximityCleanups.push(() => {
      window.removeEventListener('mousemove', onMouseMove);
    });
  }

  private attachPassthroughForwarder(element: HTMLElement): void {
    const handlePassthrough = (e: MouseEvent | PointerEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (targetEl && (targetEl.id === 'verdict-pill-close-btn' || targetEl.closest('#verdict-pill-close-btn'))) {
        return;
      }

      if (!this.hostElement) return;

      this.hostElement.style.setProperty('visibility', 'hidden', 'important');
      const underlyingElement = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
      this.hostElement.style.setProperty('visibility', 'visible', 'important');

      if (underlyingElement && !this.hostElement.contains(underlyingElement)) {
        if (e.type === 'click') {
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
            metaKey: e.metaKey,
          });
          underlyingElement.dispatchEvent(clone);
        }
      }
    };

    element.addEventListener('click', handlePassthrough);
    element.addEventListener('mousedown', handlePassthrough);
    element.addEventListener('pointerdown', handlePassthrough);
  }

  private ensureShadowRoot(): ShadowRoot {
    if (this.shadowRoot && this.hostElement && this.hostElement.isConnected) {
      return this.shadowRoot;
    }

    this.removeWarning();
    this.hostElement = document.createElement('verdict-warning-container');
    this.hostElement.id = 'verdict-security-capsule';

    this.hostElement.style.setProperty('all', 'initial', 'important');
    this.hostElement.style.setProperty('position', 'fixed', 'important');
    this.hostElement.style.setProperty('top', '0px', 'important');
    this.hostElement.style.setProperty('right', '0px', 'important');
    this.hostElement.style.setProperty('width', '0px', 'important');
    this.hostElement.style.setProperty('height', '0px', 'important');
    this.hostElement.style.setProperty('margin', '0px', 'important');
    this.hostElement.style.setProperty('padding', '0px', 'important');
    this.hostElement.style.setProperty('border', 'none', 'important');
    this.hostElement.style.setProperty('pointer-events', 'none', 'important');
    this.hostElement.style.setProperty('z-index', '2147483647', 'important');
    this.hostElement.style.setProperty('display', 'block', 'important');

    this.shadowRoot = this.hostElement.attachShadow({ mode: 'open' });

    const styleEl = document.createElement('style');
    styleEl.textContent = WARNING_STYLES;
    this.shadowRoot.appendChild(styleEl);

    const mount = () => {
      const parent = document.body || document.documentElement;
      if (parent && !parent.contains(this.hostElement)) {
        parent.appendChild(this.hostElement!);
      }
    };

    mount();

    if (!document.body && typeof document !== 'undefined') {
      window.addEventListener('DOMContentLoaded', mount, { once: true });
    }

    return this.shadowRoot;
  }

  public showScanning(): void {
    const shadow = this.ensureShadowRoot();

    const existingPill = shadow.querySelector('.verdict-floating-pill');
    if (existingPill) existingPill.remove();

    const pill = document.createElement('div');
    pill.className = 'verdict-floating-pill status-scanning';
    pill.setAttribute('role', 'status');
    pill.setAttribute('aria-live', 'polite');
    pill.style.setProperty('pointer-events', 'none', 'important');

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

  public showResult(
    decision: VerdictDecision,
    onTakeMeBack: () => void,
    onDismiss: () => void
  ): void {
    const shadow = this.ensureShadowRoot();

    if (decision.status === 'DANGER') {
      this.removeWarning();
      this.isolatePageDom();
      this.activateFirewallLock();
      const newShadow = this.ensureShadowRoot();

      if (this.hostElement) {
        this.hostElement.style.setProperty('width', '100%', 'important');
        this.hostElement.style.setProperty('height', '100%', 'important');
        this.hostElement.style.setProperty('inset', '0px', 'important');
        this.hostElement.style.setProperty('pointer-events', 'auto', 'important');
      }

      const backdrop = document.createElement('div');
      backdrop.className = 'verdict-danger-backdrop';
      backdrop.setAttribute('role', 'dialog');
      backdrop.setAttribute('aria-modal', 'true');
      backdrop.setAttribute('aria-label', decision.title || 'Security Warning');

      let hostDisplay = 'Suspicious Domain';
      try {
        if (typeof window !== 'undefined' && window.location) {
          hostDisplay = window.location.hostname || window.location.host || 'Protected Session';
        }
      } catch {
        // ignore
      }

      const defaultEvidence = [
        'Unverified merchant identity or counterfeit brand signature detected',
        'Unauthorized credential or payment transmission vector intercepted',
        'Zero-Trust isolation enforced: high threat confidence score',
      ];

      const reasonsList = decision.reasons && decision.reasons.length > 0
        ? decision.reasons.map((r) => `
            <div class="verdict-danger-reason-item">
              <span class="verdict-reason-bullet"></span>
              <span>${r.signal ? `<strong>${this.escapeHtml(r.signal.replace(/_/g, ' '))}: </strong>` : ''}${this.escapeHtml(r.evidence)}</span>
            </div>
          `).join('')
        : defaultEvidence.map((ev) => `
            <div class="verdict-danger-reason-item">
              <span class="verdict-reason-bullet"></span>
              <span>${this.escapeHtml(ev)}</span>
            </div>
          `).join('');

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

          <h1 class="verdict-danger-title">${this.escapeHtml(decision.title || t('warnings', 'dangerTitle'))}</h1>
          <p class="verdict-danger-desc">${this.escapeHtml(decision.message || t('warnings', 'dangerDefaultMessage'))}</p>

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
              <span>${t('warnings', 'takeMeBack')} (Recommended)</span>
            </button>
            <button class="verdict-btn verdict-btn-secondary" id="verdict-override-btn">
              <span>${t('warnings', 'understandRisk')}</span>
              ${ICONS.arrowRight}
            </button>
          </div>

          <div class="verdict-danger-footer">
            <span>🛡️ VERDICT protected and secured</span>
          </div>
        </div>
      `;

      const backBtn = backdrop.querySelector('#verdict-back-btn') as HTMLButtonElement | null;
      const overrideBtn = backdrop.querySelector('#verdict-override-btn') as HTMLButtonElement | null;

      if (backBtn) {
        backBtn.addEventListener('click', () => {
          this.releaseFirewallLock();
          onTakeMeBack();
        });
        setTimeout(() => backBtn.focus(), 50);
      }

      if (overrideBtn) {
        overrideBtn.addEventListener('click', () => {
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

    let pill = shadow.querySelector('.verdict-floating-pill') as HTMLElement | null;
    if (!pill) {
      pill = document.createElement('div');
      shadow.appendChild(pill);
    }
    pill.style.setProperty('pointer-events', 'none', 'important');

    if (decision.status === 'SAFE') {
      pill.className = 'verdict-floating-pill status-safe';
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
    } else if (decision.status === 'CAUTION') {
      pill.className = 'verdict-floating-pill status-caution';
      pill.innerHTML = `
        <div class="verdict-pill-icon caution" aria-hidden="true">
          ${ICONS.alertTriangle}
        </div>
        <div class="verdict-pill-text">
          <span class="verdict-pill-title">Caution</span>
          <span class="verdict-pill-subtitle">${this.escapeHtml(decision.message || t('warnings', 'cautionDefaultMessage'))}</span>
        </div>
        <button class="verdict-pill-close" aria-label="${t('warnings', 'dismiss')}" id="verdict-pill-close-btn">
          ${ICONS.close}
        </button>
      `;

      const closeBtn = pill.querySelector('#verdict-pill-close-btn');
      if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
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
          pill.classList.add('is-exiting');
          setTimeout(() => this.removeWarning(), 180);
        }
      }, 4000);
    }
  }

  public showPersistentUnsafePill(_decision?: VerdictDecision): void {
    if (this.autoDismissTimer) {
      clearTimeout(this.autoDismissTimer);
      this.autoDismissTimer = null;
    }

    const shadow = this.ensureShadowRoot();

    const existingPill = shadow.querySelector('.verdict-floating-pill');
    if (existingPill) existingPill.remove();

    const pill = document.createElement('div');
    pill.className = 'verdict-floating-pill status-danger';
    pill.setAttribute('role', 'status');
    pill.setAttribute('aria-live', 'assertive');
    pill.style.setProperty('pointer-events', 'none', 'important');

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

  public render(
    decision: VerdictDecision,
    onTakeMeBack: () => void,
    onDismiss: () => void
  ): void {
    this.showResult(decision, onTakeMeBack, onDismiss);
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
