/**
 * views/dashboard.js — Dashboard View (The Hero Page)
 * Daily habit check-in: cards with toggle, streaks, mini bars, footer stats.
 */

import Store   from '../store.js';
import {
  getCurrentStreak,
  getBestStreak,
  getCompletionRate,
  get7DayHistory,
  getAllDone7Days,
  isAllDoneToday,
  countDoneToday,
  getOverallDailyScore,
  getTrackingDayNumber,
  formatDate,
  rateColorClass,
} from '../habits.js';
import {
  Icons,
  renderMiniBar,
  fmtPct,
  renderStatItem,
  staggerCards,
  pulseDoneBtn,
  flashStreak,
  esc,
  showToast,
} from '../ui.js';
import { navigate } from '../router.js';

// Timer ref for "all done" banner fade-out
let _allDoneTimer = null;

/**
 * Render the dashboard view.
 * @param {HTMLElement} container
 */
export function renderDashboard(container) {
  const habits = Store.getHabits();

  // No habits → redirect to onboarding
  if (habits.length === 0) {
    navigate('onboarding');
    return;
  }

  const data      = Store.load();
  const allEntries = data.entries || {};
  const today      = Store.getTodayStr();

  // Computed values
  const dayNumber  = getTrackingDayNumber(habits);
  const dateStr    = formatDate(today, 'long');
  const allDone7   = getAllDone7Days(habits, allEntries);
  const allDoneNow = isAllDoneToday(habits, allEntries);
  const doneCount  = countDoneToday(habits, allEntries);

  // Rates for footer
  const score7d  = getOverallDailyScore(habits, allEntries, 7);
  const score30d = getOverallDailyScore(habits, allEntries, 30);

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; height: 100%;">
      <!-- Dashboard Header Strip -->
      <header class="dash-header${allDoneNow ? ' dash-header--all-done' : ''}" id="dash-header" aria-label="Dashboard header">
        <div class="dash-header__left" aria-label="App name">MICRO</div>

        <div class="dash-header__center">
          <span class="dash-header__date">${esc(dateStr)}</span>
          <span class="dash-header__daycount" aria-label="Day ${dayNumber} of tracking">Day ${dayNumber}</span>
        </div>

        <div class="dash-header__right" aria-label="Last 7 days all-habits completion">
          ${allDone7.map((filled, i) => `
            <div
              class="streak-dot ${filled ? 'streak-dot--filled' : 'streak-dot--empty'}"
              aria-label="${filled ? 'All habits done' : 'Not all habits done'} ${7 - i} day${7 - i === 1 ? '' : 's'} ago"
            ></div>
          `).join('')}
        </div>
      </header>

      <!-- All-Done Celebration Banner -->
      <div
        class="all-done-banner${allDoneNow ? ' visible' : ''}"
        id="all-done-banner"
        aria-live="polite"
        aria-label="All habits complete for today"
      >All done for today.</div>

      <!-- Habit Cards — flex:1 so they fill the vertical space between header and footer -->
      <main
        id="habit-cards-container"
        aria-label="Your habits"
        style="flex: 1; display: flex; flex-direction: column; gap: var(--space-4); min-height: 0;"
      >
        ${habits.map(habit => _renderHabitCard(habit, allEntries, today)).join('')}
      </main>

      <!-- Footer Stats Bar -->
      <footer
        class="stats-bar"
        id="stats-bar"
        role="status"
        aria-label="Today's progress and averages"
        style="margin-top: var(--space-4); flex-shrink: 0;"
      >
        ${renderStatItem('today', `${doneCount}/${habits.length} done`, doneCount === habits.length ? 'color-good' : doneCount > 0 ? 'color-warn' : 'color-muted')}
        <span class="stats-bar__sep" aria-hidden="true">·</span>
        ${renderStatItem('7d avg', fmtPct(score7d), rateColorClass(score7d))}
        <span class="stats-bar__sep" aria-hidden="true">·</span>
        ${renderStatItem('30d avg', fmtPct(score30d), rateColorClass(score30d))}
      </footer>
    </div>
  `;

  // Stagger cards
  const cards = container.querySelectorAll('.habit-card');
  staggerCards(Array.from(cards));

  // Bind toggle buttons
  _bindToggles(container, habits, allEntries);

  // Manage all-done banner timer
  if (allDoneNow) {
    _startAllDoneTimer();
  }
}

// ── Internal: Habit Card HTML ─────────────────────────────────────────────────

function _renderHabitCard(habit, allEntries, today) {
  const entries  = allEntries[habit.id] || {};
  const done     = entries[today] === true;
  const streak   = getCurrentStreak(entries);
  const best     = getBestStreak(entries);
  const history  = get7DayHistory(entries);
  const miniBar  = renderMiniBar(history);

  const streakColor = streak > 0 ? 'color-warn' : 'color-muted';

  return `
    <article
      class="habit-card${done ? ' habit-card--done' : ''}"
      id="card-${esc(habit.id)}"
      data-habit-id="${esc(habit.id)}"
      aria-label="Habit: ${esc(habit.name)}${done ? ', completed today' : ', not yet done today'}"
    >
      <div class="habit-card__top">
        <div class="habit-card__name-area">
          <span
            class="habit-card__indicator ${done ? 'habit-card__indicator--done' : 'habit-card__indicator--pending'}"
            aria-hidden="true"
          >${done ? '✓' : '●'}</span>
          <span class="habit-card__name">${esc(habit.name)}</span>
        </div>

        <button
          class="done-btn${done ? ' done-btn--active' : ''}"
          id="done-btn-${esc(habit.id)}"
          data-habit-id="${esc(habit.id)}"
          aria-label="${done ? `Mark ${esc(habit.name)} as undone` : `Mark ${esc(habit.name)} as done`}"
          aria-pressed="${done}"
        >
          ${done ? `${Icons.check} DONE` : 'DONE'}
        </button>
      </div>

      <div class="habit-meta">
        <div class="habit-meta__item">
          <span>streak</span>
          <span
            class="habit-meta__value ${streakColor}"
            id="streak-val-${esc(habit.id)}"
            aria-label="${streak} day streak"
          >${streak}</span>
          <span>days</span>
        </div>
        <div class="habit-meta__item">
          <span>best</span>
          <span class="habit-meta__value color-primary" aria-label="Best streak ${best} days">${best}</span>
        </div>
        <div class="habit-meta__item" aria-label="Last 7 days history">
          ${miniBar}
        </div>
      </div>
    </article>
  `;
}

// ── Internal: Toggle Binding ──────────────────────────────────────────────────

function _bindToggles(container, habits, allEntries) {
  container.querySelectorAll('.done-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const habitId = btn.dataset.habitId;
      const today   = Store.getTodayStr();
      const wasDone = Store.isDone(habitId, today);

      // Toggle
      if (wasDone) {
        Store.markUndone(habitId, today);
      } else {
        Store.markDone(habitId, today);
      }

      // Animate button
      pulseDoneBtn(btn);

      // Re-render just this card to avoid full-page repaint
      _rerenderCard(habitId, container);

      // Re-render footer stats
      _rerenderFooter(container);

      // Re-render header (all-done dots + state)
      _rerenderHeader(container);
    });
  });
}

// ── Internal: Targeted Re-renders ─────────────────────────────────────────────

function _rerenderCard(habitId, container) {
  const cardEl = container.querySelector(`#card-${habitId}`);
  if (!cardEl) return;

  const habit    = Store.getHabits().find(h => h.id === habitId);
  if (!habit) return;

  const data      = Store.load();
  const allEntries = data.entries || {};
  const today      = Store.getTodayStr();
  const entries    = allEntries[habitId] || {};
  const done       = entries[today] === true;
  const streak     = getCurrentStreak(entries);
  const best       = getBestStreak(entries);
  const history    = get7DayHistory(entries);
  const miniBar    = renderMiniBar(history);
  const streakColor = streak > 0 ? 'color-warn' : 'color-muted';

  // Update card class
  cardEl.classList.toggle('habit-card--done', done);
  cardEl.setAttribute('aria-label', `Habit: ${habit.name}${done ? ', completed today' : ', not yet done today'}`);

  // Update indicator
  const indicator = cardEl.querySelector('.habit-card__indicator');
  if (indicator) {
    indicator.textContent = done ? '✓' : '●';
    indicator.className = `habit-card__indicator ${done ? 'habit-card__indicator--done' : 'habit-card__indicator--pending'}`;
  }

  // Update button
  const btn = cardEl.querySelector('.done-btn');
  if (btn) {
    btn.classList.toggle('done-btn--active', done);
    btn.setAttribute('aria-label', done ? `Mark ${habit.name} as undone` : `Mark ${habit.name} as done`);
    btn.setAttribute('aria-pressed', String(done));
    btn.innerHTML = done ? `${Icons.check} DONE` : 'DONE';
    pulseDoneBtn(btn);
  }

  // Flash streak if it changed
  const streakEl = cardEl.querySelector(`#streak-val-${habitId}`);
  if (streakEl) {
    const oldStreak = parseInt(streakEl.textContent, 10);
    streakEl.textContent = streak;
    streakEl.className = `habit-meta__value ${streakColor}`;
    streakEl.setAttribute('aria-label', `${streak} day streak`);
    if (streak !== oldStreak) flashStreak(streakEl);
  }

  // Update mini bar
  const miniBarContainer = cardEl.querySelector('.habit-meta .habit-meta__item:last-child');
  if (miniBarContainer) {
    miniBarContainer.innerHTML = miniBar;
  }

  // Update best
  const bestEls = cardEl.querySelectorAll('.habit-meta__value.color-primary');
  if (bestEls.length > 0) bestEls[0].textContent = best;
}

function _rerenderFooter(container) {
  const habits    = Store.getHabits();
  const data      = Store.load();
  const allEntries = data.entries || {};
  const doneCount  = countDoneToday(habits, allEntries);
  const score7d   = getOverallDailyScore(habits, allEntries, 7);
  const score30d  = getOverallDailyScore(habits, allEntries, 30);

  const bar = container.querySelector('#stats-bar');
  if (!bar) return;

  bar.innerHTML = `
    ${renderStatItem('today', `${doneCount}/${habits.length} done`, doneCount === habits.length ? 'color-good' : doneCount > 0 ? 'color-warn' : 'color-muted')}
    <span class="stats-bar__sep" aria-hidden="true">·</span>
    ${renderStatItem('7d avg', fmtPct(score7d), rateColorClass(score7d))}
    <span class="stats-bar__sep" aria-hidden="true">·</span>
    ${renderStatItem('30d avg', fmtPct(score30d), rateColorClass(score30d))}
  `;
}

function _rerenderHeader(container) {
  const habits     = Store.getHabits();
  const data       = Store.load();
  const allEntries  = data.entries || {};
  const allDoneNow = isAllDoneToday(habits, allEntries);
  const allDone7   = getAllDone7Days(habits, allEntries);

  const header = container.querySelector('#dash-header');
  const banner = container.querySelector('#all-done-banner');

  if (header) {
    header.classList.toggle('dash-header--all-done', allDoneNow);
  }

  if (banner) {
    if (allDoneNow) {
      banner.classList.add('visible');
      banner.classList.remove('fading');
      _startAllDoneTimer(banner);
    } else {
      banner.classList.remove('visible');
      if (_allDoneTimer) {
        clearTimeout(_allDoneTimer);
        _allDoneTimer = null;
      }
    }
  }

  // Update streak dots
  const dots = container.querySelectorAll('.streak-dot');
  allDone7.forEach((filled, i) => {
    if (dots[i]) {
      dots[i].className = `streak-dot ${filled ? 'streak-dot--filled' : 'streak-dot--empty'}`;
    }
  });
}

function _startAllDoneTimer(bannerEl) {
  if (_allDoneTimer) clearTimeout(_allDoneTimer);
  const banner = bannerEl || document.getElementById('all-done-banner');
  if (!banner) return;

  _allDoneTimer = setTimeout(() => {
    // Only fade if not hovered
    if (!banner.matches(':hover')) {
      banner.classList.add('fading');
      setTimeout(() => {
        banner.classList.remove('visible');
        banner.classList.remove('fading');
      }, 400);
    }
  }, 3000);

  // Cancel fade on hover
  banner.addEventListener('mouseenter', () => {
    if (_allDoneTimer) {
      clearTimeout(_allDoneTimer);
      _allDoneTimer = null;
    }
    banner.classList.remove('fading');
  }, { once: false });
}
