import { newId, fmtDate } from '../utils/format.js';
import { toast, showConfirm, esc } from '../utils/html.js';
import { saveUsd } from '../storage/local.js';

let currentTx = null;

function renderUsdHTML(tx) {
  const isEdit = !!tx;
  const type = tx?.type || 'ingreso';
  const description = tx?.description || '';
  const usdAmount = tx?.usdAmount || '';
  const arsAmount = tx?.arsAmount || '';
  const date = tx?.date || new Date().toISOString().split('T')[0];
  const rate = tx?.rate || '';

  return `
    <div class="m-dlg">
      <div class="m-ttl">${isEdit ? '✏️ Editar' : '➕ Nueva'} Transacción USD</div>
      <div class="m-body">
        <div class="m-section">
          <label>Tipo</label>
          <select class="f-ctrl" id="usd-type">
            <option value="ingreso" ${type === 'ingreso' ? 'selected' : ''}>Compra</option>
            <option value="venta" ${type === 'venta' ? 'selected' : ''}>Venta</option>
          </select>
        </div>

        <div class="m-section">
          <label>Descripción</label>
          <input type="text" class="f-ctrl" id="usd-desc" placeholder="Ej: Compra en Amazon" value="${esc(description)}">
        </div>

        <div class="m-section">
          <label>Monto USD</label>
          <input type="number" class="f-ctrl" id="usd-amt" placeholder="0" value="${usdAmount}">
        </div>

        <div class="m-section">
          <label>Monto ARS</label>
          <input type="number" class="f-ctrl" id="usd-ars" placeholder="0" value="${arsAmount}">
        </div>

        <div class="m-section">
          <label>Cotización (ARS/USD)</label>
          <input type="number" class="f-ctrl" id="usd-rate" placeholder="0" value="${rate}">
        </div>

        <div class="m-section">
          <label>Fecha</label>
          <input type="date" class="f-ctrl" id="usd-date" value="${date}">
        </div>
      </div>

      <div class="m-footer">
        ${isEdit ? `<button class="btn-danger" id="btn-del-usd">Eliminar</button>` : ''}
        <button class="btn-secondary" id="btn-close-usd">Cancelar</button>
        <button class="btn-primary" id="btn-save-usd">Guardar</button>
      </div>
    </div>
  `;
}

export function openUsdModal(tx = null) {
  currentTx = tx;
  const overlay = document.getElementById('usd-overlay');
  if (!overlay) return;

  overlay.innerHTML = renderUsdHTML(tx);
  overlay.classList.add('on');

  document.getElementById('btn-close-usd')?.addEventListener('click', closeUsdModal);
  document.getElementById('btn-save-usd')?.addEventListener('click', saveUsdTx);

  if (tx) {
    document.getElementById('btn-del-usd')?.addEventListener('click', deleteUsdTx);
  }
}

export function saveUsdTx() {
  const type = document.getElementById('usd-type')?.value || 'ingreso';
  const description = document.getElementById('usd-desc')?.value || '';
  const usdAmount = parseFloat(document.getElementById('usd-amt')?.value || 0);
  const arsAmount = parseFloat(document.getElementById('usd-ars')?.value || 0);
  const rate = parseFloat(document.getElementById('usd-rate')?.value || 0);
  const date = document.getElementById('usd-date')?.value || '';

  if (!description || !usdAmount || !arsAmount || !date) {
    toast('Por favor completá todos los campos');
    return;
  }

  const newTx = currentTx || {
    id: newId(),
    createdAt: Date.now()
  };

  Object.assign(newTx, {
    type,
    description,
    usdAmount,
    arsAmount,
    ...(rate && { rate }),
    date,
    updatedAt: Date.now()
  });

  if (!currentTx) {
    window.usdTx.push(newTx);
  }

  const uid = window.auth?.currentUser?.uid;
  if (uid) {
    saveUsd(window.usdTx, uid);
  }

  toast(currentTx ? '✅ Transacción actualizada' : '✅ Transacción creada');
  closeUsdModal();

  if (window.renderUsdTab) window.renderUsdTab(window.usdTx);
  if (window.renderDashboard) window.renderDashboard(window.expenses, window.budgets, window.goals);
}

function deleteUsdTx() {
  if (!currentTx) return;
  showConfirm('¿Eliminar esta transacción?', () => {
    window.usdTx = window.usdTx.filter(t => t.id !== currentTx.id);
    const uid = window.auth?.currentUser?.uid;
    if (uid) {
      saveUsd(window.usdTx, uid);
    }
    toast('🗑️ Transacción eliminada');
    closeUsdModal();
    if (window.renderUsdTab) window.renderUsdTab(window.usdTx);
  });
}

export function closeUsdModal() {
  currentTx = null;
  const overlay = document.getElementById('usd-overlay');
  if (overlay) {
    overlay.classList.remove('on');
    overlay.innerHTML = '';
  }
}
