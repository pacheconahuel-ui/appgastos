import { newId, fmtDate } from '../utils/format.js';
import { toast, showConfirm, esc } from '../utils/html.js';
import { icon } from '../utils/icons.js';
import { saveArs } from '../storage/local.js';

let currentExpense = null;

function renderExpenseHTML(exp) {
  const isEdit = !!exp;
  const type = exp?.type || 'Egreso';
  const category = exp?.category || window.cats?.[0] || 'Compras';
  const amount = exp?.amount || '';
  const myAmount = exp?.myAmount || '';
  const description = exp?.description || '';
  const notes = exp?.notes || '';
  const date = exp?.date || new Date().toISOString().split('T')[0];
  const shared = exp?.shared || false;
  const sharedWith = exp?.sharedWith || '';
  const recurring = exp?.recurring || false;
  const account = exp?.accountId || '';

  const cats = window.cats || [];
  const accounts = window.accounts || [];

  return `
    <div class="m-dlg">
      <div class="m-ttl">${isEdit ? '✏️ Editar' : '➕ Nuevo'} Gasto</div>
      <div class="m-body">
        <div class="m-section">
          <label>Tipo</label>
          <select class="f-ctrl" id="exp-type">
            <option value="Egreso" ${type === 'Egreso' ? 'selected' : ''}>Gasto</option>
            <option value="Ingreso" ${type === 'Ingreso' ? 'selected' : ''}>Ingreso</option>
          </select>
        </div>

        <div class="m-section">
          <label>Categoría</label>
          <select class="f-ctrl" id="exp-cat">
            ${cats.map(c => `<option value="${c}" ${category === c ? 'selected' : ''}>${icon(c)} ${esc(c)}</option>`).join('')}
          </select>
        </div>

        <div class="m-section">
          <label>Descripción</label>
          <input type="text" class="f-ctrl" id="exp-desc" placeholder="Ej: Almuerzo" value="${esc(description)}">
        </div>

        <div class="m-section">
          <label>Monto (ARS)</label>
          <input type="number" class="f-ctrl" id="exp-amt" placeholder="0" value="${amount}">
        </div>

        <div class="m-section">
          <label>Mi parte (si es compartido)</label>
          <input type="number" class="f-ctrl" id="exp-my-amt" placeholder="0" value="${myAmount}">
        </div>

        <div class="m-section">
          <label>Fecha</label>
          <input type="date" class="f-ctrl" id="exp-date" value="${date}">
        </div>

        <div class="m-section">
          <label>Notas</label>
          <input type="text" class="f-ctrl" id="exp-notes" placeholder="Detalles adicionales" value="${esc(notes)}">
        </div>

        <div class="m-section">
          <label>
            <input type="checkbox" id="exp-shared" ${shared ? 'checked' : ''}>
            Compartido
          </label>
        </div>

        <div class="m-section" id="shared-with" style="display:${shared ? 'block' : 'none'}">
          <label>Con quién</label>
          <input type="text" class="f-ctrl" id="exp-shared-with" placeholder="Nombre" value="${esc(sharedWith)}">
        </div>

        <div class="m-section">
          <label>
            <input type="checkbox" id="exp-recurring" ${recurring ? 'checked' : ''}>
            Recurrente
          </label>
        </div>

        <div class="m-section" id="account-section" style="display:${type === 'Egreso' ? 'block' : 'none'}">
          <label>Billetera</label>
          <select class="f-ctrl" id="exp-account">
            <option value="">Sin especificar</option>
            ${accounts.map(a => `<option value="${a.id}" ${account === a.id ? 'selected' : ''}>${a.emoji} ${esc(a.name)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="m-footer">
        ${isEdit ? `<button class="btn-danger" id="btn-del-exp">Eliminar</button>` : ''}
        <button class="btn-secondary" id="btn-close-exp">Cancelar</button>
        <button class="btn-primary" id="btn-save-exp">Guardar</button>
      </div>
    </div>
  `;
}

export function openModal(expense = null) {
  currentExpense = expense;
  const overlay = document.getElementById('m-overlay');
  if (!overlay) return;

  overlay.innerHTML = renderExpenseHTML(expense);
  overlay.classList.add('on');

  // Toggle shared with field
  const sharedCheck = document.getElementById('exp-shared');
  const sharedSection = document.getElementById('shared-with');
  if (sharedCheck) {
    sharedCheck.addEventListener('change', () => {
      if (sharedSection) sharedSection.style.display = sharedCheck.checked ? 'block' : 'none';
    });
  }

  // Toggle account field based on type
  const typeSelect = document.getElementById('exp-type');
  const accountSection = document.getElementById('account-section');
  if (typeSelect) {
    typeSelect.addEventListener('change', () => {
      if (accountSection) accountSection.style.display = typeSelect.value === 'Egreso' ? 'block' : 'none';
    });
  }

  // Close button
  document.getElementById('btn-close-exp')?.addEventListener('click', closeModal);

  // Save button
  document.getElementById('btn-save-exp')?.addEventListener('click', saveExpense);

  // Delete button
  if (expense) {
    document.getElementById('btn-del-exp')?.addEventListener('click', deleteExpense);
  }
}

export function saveExpense() {
  const type = document.getElementById('exp-type')?.value || 'Egreso';
  const category = document.getElementById('exp-cat')?.value || '';
  const description = document.getElementById('exp-desc')?.value || '';
  const amount = parseFloat(document.getElementById('exp-amt')?.value || 0);
  const myAmount = parseFloat(document.getElementById('exp-my-amt')?.value || 0) || undefined;
  const date = document.getElementById('exp-date')?.value || '';
  const notes = document.getElementById('exp-notes')?.value || '';
  const shared = document.getElementById('exp-shared')?.checked || false;
  const sharedWith = document.getElementById('exp-shared-with')?.value || '';
  const recurring = document.getElementById('exp-recurring')?.checked || false;
  const accountId = document.getElementById('exp-account')?.value || '';

  if (!description || !amount || !date || !category) {
    toast('Por favor completá descripción, monto, fecha y categoría');
    return;
  }

  if (shared && !sharedWith) {
    toast('Por favor indicá con quién es compartido');
    return;
  }

  const newExp = currentExpense || {
    id: newId(),
    createdAt: Date.now()
  };

  Object.assign(newExp, {
    type,
    category,
    description,
    amount,
    ...(myAmount && { myAmount }),
    date,
    notes: notes || undefined,
    ...(shared && { shared: true, sharedWith }),
    ...(recurring && { recurring: true }),
    ...(accountId && { accountId }),
    updatedAt: Date.now()
  });

  // Update window.expenses
  if (!currentExpense) {
    window.expenses.push(newExp);
  }

  // Save to localStorage
  const uid = window.auth?.currentUser?.uid;
  if (uid) {
    saveArs(window.expenses, uid);
  }

  toast(currentExpense ? '✅ Gasto actualizado' : '✅ Gasto creado');
  closeModal();

  // Re-render if function exists
  if (window.renderListSec) window.renderListSec(window.expenses, window.cats);
  if (window.renderDashboard) window.renderDashboard(window.expenses, window.budgets, window.goals);
}

function deleteExpense() {
  if (!currentExpense) return;
  showConfirm('¿Eliminar este gasto?', () => {
    window.expenses = window.expenses.filter(e => e.id !== currentExpense.id);
    const uid = window.auth?.currentUser?.uid;
    if (uid) {
      saveArs(window.expenses, uid);
    }
    toast('🗑️ Gasto eliminado');
    closeModal();
    if (window.renderListSec) window.renderListSec(window.expenses, window.cats);
    if (window.renderDashboard) window.renderDashboard(window.expenses, window.budgets, window.goals);
  });
}

export function closeModal() {
  currentExpense = null;
  const overlay = document.getElementById('m-overlay');
  if (overlay) {
    overlay.classList.remove('on');
    overlay.innerHTML = '';
  }
}
