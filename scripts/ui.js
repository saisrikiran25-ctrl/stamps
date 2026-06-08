/**
 * ui.js — DOM Rendering Helpers
 * Utility functions shared across views.
 */

import { rateColorClass } from './habits.js';

// ── SVG Icon Library ──────────────────────────────────────────────────────────

export const Icons = {
  /** 2×2 grid of squares — Dashboard icon */
  dashboard: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
    <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
    <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
    <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  /** 3 ascending bars — Analytics icon */
  analytics: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <rect x="1"  y="9"  width="3.5" height="6"  rx="1" stroke="currentColor" stroke-width="1.5"/>
    <rect x="6.25" y="5" width="3.5" height="10" rx="1" stroke="currentColor" stroke-width="1.5"/>
    <rect x="11.5" y="1" width="3.5" height="14" rx="1" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  /** Sliders — Manage icon */
  manage: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <line x1="2" y1="4"  x2="14" y2="4"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="2" y1="8"  x2="14" y2="8"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="5"  cy="4"  r="2" fill="var(--bg-surface)" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="10" cy="8"  r="2" fill="var(--bg-surface)" stroke="currentColor" stroke-width="1.5"/>
    <circle cx="6"  cy="12" r="2" fill="var(--bg-surface)" stroke="currentColor" stroke-width="1.5"/>
  </svg>`,

  /** Left arrow — back navigation */
  arrowLeft: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  /** Pencil — edit icon */
  edit: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M9.5 2.5l2 2L4 12H2v-2L9.5 2.5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  /** Trash — delete icon */
  trash: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.75 7.5h6.5L11 4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  /** Plus — add icon */
  plus: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path d="M7 2v10M2 7h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,

  /** Warning triangle */
  warning: `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M8 2L1.5 14h13L8 2z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M8 7v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
    <circle cx="8" cy="11.5" r="0.7" fill="currentColor"/>
  </svg>`,

  /** Drag handle (braille pattern) */
  drag: `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="5" cy="3.5" r="1" fill="currentColor" opacity="0.5"/>
    <circle cx="9" cy="3.5" r="1" fill="currentColor" opacity="0.5"/>
    <circle cx="5" cy="7"   r="1" fill="currentColor" opacity="0.5"/>
    <circle cx="9" cy="7"   r="1" fill="currentColor" opacity="0.5"/>
    <circle cx="5" cy="10.5" r="1" fill="currentColor" opacity="0.5"/>
    <circle cx="9" cy="10.5" r="1" fill="currentColor" opacity="0.5"/>
  </svg>`,

  /** Check mark */
  check: `<svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
};

// ── Mini Bar Renderer ─────────────────────────────────────────────────────────

/**
 * Render a 7-day mini bar.
 * @param {boolean[]} history  — array of 7 booleans [oldest…today]
 * @returns {string}  HTML string
 */
export function renderMiniBar(history) {
  return `<div class="mini-bar" aria-hidden="true">${
    history.map((done, i) => {
      const isToday = i === 6;
      let cls = 'mini-bar__day';
      if (done) {
        cls += ' mini-bar__day--done';
      } else if (isToday) {
        cls += ' mini-bar__day--today-pending';
      } else {
        cls += ' mini-bar__day--missed';
      }
      return `<div class="${cls}"></div>`;
    }).join('')
  }</div>`;
}

// ── Stats Formatting ──────────────────────────────────────────────────────────

/**
 * Format a 0–1 rate as a percentage string.
 * @param {number} rate
 * @returns {string}  e.g. "71%"
 */
export function fmtPct(rate) {
  return `${Math.round(rate * 100)}%`;
}

/**
 * Render a stat item with colorized value for the footer stats bar.
 * @param {string} label
 * @param {string} value
 * @param {string} colorClass
 * @returns {string}  HTML
 */
export function renderStatItem(label, value, colorClass) {
  return `<div class="stats-bar__item">
    <span>${label}</span>
    <span class="stats-bar__value ${colorClass}">${value}</span>
  </div>`;
}

// ── Toast Notifications ───────────────────────────────────────────────────────

let _toastTimer = null;

/**
 * Show a transient toast message.
 * @param {string} message
 * @param {number} duration  ms
 */
export function showToast(message, duration = 2200) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    document.body.appendChild(toast);
  }

  toast.textContent = message;

  if (_toastTimer) clearTimeout(_toastTimer);

  // Force reflow for re-trigger
  toast.classList.remove('toast--visible');
  void toast.offsetWidth;
  toast.classList.add('toast--visible');

  _toastTimer = setTimeout(() => {
    toast.classList.remove('toast--visible');
  }, duration);
}

// ── Page Transition ───────────────────────────────────────────────────────────

/**
 * Animate the #app container with a page entrance animation.
 * @param {HTMLElement} container
 */
export function animatePageEnter(container) {
  container.classList.remove('page-enter');
  // Trigger reflow so the animation fires again
  void container.offsetWidth;
  container.classList.add('page-enter');
}

// ── Staggered Card Animation ──────────────────────────────────────────────────

/**
 * Apply staggered entrance animation to a list of elements.
 * @param {NodeList|HTMLElement[]} elements
 * @param {number} delayStep  ms between each card
 */
export function staggerCards(elements, delayStep = 60) {
  elements.forEach((el, i) => {
    el.style.setProperty('--stagger-delay', `${i * delayStep}ms`);
    el.classList.add('card-cascade');
  });
}

// ── Done Toggle Animation ─────────────────────────────────────────────────────

/**
 * Fire the done-pulse animation on a button element.
 * @param {HTMLElement} btn
 */
export function pulseDoneBtn(btn) {
  btn.classList.remove('done-pulse');
  void btn.offsetWidth;
  btn.classList.add('done-pulse');
  btn.addEventListener('animationend', () => btn.classList.remove('done-pulse'), { once: true });
}

// ── Streak Flash ──────────────────────────────────────────────────────────────

/**
 * Flash a streak number element.
 * @param {HTMLElement} el
 */
export function flashStreak(el) {
  if (!el) return;
  el.classList.remove('streak-flash');
  void el.offsetWidth;
  el.classList.add('streak-flash');
  el.addEventListener('animationend', () => el.classList.remove('streak-flash'), { once: true });
}

// ── Escape HTML ───────────────────────────────────────────────────────────────

/**
 * Escape a string for safe HTML insertion.
 * @param {string} str
 * @returns {string}
 */
export function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Heatmap Tooltip ───────────────────────────────────────────────────────────

let _tooltip = null;

function getTooltip() {
  if (!_tooltip) {
    _tooltip = document.createElement('div');
    _tooltip.className = 'heatmap-tooltip';
    _tooltip.setAttribute('role', 'tooltip');
    document.body.appendChild(_tooltip);
  }
  return _tooltip;
}

export function showHeatmapTooltip(text, x, y) {
  const tip = getTooltip();
  tip.textContent = text;
  tip.style.left = `${x}px`;
  tip.style.top  = `${y}px`;
  tip.classList.add('visible');
}

export function hideHeatmapTooltip() {
  const tip = getTooltip();
  tip.classList.remove('visible');
}
