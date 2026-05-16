import { nowKey, monthLabel, fmt, monthKey, fmtDate } from '../utils/format.js';
import { calcSummary, calcByCat } from '../utils/calc.js';
import { expHTML } from '../utils/render-helpers.js';

// Renderizar dashboard
export function renderDashboard(expenses, budgets, goals) {
  const mk = nowKey();

  // Actualizar mes en header
  const monthEl = document.getElementById('hdr-month');
  if (monthEl) monthEl.textContent = monthLabel(mk);

  // Calcular resumen
  const { ing, pag, real, bal } = calcSummary(mk, expenses);

  // Renderizar cards principales
  const cIng = document.getElementById('c-ing');
  const cPag = document.getElementById('c-pag');
  const cReal = document.getElementById('c-real');
  const cBal = document.getElementById('c-bal');

  if (cIng) cIng.textContent = fmt(ing);
  if (cPag) cPag.textContent = fmt(pag);
  if (cReal) cReal.textContent = fmt(real);

  if (cBal) {
    cBal.textContent = (bal < 0 ? '-' : '') + fmt(Math.abs(bal));
    cBal.className = 'card-val ' + (bal >= 0 ? 'g' : 'r');
  }

  // Proyección
  renderProjection(mk, expenses);

  // Stats
  renderStats(mk, expenses);

  // Últimos movimientos
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

function renderProjection(mk, expenses) {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  if (dayOfMonth < 3) {
    const card = document.getElementById('proj-card');
    if (card) card.style.display = 'none';
    return;
  }

  const spentSoFar = expenses
    .filter(e => monthKey(e.date) === mk && e.type === 'Egreso')
    .reduce((s, e) => s + (e.myAmount ?? e.amount), 0);

  const dailyRate = spentSoFar / dayOfMonth;
  const projected = Math.round(dailyRate * daysInMonth);
  const ing = expenses
    .filter(e => monthKey(e.date) === mk && e.type === 'Ingreso')
    .reduce((s, e) => s + e.amount, 0);

  const projCard = document.getElementById('proj-card');
  const projVal = document.getElementById('c-proj');
  const projHint = document.getElementById('c-proj-hint');

  if (projCard) projCard.style.display = '';
  if (projVal) {
    projVal.textContent = fmt(projected);
    projVal.className = 'card-val ' + (projected > ing && ing > 0 ? 'r' : 'y');
  }

  const remaining = Math.round(dailyRate * (daysInMonth - dayOfMonth));
  if (projHint) projHint.textContent = `~${fmt(remaining)} más hasta fin de mes`;
}

function renderStats(mk, expenses) {
  const rows = expenses.filter(e => monthKey(e.date) === mk && e.type === 'Egreso');
  if (!rows.length) {
    const grid = document.getElementById('stats-grid');
    if (grid) grid.style.display = 'none';
    return;
  }

  const { ing, real } = calcSummary(mk, expenses);
  const rate = ing > 0 ? Math.round((1 - real / ing) * 100) : 0;
  const today = new Date().getDate();
  const dailyAvg = today > 0 ? Math.round(real / today) : 0;

  // Top category
  const catMap = {};
  rows.forEach(e => {
    catMap[e.category] = (catMap[e.category] || 0) + (e.myAmount ?? e.amount);
  });
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

  const grid = document.getElementById('stats-grid');
  if (grid) grid.style.display = 'grid';

  const stRate = document.getElementById('st-rate');
  const stDaily = document.getElementById('st-daily');
  const stTopcat = document.getElementById('st-topcat');

  if (stRate) stRate.textContent = rate + '%';
  if (stDaily) stDaily.textContent = fmt(dailyAvg);
  if (stTopcat && topCat) stTopcat.textContent = topCat[0];
}
