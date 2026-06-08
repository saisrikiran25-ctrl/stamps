/**
 * views/analytics.js — Analytics View
 * Deeper stats: overall scores, per-habit breakdown, 28-day dot calendar,
 * and 30-day consistency heatmap.
 */

import Store   from '../store.js';
import {
  getCurrentStreak,
  getBestStreak,
  getCompletionRate,
  get28DayCalendar,
  getHeatmapData,
  getOverallDailyScore,
  getDaysSinceStart,
  formatDate,
  rateColorClass,
} from '../habits.js';
import {
  Icons,
  fmtPct,
  esc,
  showHeatmapTooltip,
  hideHeatmapTooltip,
  staggerCards,
} from '../ui.js';

/**
 * Render the analytics view.
 * @param {HTMLElement} container
 */
export function renderAnalytics(container) {
  const habits     = Store.getHabits();
  const data       = Store.load();
  const allEntries  = data.entries || {};
  const today       = Store.getTodayStr();

  // No habits — redirect notice
  if (habits.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p class="empty-state__text">No habits yet.</p>
        <a href="#/onboarding" class="btn-primary">Set up habits</a>
      </div>
    `;
    return;
  }

  const score7d  = getOverallDailyScore(habits, allEntries, 7);
  const score30d = getOverallDailyScore(habits, allEntries, 30);

  // Total tracking days (all-time)
  const meta        = data.meta || {};
  const firstDate   = meta.firstOpenDate || habits[0]?.createdAt || today;
  const [fy, fm, fd] = firstDate.split('-').map(Number);
  const [ty, tm, td] = today.split('-').map(Number);
  const totalDays   = Math.round(
    (new Date(ty, tm - 1, td) - new Date(fy, fm - 1, fd)) / (1000 * 60 * 60 * 24)
  ) + 1;

  // Heatmap data
  const heatmapData = getHeatmapData(habits, allEntries);

  container.innerHTML = `
    <!-- Page header -->
    <header class="page-header" aria-label="Analytics page header">
      <button class="page-header__back" id="analytics-back" aria-label="Back to Dashboard">
        ${Icons.arrowLeft} Dashboard
      </button>
      <span class="page-header__title">Analytics</span>
      <span class="page-header__right">${esc(formatDate(today, 'short'))}</span>
    </header>

    <!-- Overall stat pills -->
    <section aria-label="Overall statistics">
      <div class="section-label">Overall Stats</div>
      <div class="stat-pills-row">
        ${_renderStatPill('7d Score', fmtPct(score7d), rateColorClass(score7d), _subScore(habits, allEntries, 7))}
        ${_renderStatPill('30d Score', fmtPct(score30d), rateColorClass(score30d), _subScore(habits, allEntries, 30))}
        ${_renderStatPill('Days Tracked', String(totalDays), totalDays >= 7 ? 'color-good' : 'color-warn', 'all time')}
      </div>
    </section>

    <!-- Per-habit breakdown -->
    <section aria-label="Per-habit breakdown">
      <div class="section-label">Per-Habit Breakdown</div>
      ${habits.map(h => _renderHabitBreakdown(h, allEntries)).join('')}
    </section>

    <!-- Consistency heatmap -->
    <section class="heatmap-section" aria-label="30-day consistency heatmap">
      <div class="section-label" style="margin-bottom: var(--space-3);">Consistency — Last 30 Days</div>
      <div class="heatmap" id="heatmap" role="img" aria-label="30 day heatmap showing habits completed each day">
        ${heatmapData.map(day => {
          const level = Math.min(day.done, 3);
          const label = `${formatDate(day.date, 'short')} · ${day.done}/${day.total} habit${day.total !== 1 ? 's' : ''} done`;
          return `<div
            class="heatmap__cell heatmap__cell--${level}"
            data-label="${esc(label)}"
            role="gridcell"
            aria-label="${esc(label)}"
            tabindex="0"
          ></div>`;
        }).join('')}
      </div>

      <div class="heatmap-legend" aria-label="Heatmap color legend">
        <span class="heatmap-legend__swatch" style="background: var(--bg-border);" aria-hidden="true"></span> 0 habits
        <span class="heatmap-legend__swatch" style="background: rgba(45, 212, 191, 0.35);" aria-hidden="true"></span> 1
        <span class="heatmap-legend__swatch" style="background: rgba(45, 212, 191, 0.65);" aria-hidden="true"></span> 2
        <span class="heatmap-legend__swatch" style="background: var(--accent-primary);" aria-hidden="true"></span> All done
      </div>
    </section>
  `;

  _bindAnalytics(container);

  // Stagger breakdown cards
  const cards = container.querySelectorAll('.habit-breakdown-card');
  staggerCards(Array.from(cards), 80);
}

// ── Internal Renderers ────────────────────────────────────────────────────────

function _renderStatPill(label, value, colorClass, sub) {
  return `
    <div class="stat-pill" role="region" aria-label="${esc(label)}: ${esc(value)}">
      <div class="stat-pill__number ${colorClass}">${esc(value)}</div>
      <div class="stat-pill__label">${esc(label)}</div>
      ${sub ? `<div class="stat-pill__sub">${esc(sub)}</div>` : ''}
    </div>
  `;
}

function _subScore(habits, allEntries, n) {
  // e.g. "6/7 avg" for 7d
  const today = Store.getTodayStr();
  let totalDone = 0, totalPossible = 0;
  const { subtractDays } = { subtractDays: (d, n) => {
    const [y, m, day] = d.split('-').map(Number);
    const dt = new Date(y, m - 1, day);
    dt.setDate(dt.getDate() - n);
    return dt.toLocaleDateString('en-CA');
  }};

  for (let i = 0; i < n; i++) {
    const d = (() => {
      const [y, m, day] = today.split('-').map(Number);
      const dt = new Date(y, m - 1, day);
      dt.setDate(dt.getDate() - i);
      return dt.toLocaleDateString('en-CA');
    })();
    const active = habits.filter(h => h.createdAt <= d);
    if (active.length === 0) continue;
    totalPossible += active.length;
    active.forEach(h => {
      if ((allEntries[h.id] || {})[d] === true) totalDone++;
    });
  }
  return `${totalDone}/${totalPossible} days`;
}

function _renderHabitBreakdown(habit, allEntries) {
  const entries  = allEntries[habit.id] || {};
  const streak   = getCurrentStreak(entries);
  const best     = getBestStreak(entries);
  const r7       = getCompletionRate(entries, 7, habit.createdAt);
  const r30      = getCompletionRate(entries, 30, habit.createdAt);
  const cal28    = get28DayCalendar(entries, habit.createdAt);

  const streakColor = streak > 0 ? 'color-warn' : 'color-muted';
  const bestColor   = best   > 0 ? 'color-primary' : 'color-muted';

  return `
    <article class="habit-breakdown-card card-cascade" aria-label="Breakdown for ${esc(habit.name)}">
      <div class="habit-breakdown-card__name">${esc(habit.name)}</div>

      <div class="habit-breakdown-card__streaks">
        <div class="habit-breakdown-card__streak-item">
          <span class="habit-breakdown-card__streak-label">current streak</span>
          <span class="habit-breakdown-card__streak-val ${streakColor}" aria-label="${streak} day current streak">${streak}</span>
        </div>
        <div class="habit-breakdown-card__streak-item">
          <span class="habit-breakdown-card__streak-label">best streak</span>
          <span class="habit-breakdown-card__streak-val ${bestColor}" aria-label="${best} day best streak">${best}</span>
        </div>
      </div>

      <div class="habit-breakdown-card__rates">
        <div class="habit-rate-item">
          <span>7d</span>
          <strong class="${rateColorClass(r7.rate)}" aria-label="${fmtPct(r7.rate)} in last 7 days">${fmtPct(r7.rate)}</strong>
        </div>
        <div class="habit-rate-item">
          <span>30d</span>
          <strong class="${rateColorClass(r30.rate)}" aria-label="${fmtPct(r30.rate)} in last 30 days">${fmtPct(r30.rate)}</strong>
        </div>
      </div>

      <!-- 28-day dot calendar -->
      <div aria-label="28 day calendar grid">
        <div class="dot-grid" role="grid" aria-label="28-day history for ${esc(habit.name)}">
          ${cal28.map(day => {
            let cls = 'dot-grid__cell';
            let label = '';
            if (day.isBeforeCreated) {
              cls += ' dot-grid__cell--future';
              label = `${formatDate(day.date, 'short')} — before habit started`;
            } else if (day.done) {
              cls += ' dot-grid__cell--done';
              label = `${formatDate(day.date, 'short')} — done`;
            } else if (day.isAfterToday) {
              cls += ' dot-grid__cell--future';
              label = `${formatDate(day.date, 'short')} — future`;
            } else {
              cls += ' dot-grid__cell--missed';
              label = `${formatDate(day.date, 'short')} — missed`;
            }
            return `<div class="${cls}" role="gridcell" aria-label="${esc(label)}" title="${esc(label)}"></div>`;
          }).join('')}
        </div>
      </div>
    </article>
  `;
}

// ── Binding ───────────────────────────────────────────────────────────────────

function _bindAnalytics(container) {
  // Back button
  const backBtn = container.querySelector('#analytics-back');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.hash = '#/dashboard';
    });
  }

  // Heatmap tooltips
  const heatmap = container.querySelector('#heatmap');
  if (heatmap) {
    heatmap.addEventListener('mouseover', e => {
      const cell = e.target.closest('.heatmap__cell');
      if (!cell) return;
      const rect = cell.getBoundingClientRect();
      showHeatmapTooltip(
        cell.dataset.label || '',
        rect.left + rect.width / 2,
        rect.top - 8,
      );
    });

    heatmap.addEventListener('mouseout', e => {
      if (!e.relatedTarget?.closest('.heatmap__cell')) {
        hideHeatmapTooltip();
      }
    });

    // Keyboard accessibility for heatmap cells
    heatmap.querySelectorAll('.heatmap__cell').forEach(cell => {
      cell.addEventListener('focus', () => {
        const rect = cell.getBoundingClientRect();
        showHeatmapTooltip(cell.dataset.label || '', rect.left + rect.width / 2, rect.top - 8);
      });
      cell.addEventListener('blur', hideHeatmapTooltip);
    });
  }
}
