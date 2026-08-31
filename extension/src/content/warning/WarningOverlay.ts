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
  shieldAlert: `
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
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

  public removeWarning(): void {
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

      const pillCenterX = rect.left + rect.width / 2;
      const pillCenterY = rect.top + rect.height / 2;
      const dist = Math.hypot(e.clientX - pillCenterX, e.clientY - pillCenterY);

      // If mouse is within 80px radius of the pill, ghost it away completely
      if (dist < 80) {
        pill.classList.add('is-evading');
      } else {
        pill.classList.remove('is-evading');
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

      backdrop.innerHTML = `
        <div class="verdict-danger-card">
          <div class="verdict-danger-icon" aria-hidden="true">
            ${ICONS.shieldAlert}
          </div>
          <h1 class="verdict-danger-title">${this.escapeHtml(decision.title || t('warnings', 'dangerTitle'))}</h1>
          <p class="verdict-danger-desc">${this.escapeHtml(decision.message || t('warnings', 'dangerDefaultMessage'))}</p>
          <div class="verdict-danger-actions">
            <button class="verdict-btn verdict-btn-primary" id="verdict-back-btn">
              ${t('warnings', 'takeMeBack')}
            </button>
            <button class="verdict-btn verdict-btn-secondary" id="verdict-override-btn">
              ${t('warnings', 'understandRisk')}
            </button>
          </div>
        </div>
      `;

      const backBtn = backdrop.querySelector('#verdict-back-btn') as HTMLButtonElement | null;
      const overrideBtn = backdrop.querySelector('#verdict-override-btn') as HTMLButtonElement | null;

      if (backBtn) {
        backBtn.addEventListener('click', () => onTakeMeBack());
        setTimeout(() => backBtn.focus(), 50);
      }

      if (overrideBtn) {
        overrideBtn.addEventListener('click', () => {
          this.removeWarning();
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
