import { personHTML } from '../utils/render-helpers.js';
import { fmt } from '../utils/format.js';

export function renderSaldosTab(persons, debts) {
  // Calcular totales
  let meDeben = 0, yoDebo = 0;

  debts.forEach(d => {
    if (!d.settled) {
      if (d.amount > 0) meDeben += d.amount;
      else yoDebo += Math.abs(d.amount);
    }
  });

  // Renderizar summary
  document.getElementById('sum-me-deben').textContent = fmt(meDeben);
  document.getElementById('sum-yo-debo').textContent = fmt(yoDebo);
  document.getElementById('sum-neto').textContent = fmt(meDeben - yoDebo);

  // Renderizar personas
  const listEl = document.getElementById('saldos-list');
  if (listEl) {
    const activePeople = persons.filter(p => debts.some(d => d.personId === p.id && !d.settled));
    listEl.innerHTML = activePeople.length
      ? activePeople.map(p => personHTML(p, debts)).join('')
      : '<div class="empty"><div class="empty-ico">🤝</div><p>Sin saldos pendientes</p></div>';
  }
}
