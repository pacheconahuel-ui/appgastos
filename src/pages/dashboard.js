import { nowKey, monthLabel, fmt } from '../utils/format.js';
import { calcSummary, calcByCat } from '../utils/calc.js';

// Renderizar dashboard
export function renderDashboard(expenses, usdTx, debts, persons, categories, budgets, goals, accounts) {
  const mk = nowKey();

  // Actualizar mes en header
  const monthEl = document.getElementById('hdr-month');
  if (monthEl) monthEl.textContent = monthLabel(mk);

  // Calcular resumen
  const { ing, pag, real, bal } = calcSummary(mk, expenses);

  // Renderizar cards
  document.getElementById('c-ing').textContent = fmt(ing);
  document.getElementById('c-pag').textContent = fmt(pag);
  document.getElementById('c-real').textContent = fmt(real);

  const balEl = document.getElementById('c-bal');
  balEl.textContent = (bal < 0 ? '-' : '') + fmt(Math.abs(bal));
  balEl.className = 'card-val ' + (bal >= 0 ? 'g' : 'r');

  // Renderizar gráficos y stats
  renderPieChart(mk, expenses);
  renderMonthlyChart(mk, expenses);
  renderProjection(mk, expenses);
  renderRecurringReminders(mk, expenses);
  renderStats(mk, expenses);

  // Renderizar últimos movimientos
  const recent = [...expenses]
    .filter(e => monthKey(e.date) === mk)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt)
    .slice(0, 5);

  const listEl = document.getElementById('recent-list');
  if (listEl) {
    listEl.innerHTML = recent.length
      ? recent.map(e => expHTML(e, false)).join('')
      : '<div class="empty"><div class="empty-ico">📭</div><p>Sin gastos este mes</p></div>';
  }
}

function renderPieChart(mk, expenses) {
  // TODO: Implementar después, por ahora solo stub
}

function renderMonthlyChart(mk, expenses) {
  // TODO: Implementar después, por ahora solo stub
}

function renderProjection(mk, expenses) {
  // TODO: Implementar después, por ahora solo stub
}

function renderRecurringReminders(mk, expenses) {
  // TODO: Implementar después, por ahora solo stub
}

function renderStats(mk, expenses) {
  // TODO: Implementar después, por ahora solo stub
}

function monthKey(d) {
  return d ? d.slice(0, 7) : '';
}

function expHTML(e, showDelete) {
  // TODO: Implementar después, por ahora solo stub
  return '';
}
