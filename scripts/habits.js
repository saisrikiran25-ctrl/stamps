/**
 * habits.js — Business Logic
 * Pure calculation functions. No side effects, no DOM access, no storage writes.
 * All functions operate on plain data objects passed in as arguments.
 */

// ── Date Helpers ─────────────────────────────────────────────────────────────

/**
 * Given a "YYYY-MM-DD" string, return a new string n days before it.
 * Uses Date arithmetic in local time.
 * @param {string} dateStr
 * @param {number} n
 * @returns {string}
 */
export function subtractDays(dateStr, n) {
  // Parse as local date (no timezone offset confusion)
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - n);
  return date.toLocaleDateString('en-CA');
}

/**
 * Add n days to a YYYY-MM-DD date string.
 * @param {string} dateStr
 * @param {number} n
 * @returns {string}
 */
export function addDays(dateStr, n) {
  return subtractDays(dateStr, -n);
}

/**
 * Return today's date as a YYYY-MM-DD string (local time).
 * @returns {string}
 */
export function getTodayStr() {
  return new Date().toLocaleDateString('en-CA');
}

/**
 * Format a YYYY-MM-DD string to a display-friendly string.
 * e.g. "Monday, June 8" for the dashboard header.
 * @param {string} dateStr
 * @param {'long'|'short'} format
 * @returns {string}
 */
export function formatDate(dateStr, format = 'long') {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);

  if (format === 'short') {
    // "Jun 8"
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  // "Monday, June 8"
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Return the number of days between two YYYY-MM-DD strings (inclusive of start, exclusive of end).
 * @param {string} fromStr
 * @param {string} toStr
 * @returns {number}
 */
export function daysBetween(fromStr, toStr) {
  const [fy, fm, fd] = fromStr.split('-').map(Number);
  const [ty, tm, td] = toStr.split('-').map(Number);
  const from = new Date(fy, fm - 1, fd);
  const to   = new Date(ty, tm - 1, td);
  return Math.round((to - from) / (1000 * 60 * 60 * 24));
}

// ── Streak Calculations ───────────────────────────────────────────────────────

/**
 * Calculate the current streak for a habit.
 *
 * Algorithm:
 *   - If today is done, count backwards from today.
 *   - If today is NOT done, start counting from yesterday (don't penalize
 *     for not having checked in yet today).
 *
 * @param {Object} entries  — { "YYYY-MM-DD": true, ... }
 * @returns {number}
 */
export function getCurrentStreak(entries) {
  const today = getTodayStr();
  const todayDone = entries[today] === true;

  let cursor = todayDone ? today : subtractDays(today, 1);
  let streak = 0;

  // Walk backwards while days are marked done
  while (entries[cursor] === true) {
    streak++;
    cursor = subtractDays(cursor, 1);
  }

  return streak;
}

/**
 * Calculate the all-time best streak for a habit.
 *
 * Algorithm:
 *   Collect all done-dates, sort chronologically, walk through in order
 *   detecting consecutive runs. Track max.
 *
 * @param {Object} entries  — { "YYYY-MM-DD": true, ... }
 * @returns {number}
 */
export function getBestStreak(entries) {
  const doneDates = Object.keys(entries)
    .filter(d => entries[d] === true)
    .sort(); // ISO date strings sort lexicographically = chronologically

  if (doneDates.length === 0) return 0;

  let best = 1;
  let run  = 1;

  for (let i = 1; i < doneDates.length; i++) {
    const diff = daysBetween(doneDates[i - 1], doneDates[i]);
    if (diff === 1) {
      run++;
      if (run > best) best = run;
    } else {
      run = 1;
    }
  }

  return best;
}

/**
 * Calculate completion rate over the last N days.
 * Only counts days on or after the habit's createdAt date.
 *
 * @param {Object} entries      — { "YYYY-MM-DD": true, ... }
 * @param {number} lastNDays
 * @param {string} [createdAt]  — YYYY-MM-DD; if provided, skip days before this
 * @returns {{ done: number, total: number, rate: number }}
 */
export function getCompletionRate(entries, lastNDays, createdAt) {
  const today = getTodayStr();
  let done  = 0;
  let total = 0;

  for (let i = 0; i < lastNDays; i++) {
    const d = subtractDays(today, i);
    // Don't count days before the habit was created
    if (createdAt && d < createdAt) continue;
    total++;
    if (entries[d] === true) done++;
  }

  return {
    done,
    total,
    rate: total === 0 ? 0 : done / total,
  };
}

/**
 * Return the number of calendar days since a habit was created (inclusive today).
 * @param {{ createdAt: string }} habit
 * @returns {number}
 */
export function getDaysSinceStart(habit) {
  return daysBetween(habit.createdAt, getTodayStr()) + 1;
}

/**
 * Calculate the overall daily completion score across ALL habits
 * for the last N days.
 *
 * For each day: (habits done that day) / (habits that existed that day).
 * Average those fractions.
 *
 * @param {Array}  habits    — habit objects with { id, createdAt }
 * @param {Object} allEntries — { [habitId]: { "YYYY-MM-DD": true } }
 * @param {number} lastNDays
 * @returns {number}  0–1 float
 */
export function getOverallDailyScore(habits, allEntries, lastNDays) {
  if (habits.length === 0) return 0;

  const today = getTodayStr();
  let sumRates = 0;
  let validDays = 0;

  for (let i = 0; i < lastNDays; i++) {
    const d = subtractDays(today, i);

    // Habits that existed on this day
    const activeHabits = habits.filter(h => h.createdAt <= d);
    if (activeHabits.length === 0) continue;

    const doneCount = activeHabits.filter(h => {
      const entries = allEntries[h.id] || {};
      return entries[d] === true;
    }).length;

    sumRates += doneCount / activeHabits.length;
    validDays++;
  }

  return validDays === 0 ? 0 : sumRates / validDays;
}

/**
 * Return an array of 7 booleans for the last 7 days.
 * Index 0 = 6 days ago, index 6 = today.
 *
 * @param {Object} entries
 * @returns {boolean[]}
 */
export function get7DayHistory(entries) {
  const today = getTodayStr();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = subtractDays(today, i);
    result.push(entries[d] === true);
  }
  return result; // [oldest, ..., today]
}

/**
 * Return an array of 28 day records for the dot calendar.
 * Each record: { date: string, done: boolean, isAfterToday: boolean, isBeforeCreated: boolean }
 *
 * @param {Object} entries
 * @param {string} createdAt  — YYYY-MM-DD
 * @returns {Array}
 */
export function get28DayCalendar(entries, createdAt) {
  const today = getTodayStr();
  const result = [];
  for (let i = 27; i >= 0; i--) {
    const d = subtractDays(today, i);
    result.push({
      date: d,
      done: entries[d] === true,
      isAfterToday: d > today,
      isBeforeCreated: d < createdAt,
    });
  }
  return result;
}

/**
 * For the consistency heatmap: return last 30 days with per-day "how many habits done".
 *
 * @param {Array}  habits
 * @param {Object} allEntries
 * @returns {Array<{ date: string, done: number, total: number }>}
 */
export function getHeatmapData(habits, allEntries) {
  const today = getTodayStr();
  const result = [];

  for (let i = 29; i >= 0; i--) {
    const d = subtractDays(today, i);
    const activeHabits = habits.filter(h => h.createdAt <= d);
    const doneCount = activeHabits.filter(h => {
      const entries = allEntries[h.id] || {};
      return entries[d] === true;
    }).length;

    result.push({
      date: d,
      done: doneCount,
      total: activeHabits.length,
    });
  }

  return result;
}

/**
 * Color-code a 0–1 rate to a CSS class.
 * @param {number} rate  0–1
 * @returns {string}  'color-good' | 'color-warn' | 'color-danger' | 'color-muted'
 */
export function rateColorClass(rate) {
  if (rate >= 0.8) return 'color-good';
  if (rate >= 0.5) return 'color-warn';
  if (rate  > 0)   return 'color-danger';
  return 'color-muted';
}

/**
 * Return whether ALL habits are done today.
 * @param {Array}  habits
 * @param {Object} allEntries
 * @returns {boolean}
 */
export function isAllDoneToday(habits, allEntries) {
  if (habits.length === 0) return false;
  const today = getTodayStr();
  return habits.every(h => {
    const entries = allEntries[h.id] || {};
    return entries[today] === true;
  });
}

/**
 * Count how many habits are done today.
 * @param {Array}  habits
 * @param {Object} allEntries
 * @returns {number}
 */
export function countDoneToday(habits, allEntries) {
  const today = getTodayStr();
  return habits.filter(h => {
    const entries = allEntries[h.id] || {};
    return entries[today] === true;
  }).length;
}

/**
 * Return last-7-days booleans representing days where ALL habits were completed.
 * Used for the header streak dots.
 *
 * @param {Array}  habits
 * @param {Object} allEntries
 * @returns {boolean[]}  length 7, index 0 = 6 days ago, index 6 = today
 */
export function getAllDone7Days(habits, allEntries) {
  const today = getTodayStr();
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const d = subtractDays(today, i);
    const activeHabits = habits.filter(h => h.createdAt <= d);
    if (activeHabits.length === 0) {
      result.push(false);
      continue;
    }
    const allDone = activeHabits.every(h => {
      const entries = allEntries[h.id] || {};
      return entries[d] === true;
    });
    result.push(allDone);
  }

  return result;
}

/**
 * Return the overall tracking day count since the earliest habit's createdAt.
 * @param {Array} habits
 * @returns {number}
 */
export function getTrackingDayNumber(habits) {
  if (habits.length === 0) return 0;
  const earliest = habits.reduce((min, h) =>
    h.createdAt < min ? h.createdAt : min,
    habits[0].createdAt
  );
  return daysBetween(earliest, getTodayStr()) + 1;
}
