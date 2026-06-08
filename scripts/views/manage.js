/**
 * views/manage.js — Manage Habits View
 * Add, edit, delete, and reorder habits.
 */

import Store   from '../store.js';
import { Icons, esc, showToast } from '../ui.js';
import { navigate } from '../router.js';

/**
 * Render the manage view.
 * @param {HTMLElement} container
 */
export function renderManage(container) {
  _render(container);
}

// ── Full Render ───────────────────────────────────────────────────────────────

function _render(container) {
  const habits     = Store.getHabits();
  const atMax      = habits.length >= 3;
  const addDisabledClass = atMax ? 'btn-disabled' : '';
  const addTooltip = atMax ? '3-habit max reached. Remove one to add another.' : '';

  container.innerHTML = `
    <header class="page-header" aria-label="Manage habits page header">
      <button class="page-header__back" id="manage-back" aria-label="Back to Dashboard">
        ${Icons.arrowLeft} Dashboard
      </button>
      <span class="page-header__title">Manage Habits</span>
      <span class="page-header__right"></span>
    </header>

    <section aria-label="Your habits list">
      <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: var(--space-4); letter-spacing: 0.03em;">
        Your habits <span style="font-family: var(--font-display); color: var(--accent-neutral);">(max 3)</span>
      </p>

      <div id="manage-list" role="list" aria-label="Habits list">
        ${habits.length === 0
          ? `<div class="empty-state"><p class="empty-state__text">No habits yet.</p></div>`
          : habits.map(h => _renderItem(h)).join('')
        }
      </div>

      <!-- Add habit row -->
      <div class="add-habit-row" id="add-row" style="margin-top: var(--space-5);">
        <button
          class="btn-ghost ${addDisabledClass}"
          id="add-habit-btn"
          ${atMax ? `data-tooltip="${esc(addTooltip)}"` : ''}
          aria-label="Add a new habit"
          ${atMax ? 'aria-disabled="true"' : ''}
          style="gap: var(--space-2);"
        >
          ${Icons.plus}
          Add Habit
        </button>
      </div>

      <div id="add-inline-wrap" style="display: none; margin-top: var(--space-3);">
        <div class="add-habit-inline">
          <input
            type="text"
            id="add-habit-input"
            class=""
            placeholder="New habit name"
            maxlength="40"
            autocomplete="off"
            spellcheck="false"
            aria-label="New habit name"
          />
          <button class="btn-ghost btn-sm" id="add-habit-confirm" aria-label="Confirm adding habit">
            ${Icons.check}
          </button>
          <button class="btn-ghost btn-sm" id="add-habit-cancel" aria-label="Cancel adding habit" style="color: var(--text-muted);">✕</button>
        </div>
        <div class="input-error-msg" id="add-error" role="alert"></div>
      </div>
    </section>

    <hr class="divider" />

    <div class="notice notice--warn" role="note" aria-label="Deletion warning">
      ${Icons.warning}
      <span>
        Deleting a habit removes all its history. Consider editing its name instead.
      </span>
    </div>
  `;

  _bindManage(container);
}

// ── Item Renderer ─────────────────────────────────────────────────────────────

function _renderItem(habit) {
  return `
    <div
      class="manage-item"
      id="manage-item-${esc(habit.id)}"
      data-habit-id="${esc(habit.id)}"
      draggable="true"
      role="listitem"
      aria-label="Habit: ${esc(habit.name)}"
    >
      <div class="drag-handle" aria-hidden="true" title="Drag to reorder">
        ${Icons.drag}
      </div>

      <span class="manage-item__name" id="name-${esc(habit.id)}">${esc(habit.name)}</span>

      <div class="manage-item__actions">
        <button
          class="btn-icon"
          id="edit-btn-${esc(habit.id)}"
          data-habit-id="${esc(habit.id)}"
          aria-label="Edit ${esc(habit.name)}"
          title="Edit"
        >${Icons.edit}</button>
        <button
          class="btn-icon"
          id="delete-btn-${esc(habit.id)}"
          data-habit-id="${esc(habit.id)}"
          aria-label="Delete ${esc(habit.name)}"
          title="Delete"
          style="color: var(--accent-danger); border-color: transparent;"
        >${Icons.trash}</button>
      </div>
    </div>

    <!-- Inline delete confirmation (hidden by default) -->
    <div class="inline-confirm" id="confirm-${esc(habit.id)}" style="display: none;" role="alert" aria-live="polite">
      <span class="inline-confirm__text">
        Delete <strong>"${esc(habit.name)}"</strong> and all its data?
      </span>
      <div class="inline-confirm__btns">
        <button
          class="btn-danger btn-sm"
          id="confirm-yes-${esc(habit.id)}"
          data-habit-id="${esc(habit.id)}"
          aria-label="Confirm deletion of ${esc(habit.name)}"
        >Delete</button>
        <button
          class="btn-ghost btn-sm"
          id="confirm-no-${esc(habit.id)}"
          data-habit-id="${esc(habit.id)}"
          aria-label="Cancel deletion"
        >Cancel</button>
      </div>
    </div>
  `;
}

// ── Binding ───────────────────────────────────────────────────────────────────

function _bindManage(container) {
  // Back button
  container.querySelector('#manage-back')?.addEventListener('click', () => {
    window.location.hash = '#/dashboard';
  });

  // Edit buttons
  container.querySelectorAll('[id^="edit-btn-"]').forEach(btn => {
    btn.addEventListener('click', () => _startEdit(btn.dataset.habitId, container));
  });

  // Delete buttons — first click shows confirmation
  container.querySelectorAll('[id^="delete-btn-"]').forEach(btn => {
    btn.addEventListener('click', () => _showDeleteConfirm(btn.dataset.habitId, container));
  });

  // Confirm / Cancel delete
  container.querySelectorAll('[id^="confirm-yes-"]').forEach(btn => {
    btn.addEventListener('click', () => _confirmDelete(btn.dataset.habitId, container));
  });
  container.querySelectorAll('[id^="confirm-no-"]').forEach(btn => {
    btn.addEventListener('click', () => _cancelDelete(btn.dataset.habitId, container));
  });

  // Add habit button
  const addBtn  = container.querySelector('#add-habit-btn');
  const addWrap = container.querySelector('#add-inline-wrap');
  const addInput  = container.querySelector('#add-habit-input');
  const addConfirm = container.querySelector('#add-habit-confirm');
  const addCancel = container.querySelector('#add-habit-cancel');

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const habits = Store.getHabits();
      if (habits.length >= 3) return;
      addBtn.style.display = 'none';
      addWrap.style.display = 'block';
      addInput?.focus();
    });
  }

  if (addInput) {
    addInput.addEventListener('keydown', e => {
      if (e.key === 'Enter') _submitAddHabit(container, addInput, addWrap, addBtn);
      if (e.key === 'Escape') _cancelAdd(container, addInput, addWrap, addBtn);
    });
  }

  if (addConfirm) {
    addConfirm.addEventListener('click', () => _submitAddHabit(container, addInput, addWrap, addBtn));
  }
  if (addCancel) {
    addCancel.addEventListener('click', () => _cancelAdd(container, addInput, addWrap, addBtn));
  }

  // Drag and drop reordering
  _bindDragDrop(container);
}

// ── Edit Inline ───────────────────────────────────────────────────────────────

function _startEdit(habitId, container) {
  const habit   = Store.getHabits().find(h => h.id === habitId);
  if (!habit) return;

  const nameEl  = container.querySelector(`#name-${habitId}`);
  if (!nameEl) return;

  const originalName = habit.name;

  // Replace text span with input
  const input = document.createElement('input');
  input.type  = 'text';
  input.value = originalName;
  input.maxLength = 40;
  input.className = 'manage-item__edit-input';
  input.setAttribute('aria-label', 'Edit habit name');
  input.spellcheck = false;
  input.autocomplete = 'off';

  nameEl.replaceWith(input);
  input.focus();
  input.select();

  function saveEdit() {
    const newName = input.value.trim();
    if (!newName) {
      showToast("Habit name can't be empty.");
      input.focus();
      return;
    }
    // Duplicate check
    const habits = Store.getHabits();
    const isDuplicate = habits.some(
      h => h.id !== habitId && h.name.toLowerCase() === newName.toLowerCase()
    );
    if (isDuplicate) {
      showToast('You already have a habit by this name.');
      input.focus();
      return;
    }
    Store.updateHabit(habitId, newName);
    // Re-render the whole view to reflect changes
    _render(container);
    showToast('Habit updated.');
  }

  function cancelEdit() {
    // Re-render to restore original state
    _render(container);
  }

  input.addEventListener('blur', saveEdit);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      input.blur();
    }
    if (e.key === 'Escape') {
      input.removeEventListener('blur', saveEdit);
      cancelEdit();
    }
  });
}

// ── Delete Flow ───────────────────────────────────────────────────────────────

function _showDeleteConfirm(habitId, container) {
  // Hide any other open confirmations first
  container.querySelectorAll('[id^="confirm-"]').forEach(el => {
    if (el.id !== `confirm-${habitId}`) el.style.display = 'none';
  });

  const confirmEl = container.querySelector(`#confirm-${habitId}`);
  if (confirmEl) confirmEl.style.display = 'flex';
}

function _cancelDelete(habitId, container) {
  const confirmEl = container.querySelector(`#confirm-${habitId}`);
  if (confirmEl) confirmEl.style.display = 'none';
}

function _confirmDelete(habitId, container) {
  const itemEl    = container.querySelector(`#manage-item-${habitId}`);
  const confirmEl = container.querySelector(`#confirm-${habitId}`);

  // Animate out
  if (itemEl) {
    itemEl.classList.add('manage-item--deleting');
    itemEl.addEventListener('animationend', () => {
      Store.deleteHabit(habitId);
      const habits = Store.getHabits();
      if (habits.length === 0) {
        navigate('onboarding');
      } else {
        _render(container);
      }
      showToast('Habit deleted.');
    }, { once: true });

    // Also animate confirmation row out
    if (confirmEl) {
      confirmEl.style.opacity = '0';
      confirmEl.style.transition = 'opacity 200ms';
    }
  } else {
    Store.deleteHabit(habitId);
    _render(container);
    showToast('Habit deleted.');
  }
}

// ── Add Habit Flow ────────────────────────────────────────────────────────────

function _submitAddHabit(container, input, addWrap, addBtn) {
  const name = input.value.trim();
  const errEl = container.querySelector('#add-error');

  if (!name) {
    if (errEl) { errEl.textContent = "Habit name can't be empty."; errEl.classList.add('visible'); }
    input.focus();
    return;
  }

  // Duplicate check
  const habits = Store.getHabits();
  if (habits.some(h => h.name.toLowerCase() === name.toLowerCase())) {
    if (errEl) { errEl.textContent = 'You already have a habit by this name.'; errEl.classList.add('visible'); }
    input.focus();
    return;
  }

  if (habits.length >= 3) {
    if (errEl) { errEl.textContent = '3-habit max reached.'; errEl.classList.add('visible'); }
    return;
  }

  Store.addHabit(name);
  showToast('Habit added.');
  _render(container);
}

function _cancelAdd(container, input, addWrap, addBtn) {
  input.value = '';
  addWrap.style.display = 'none';
  addBtn.style.display  = '';
  const errEl = container.querySelector('#add-error');
  if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }
}

// ── Drag & Drop Reordering ────────────────────────────────────────────────────

function _bindDragDrop(container) {
  const list = container.querySelector('#manage-list');
  if (!list) return;

  let dragSrcId = null;

  function getItems() {
    return Array.from(list.querySelectorAll('.manage-item[data-habit-id]'));
  }

  list.addEventListener('dragstart', e => {
    const item = e.target.closest('.manage-item');
    if (!item) return;
    dragSrcId = item.dataset.habitId;
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', dragSrcId);
  });

  list.addEventListener('dragend', e => {
    const item = e.target.closest('.manage-item');
    if (item) item.classList.remove('dragging');
    getItems().forEach(i => i.classList.remove('drag-over'));
    dragSrcId = null;
  });

  list.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const target = e.target.closest('.manage-item');
    if (!target || target.dataset.habitId === dragSrcId) return;
    getItems().forEach(i => i.classList.remove('drag-over'));
    target.classList.add('drag-over');
  });

  list.addEventListener('dragleave', e => {
    const target = e.target.closest('.manage-item');
    if (target) target.classList.remove('drag-over');
  });

  list.addEventListener('drop', e => {
    e.preventDefault();
    const target = e.target.closest('.manage-item');
    if (!target || !dragSrcId || target.dataset.habitId === dragSrcId) return;

    // Get new order by DOM position after drop
    const items = getItems();
    const srcIdx = items.findIndex(i => i.dataset.habitId === dragSrcId);
    const tgtIdx = items.findIndex(i => i === target);

    // Reorder in DOM
    if (srcIdx < tgtIdx) {
      target.after(list.querySelector(`#manage-item-${dragSrcId}`));
    } else {
      target.before(list.querySelector(`#manage-item-${dragSrcId}`));
    }

    // Save new order
    const newOrder = Array.from(list.querySelectorAll('.manage-item[data-habit-id]'))
      .map(i => i.dataset.habitId);
    Store.reorderHabits(newOrder);

    getItems().forEach(i => i.classList.remove('drag-over'));
  });
}
