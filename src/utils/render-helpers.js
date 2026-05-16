import { fmt, fmtDate, fmtU } from './format.js';
import { icon } from './icons.js';
import { esc } from './html.js';

// Generar HTML de un gasto para lista
export function expHTML(e, showDelete = true) {
  const isExpense = e.type === 'Egreso';
  const isIncome = e.type === 'Ingreso';
  const amtClass = isExpense ? 'e' : isIncome ? 'i' : '';
  const iconBg = isExpense ? 'purple-bg' : isIncome ? 'purple-bg' : 'purple-bg';

  let badges = '';
  if (e.shared) badges += '<span class="badge sh">🤝 Compartido</span>';
  if (e.recurring) badges += '<span class="badge ing">🔁 Recurrente</span>';

  return `
    <div class="exp-item swipeable" data-id="${e.id}">
      <div class="exp-ico ${iconBg}">${icon(e.category)}</div>
      <div class="exp-info">
        <div class="exp-desc">${esc(e.description)}</div>
        <div class="exp-meta">
          <span>${fmtDate(e.date)}</span>·
          <span>${esc(e.category)}</span>
          ${badges}
        </div>
      </div>
      <div class="exp-right">
        <div class="exp-amt ${amtClass}">${isExpense ? '-' : '+'}${fmt(e.amount)}</div>
        <div class="exp-actions">
          <button class="btn-ico edit" onclick="editExp('${e.id}',event)">✏️</button>
          ${showDelete ? `<button class="btn-ico del" onclick="delExp('${e.id}',event)">🗑️</button>` : ''}
        </div>
      </div>
      <div class="swipe-delete-bg">🗑️</div>
    </div>
  `;
}

// Generar HTML de transacción USD
export function usdTxHTML(t) {
  const isBuy = t.type === 'ingreso';
  return `
    <div class="exp-item">
      <div class="exp-ico gold-bg">💵</div>
      <div class="exp-info">
        <div class="exp-desc">${esc(t.description)}</div>
        <div class="exp-meta">
          <span>${fmtDate(t.date)}</span>
          ${t.type === 'ingreso' ? '<span class="badge usd-in">Ingreso</span>' : '<span class="badge usd-sell">Venta</span>'}
        </div>
      </div>
      <div class="exp-right">
        <div class="exp-amt gold">${isBuy ? '+' : '-'}${fmtU(t.usdAmount)}</div>
        <button class="btn-ico edit" onclick="editUsdTx('${t.id}',event)">✏️</button>
        <button class="btn-ico del" onclick="delUsdTx('${t.id}',event)">🗑️</button>
      </div>
    </div>
  `;
}

// Generar HTML de persona en saldos
export function personHTML(person, debts) {
  const activeDebts = debts.filter(d => d.personId === person.id && !d.settled);
  const balance = activeDebts.reduce((s, d) => s + d.amount, 0);
  const balClass = balance > 0 ? 'pos' : balance < 0 ? 'neg' : 'zero';

  return `
    <div class="person-card">
      <div class="person-header">
        <div class="person-ava">👤</div>
        <div class="person-info">
          <div class="person-name">${esc(person.name)}</div>
          <div class="person-sub">${person.email || 'Sin email'}</div>
        </div>
        <div class="person-balance">
          <div class="person-bal-val ${balClass}">${balance > 0 ? '+' : ''}${fmt(balance)}</div>
          <div class="person-bal-lbl">${balance > 0 ? 'Me deben' : 'Yo debo'}</div>
        </div>
      </div>
      ${activeDebts.length ? `
        <div class="person-debts">
          ${activeDebts.map(d => `
            <div class="debt-item">
              <div class="debt-info">
                <div class="debt-desc">${esc(d.description)}</div>
                <div class="debt-meta">${fmtDate(d.date)}</div>
              </div>
              <div class="debt-amt ${d.amount > 0 ? 'pos' : 'neg'}">${d.amount > 0 ? '+' : '-'}${fmt(Math.abs(d.amount))}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}
