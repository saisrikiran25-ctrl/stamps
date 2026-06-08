/**
 * views/onboarding.js — Onboarding View
 * First-time setup: create 1–3 habits, then redirect to dashboard.
 */

import Store   from '../store.js';
import { esc, showToast } from '../ui.js';
import { navigate } from '../router.js';

/**
 * Render the onboarding page into `container`.
 * @param {HTMLElement} container
 */
export function renderOnboarding(container) {
  const habits = Store.getHabits();

  // If habits already exist, show redirect notice
  if (habits.length > 0) {
    container.innerHTML = `
      <div class="onboarding-redirect">
        <div class="onboarding-logo">
          <span class="onboarding-logo__dot"></span>
          MICRO
        </div>
        <p style="color: var(--text-secondary); font-size: 0.933rem; max-width: 320px;">
          You already have habits set up.
        </p>
        <a href="#/dashboard" class="btn-primary">
          Back to Dashboard
        </a>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="onboarding-wrap">
      <div class="onboarding-logo">
        <span class="onboarding-logo__dot"></span>
        MICRO
      </div>

      <h1 class="onboarding-headline">
        What three things<br>will you do today?
      </h1>

      <form class="onboarding-form" id="onboarding-form" novalidate>
        ${[1, 2, 3].map(n => `
          <div class="onboarding-habit-group" id="habit-group-${n}" style="transition-delay: ${(n - 1) * 80}ms">
            <div class="onboarding-num">Habit ${n}${n === 1 ? ' — required' : ' — optional'}</div>
            <input
              type="text"
              class="input-field"
              id="habit-input-${n}"
              name="habit${n}"
              placeholder="${_placeholder(n)}"
              maxlength="40"
              autocomplete="off"
              spellcheck="false"
              ${n === 1 ? 'required aria-required="true"' : ''}
            />
            <div class="input-error-msg" id="habit-error-${n}" role="alert"></div>
          </div>
        `).join('')}

        <p class="onboarding-hint">
          Only habit 1 is required. You can always add more later.
        </p>

        <button
          type="submit"
          class="btn-primary onboarding-cta btn-disabled"
          id="onboarding-submit"
          aria-label="Start tracking your habits"
        >
          Start Tracking →
        </button>
      </form>
    </div>
  `;

  _bindOnboarding();
}

function _placeholder(n) {
  const examples = [
    'e.g. Walk 5k steps',
    'e.g. Read for 20 min',
    'e.g. No social media',
  ];
  return examples[n - 1] || '';
}

function _bindOnboarding() {
  const form   = document.getElementById('onboarding-form');
  const input1 = document.getElementById('habit-input-1');
  const submit = document.getElementById('onboarding-submit');

  // Stagger group animations in
  requestAnimationFrame(() => {
    [1, 2, 3].forEach(n => {
      const group = document.getElementById(`habit-group-${n}`);
      if (group) {
        setTimeout(() => group.classList.add('visible'), (n - 1) * 90);
      }
    });
  });

  // Enable/disable submit based on habit 1 value
  function updateSubmitState() {
    const val = input1.value.trim();
    if (val.length > 0) {
      submit.classList.remove('btn-disabled');
      submit.removeAttribute('aria-disabled');
    } else {
      submit.classList.add('btn-disabled');
      submit.setAttribute('aria-disabled', 'true');
    }
  }

  input1.addEventListener('input', updateSubmitState);

  // Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const names = [1, 2, 3]
      .map(n => document.getElementById(`habit-input-${n}`).value.trim())
      .filter(v => v.length > 0);

    // Validate
    let hasError = false;
    const name1 = document.getElementById('habit-input-1').value.trim();
    if (!name1) {
      _showError(1, "Habit name can't be empty.");
      hasError = true;
    }

    // Check for duplicate names (case-insensitive)
    const lowerNames = names.map(n => n.toLowerCase());
    const seen = new Set();
    names.forEach((name, idx) => {
      const lower = name.toLowerCase();
      if (seen.has(lower)) {
        _showError(idx + 1, 'You already have a habit by this name.');
        hasError = true;
      }
      seen.add(lower);
    });

    if (hasError) {
      // Shake the form
      form.classList.add('input-shake');
      form.addEventListener('animationend', () => form.classList.remove('input-shake'), { once: true });
      return;
    }

    // Create habits in order
    names.forEach(name => Store.addHabit(name));

    showToast('Habits created. Let\'s go.');

    // Navigate to dashboard
    navigate('dashboard');
  });

  // Clear errors on input
  [1, 2, 3].forEach(n => {
    const input = document.getElementById(`habit-input-${n}`);
    if (input) {
      input.addEventListener('input', () => _clearError(n));
    }
  });
}

function _showError(n, msg) {
  const errEl  = document.getElementById(`habit-error-${n}`);
  const inputEl = document.getElementById(`habit-input-${n}`);
  if (errEl)  { errEl.textContent = msg; errEl.classList.add('visible'); }
  if (inputEl) inputEl.classList.add('input-error');
}

function _clearError(n) {
  const errEl  = document.getElementById(`habit-error-${n}`);
  const inputEl = document.getElementById(`habit-input-${n}`);
  if (errEl)  { errEl.textContent = ''; errEl.classList.remove('visible'); }
  if (inputEl) inputEl.classList.remove('input-error');
}
