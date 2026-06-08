/**
 * router.js — Hash-based SPA Router
 * Manages view transitions and navigation state.
 */

import { renderNav, updateNavActive } from './nav.js';

// Views are registered after import (see index.html module script)
const _routes = {};
let _currentHash = null;
let _appEl = null;

/**
 * Register a route handler.
 * @param {string}   hash     — route key e.g. 'dashboard', 'analytics', ''
 * @param {Function} handler  — (container: HTMLElement) => void
 */
export function registerRoute(hash, handler) {
  _routes[hash] = handler;
}

/**
 * Navigate to a given hash route.
 * Updates window.location.hash and renders the view.
 * @param {string} hash  — e.g. 'dashboard', 'analytics', 'onboarding'
 */
export function navigate(hash) {
  window.location.hash = `#/${hash}`;
}

/**
 * Resolve the current hash to a route key.
 * @returns {string}
 */
function resolveHash() {
  const raw = window.location.hash;
  // Strip leading '#/' or '#'
  return raw.replace(/^#\/?/, '') || '';
}

/**
 * Render the view matching the current hash.
 * Performs a fade-out/fade-in transition.
 */
async function render() {
  const hash = resolveHash();
  if (!_appEl) return;

  // Determine which view to render
  const key = _routes[hash] ? hash : '';
  const handler = _routes[key] || _routes['dashboard'];

  if (!handler) return;

  // Show/hide nav depending on view
  const isOnboarding = key === 'onboarding';
  const navEl        = document.getElementById('nav');
  const navMobileEl  = document.getElementById('nav-mobile');
  if (navEl)       navEl.style.display        = isOnboarding ? 'none' : '';
  if (navMobileEl) navMobileEl.style.display   = isOnboarding ? 'none' : '';

  // Fade out
  _appEl.style.transition = 'opacity 150ms ease, transform 150ms ease';
  _appEl.style.opacity    = '0';
  _appEl.style.transform  = 'translateY(-4px)';

  await new Promise(r => setTimeout(r, 150));

  // Render new view
  handler(_appEl);

  // Update active nav link
  updateNavActive(key || 'dashboard');

  // Fade in
  _appEl.style.transition = 'opacity 200ms ease, transform 200ms ease';
  _appEl.style.opacity    = '0';
  _appEl.style.transform  = 'translateY(6px)';

  // Force reflow
  void _appEl.offsetWidth;

  _appEl.style.opacity   = '1';
  _appEl.style.transform = 'translateY(0)';

  _currentHash = hash;
}

/**
 * Initialize the router.
 * @param {HTMLElement} appContainer  — the #app div
 */
export function initRouter(appContainer) {
  _appEl = appContainer;

  // Render nav
  renderNav();

  // Handle browser back/forward
  window.addEventListener('hashchange', render);

  // Initial render
  render();
}
