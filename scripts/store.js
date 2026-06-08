/**
 * store.js — localStorage Data Layer
 * All reads/writes to localStorage go through this module.
 * Pure functions; no DOM interaction.
 */

const STORAGE_KEY = 'microhabit_data';

const Store = (() => {
  // ── Internal helpers ─────────────────────────────────────────

  /** Return an empty data scaffold. */
  function _defaultData() {
    return {
      habits: [],
      entries: {},
      meta: {
        firstOpenDate: _todayStr(),
        version: 1,
      },
    };
  }

  /** Generate a local-time YYYY-MM-DD string for a Date object. */
  function _fmt(date) {
    // en-CA locale gives YYYY-MM-DD format reliably.
    return date.toLocaleDateString('en-CA');
  }

  /** Today's date string in local time. */
  function _todayStr() {
    return _fmt(new Date());
  }

  /** Generate a UUID v4 using the Web Crypto API. */
  function _uuid() {
    return crypto.randomUUID();
  }

  // ── Public API ───────────────────────────────────────────────

  /**
   * Load and return the full data object from localStorage.
   * If missing or corrupt, returns (and persists) a fresh default.
   */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const data = _defaultData();
        save(data);
        return data;
      }
      return JSON.parse(raw);
    } catch (err) {
      console.warn('[Store] localStorage parse failed, reinitializing.', err);
      const data = _defaultData();
      save(data);
      return data;
    }
  }

  /**
   * Persist the full data object to localStorage.
   * @param {Object} data
   */
  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.warn('[Store] localStorage write failed.', err);
    }
  }

  /**
   * Return the habits array sorted by `order`.
   * @returns {Array}
   */
  function getHabits() {
    const data = load();
    return [...data.habits].sort((a, b) => a.order - b.order);
  }

  /**
   * Create and persist a new habit.
   * @param {string} name
   * @returns {Object} The new habit object.
   */
  function addHabit(name) {
    const data = load();
    const trimmed = name.trim();
    const habit = {
      id: _uuid(),
      name: trimmed,
      createdAt: _todayStr(),
      order: data.habits.length,
    };
    data.habits.push(habit);
    data.entries[habit.id] = {};
    save(data);
    return habit;
  }

  /**
   * Update an existing habit's name.
   * @param {string} id
   * @param {string} name
   */
  function updateHabit(id, name) {
    const data = load();
    const habit = data.habits.find(h => h.id === id);
    if (habit) {
      habit.name = name.trim();
      save(data);
    }
  }

  /**
   * Delete a habit and all its entries.
   * @param {string} id
   */
  function deleteHabit(id) {
    const data = load();
    data.habits = data.habits.filter(h => h.id !== id);
    delete data.entries[id];
    // Re-normalize order values
    data.habits.sort((a, b) => a.order - b.order).forEach((h, i) => {
      h.order = i;
    });
    save(data);
  }

  /**
   * Reorder habits given an ordered array of IDs.
   * @param {string[]} orderedIds
   */
  function reorderHabits(orderedIds) {
    const data = load();
    orderedIds.forEach((id, index) => {
      const habit = data.habits.find(h => h.id === id);
      if (habit) habit.order = index;
    });
    save(data);
  }

  /**
   * Mark a habit as done on a given date.
   * @param {string} habitId
   * @param {string} date  — YYYY-MM-DD
   */
  function markDone(habitId, date) {
    const data = load();
    if (!data.entries[habitId]) data.entries[habitId] = {};
    data.entries[habitId][date] = true;
    save(data);
  }

  /**
   * Mark a habit as not-done (remove entry) on a given date.
   * @param {string} habitId
   * @param {string} date  — YYYY-MM-DD
   */
  function markUndone(habitId, date) {
    const data = load();
    if (data.entries[habitId]) {
      delete data.entries[habitId][date];
    }
    save(data);
  }

  /**
   * Return the entry map for a single habit.
   * @param {string} habitId
   * @returns {Object}  { "YYYY-MM-DD": true, ... }
   */
  function getEntries(habitId) {
    const data = load();
    return data.entries[habitId] || {};
  }

  /**
   * Check if a habit is done on a given date.
   * @param {string} habitId
   * @param {string} date  — YYYY-MM-DD
   * @returns {boolean}
   */
  function isDone(habitId, date) {
    return getEntries(habitId)[date] === true;
  }

  /**
   * Return today's date string in local time (YYYY-MM-DD).
   * @returns {string}
   */
  function getTodayStr() {
    return _todayStr();
  }

  return {
    load,
    save,
    getHabits,
    addHabit,
    updateHabit,
    deleteHabit,
    reorderHabits,
    markDone,
    markUndone,
    getEntries,
    isDone,
    getTodayStr,
  };
})();

export default Store;
