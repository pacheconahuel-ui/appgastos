import { monthKey, nowKey, fmt, fmtU } from '../utils/format.js';
import { usdTxHTML } from '../utils/render-helpers.js';

export function renderUsdTab(usdTx, expenses) {
  const mk = nowKey();
  
  // Stock actual
  let stock = usdTx.reduce((s, t) => {
    if (t.type === 'ingreso') return s + t.usdAmount;
    if (t.type === 'venta') return s - t.usdAmount;
    return s;
  }, 0);

  const stockEl = document.getElementById('usd-stock');
  const stockSubEl = document.getElementById('usd-stock-sub');
  if (stockEl) stockEl.textContent = fmtU(stock);
  if (stockSubEl) stockSubEl.textContent = `${usdTx.length} transacciones`;

  // Resumen mes
  const monthTx = usdTx.filter(t => monthKey(t.date) === mk);
  const ingresos = monthTx.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.usdAmount, 0);
  const vendidos = monthTx.filter(t => t.type === 'venta').reduce((s, t) => s + t.usdAmount, 0);
  const arsObt = monthTx.filter(t => t.linkedArsId).length;

  document.getElementById('usd-c-in').textContent = fmtU(ingresos);
  document.getElementById('usd-c-sold').textContent = fmtU(vendidos);
  document.getElementById('usd-c-ars').textContent = fmt(arsObt * 1000); // Placeholder
  document.getElementById('usd-c-tc').textContent = monthTx.length ? '—' : '—';

  // Lista de movimientos
  const listEl = document.getElementById('usd-list');
  if (listEl) {
    const sorted = [...usdTx].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
    listEl.innerHTML = sorted.length
      ? sorted.map(t => usdTxHTML(t)).join('')
      : '<div class="empty"><div class="empty-ico">💵</div><p>Sin movimientos USD</p></div>';
  }
}
