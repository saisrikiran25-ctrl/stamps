/**
 * nav.js — Navigation Component
 * Renders both desktop top nav and mobile bottom nav.
 */

import { Icons, esc } from './ui.js';

const NAV_LINKS = [
  { key: 'dashboard',  label: 'Dashboard', icon: Icons.dashboard },
  { key: 'analytics',  label: 'Analytics', icon: Icons.analytics  },
  { key: 'manage',     label: 'Manage',    icon: Icons.manage     },
];

/**
 * Render the desktop top nav and mobile bottom nav into their containers.
 */
export function renderNav() {
  const navEl       = document.getElementById('nav');
  const navMobileEl = document.getElementById('nav-mobile');

  if (navEl) {
    navEl.innerHTML = `
      <nav class="nav-inner" aria-label="Main navigation">
        <a href="#/dashboard" class="nav-logo" aria-label="Micro Habit Dashboard home">
          <span class="nav-logo-dot"></span>
          MICRO
        </a>
        <div class="nav-links" role="list">
          ${NAV_LINKS.map(l => `
            <a
              href="#/${l.key}"
              class="nav-link"
              data-route="${esc(l.key)}"
              role="listitem"
              aria-label="${esc(l.label)}"
            >
              ${l.icon}
              ${esc(l.label)}
            </a>
          `).join('')}
        </div>
      </nav>
    `;
  }

  if (navMobileEl) {
    navMobileEl.innerHTML = `
      <nav class="nav-mobile-inner" aria-label="Main navigation">
        ${NAV_LINKS.map(l => `
          <a
            href="#/${l.key}"
            class="nav-mobile-link"
            data-route="${esc(l.key)}"
            aria-label="${esc(l.label)}"
          >
            ${l.icon}
            <span>${esc(l.label)}</span>
          </a>
        `).join('')}
      </nav>
    `;
  }
}

/**
 * Update the active state on nav links.
 * @param {string} activeKey  — route key
 */
export function updateNavActive(activeKey) {
  const allLinks = document.querySelectorAll('[data-route]');
  allLinks.forEach(link => {
    const isActive = link.dataset.route === activeKey;
    link.classList.toggle('active', isActive);
    link.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}
