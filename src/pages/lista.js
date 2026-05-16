import { monthKey, nowKey, allMonths } from '../utils/format.js';
import { expHTML } from '../utils/render-helpers.js';

export function renderListSec(expenses, categories) {
  const mk = document.getElementById('fil-month')?.value || nowKey();
  const searchQ = (document.getElementById('fil-search')?.value || '').toLowerCase().trim();
  const catFilter = document.getElementById('fil-cat')?.value || '';

  // Filtrar
  let rows = expenses.filter(e => monthKey(e.date) === mk);

  if (searchQ) {
    rows = rows.filter(e =>
      (e.description || '').toLowerCase().includes(searchQ) ||
      (e.category || '').toLowerCase().includes(searchQ) ||
      (e.notes || '').toLowerCase().includes(searchQ)
    );
  }

  if (catFilter) {
    rows = rows.filter(e => e.category === catFilter);
  }

  // Llenar select de meses
  const monthSelect = document.getElementById('fil-month');
  if (monthSelect && !monthSelect.innerHTML) {
    const months = allMonths(expenses);
    monthSelect.innerHTML = months
      .map(m => `<option value="${m}">${monthLabel(m)}</option>`)
      .join('');
    monthSelect.value = mk;
  }

  // Llenar select de categorías
  const catSelect = document.getElementById('fil-cat');
  if (catSelect && !catSelect.innerHTML) {
    catSelect.innerHTML = '<option value="">Todas las categorías</option>' +
      categories.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  // Contar
  const countEl = document.getElementById('list-count');
  if (countEl) countEl.textContent = `${rows.length} gasto${rows.length !== 1 ? 's' : ''}`;

  // Renderizar lista
  const listEl = document.getElementById('full-list');
  if (listEl) {
    rows.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    listEl.innerHTML = rows.length
      ? rows.map(e => expHTML(e, true)).join('')
      : '<div class="empty"><div class="empty-ico">📭</div><p>Sin gastos con estos filtros</p></div>';
  }
}

function monthLabel(mk) {
  if (!mk) return '';
  const [y, m] = mk.split('-');
  const N = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${N[parseInt(m) - 1]} ${y}`;
}
