import { newId } from '../utils/format.js';
import { toast, showConfirm, esc } from '../utils/html.js';
import { saveDebts } from '../storage/local.js';

let currentDebt = null;

function renderDebtHTML(debt) {
  const isEdit = !!debt;
  const personId = debt?.personId || '';
  const description = debt?.description || '';
  const amount = debt?.amount || '';
  const date = debt?.date || new Date().toISOString().split('T')[0];
  const settled = debt?.settled || false;

  const persons = window.persons || [];

  return `
    <div class="m-dlg">
      <div class="m-ttl">${isEdit ? '✏️ Editar' : '➕ Nueva'} Deuda</div>
      <div class="m-body">
        <div class="m-section">
          <label>Persona</label>
          <select class="f-ctrl" id="debt-person">
            <option value="">Seleccionar...</option>
            ${persons.map(p => `<option value="${p.id}" ${personId === p.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
          </select>
        </div>

        <div class="m-section">
          <label>Descripción</label>
          <input type="text" class="f-ctrl" id="debt-desc" placeholder="Ej: Cena" value="${esc(description)}">
        </div>

        <div class="m-section">
          <label>Monto</label>
          <input type="number" class="f-ctrl" id="debt-amt" placeholder="0" value="${amount}">
        </div>

        <div class="m-section">
          <label>Fecha</label>
          <input type="date" class="f-ctrl" id="debt-date" value="${date}">
        </div>

        <div class="m-section">
          <label>
            <input type="checkbox" id="debt-settled" ${settled ? 'checked' : ''}>
            Saldada
          </label>
        </div>
      </div>

      <div class="m-footer">
        ${isEdit ? `<button class="btn-danger" id="btn-del-debt">Eliminar</button>` : ''}
        <button class="btn-secondary" id="btn-close-debt">Cancelar</button>
        <button class="btn-primary" id="btn-save-debt">Guardar</button>
      </div>
    </div>
  `;
}

export function openDebtModal(debt = null) {
  currentDebt = debt;
  const overlay = document.getElementById('debt-overlay');
  if (!overlay) return;

  overlay.innerHTML = renderDebtHTML(debt);
  overlay.classList.add('on');

  document.getElementById('btn-close-debt')?.addEventListener('click', closeDebtModal);
  document.getElementById('btn-save-debt')?.addEventListener('click', saveDebt);

  if (debt) {
    document.getElementById('btn-del-debt')?.addEventListener('click', deleteDebt);
  }
}

export function saveDebt() {
  const personId = document.getElementById('debt-person')?.value || '';
  const description = document.getElementById('debt-desc')?.value || '';
  const amount = parseFloat(document.getElementById('debt-amt')?.value || 0);
  const date = document.getElementById('debt-date')?.value || '';
  const settled = document.getElementById('debt-settled')?.checked || false;

  if (!personId || !description || !amount || !date) {
    toast('Por favor completá todos los campos');
    return;
  }

  const newDebt = currentDebt || {
    id: newId(),
    createdAt: Date.now()
  };

  Object.assign(newDebt, {
    personId,
    description,
    amount,
    date,
    settled,
    updatedAt: Date.now()
  });

  if (!currentDebt) {
    window.debts.push(newDebt);
  }

  const uid = window.auth?.currentUser?.uid;
  if (uid) {
    saveDebts(window.debts, uid);
  }

  toast(currentDebt ? '✅ Deuda actualizada' : '✅ Deuda creada');
  closeDebtModal();

  if (window.renderSaldosTab) window.renderSaldosTab(window.persons, window.debts);
}

function deleteDebt() {
  if (!currentDebt) return;
  showConfirm('¿Eliminar esta deuda?', () => {
    window.debts = window.debts.filter(d => d.id !== currentDebt.id);
    const uid = window.auth?.currentUser?.uid;
    if (uid) {
      saveDebts(window.debts, uid);
    }
    toast('🗑️ Deuda eliminada');
    closeDebtModal();
    if (window.renderSaldosTab) window.renderSaldosTab(window.persons, window.debts);
  });
}

export function closeDebtModal() {
  currentDebt = null;
  const overlay = document.getElementById('debt-overlay');
  if (overlay) {
    overlay.classList.remove('on');
    overlay.innerHTML = '';
  }
}
