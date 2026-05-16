import { fmt, monthKey, nowKey } from '../utils/format.js';
import { esc } from '../utils/html.js';

export function renderCuentasTab(accounts, transfers, expenses, monthKey_fn) {
  const mk = nowKey();
  let arsTotal = 0;
  let html = '';

  // Calcular balance por billetera
  accounts.forEach(a => {
    let bal = a.initialBalance || 0;
    
    expenses.forEach(e => {
      if (e.accountId !== a.id) return;
      if (e.type === 'Ingreso') bal += e.amount;
      else bal -= (e.myAmount ?? e.amount);
    });

    transfers.forEach(t => {
      if (t.fromId === a.id) bal -= t.amount;
      if (t.toId === a.id) bal += t.amount;
    });

    arsTotal += bal;
    const bc = bal >= 0 ? 'g' : 'r';

    html += `<div class="account-card" onclick="openAccountModal('${a.id}')">
      <div class="account-ava" style="background:rgba(96,165,250,.1);border-color:rgba(96,165,250,.2)">${a.emoji}</div>
      <div class="account-info">
        <div class="account-name">${esc(a.name)}</div>
        <div class="account-type">${expenses.filter(e => e.accountId === a.id && monthKey_fn(e.date) === mk).length} mov. este mes</div>
      </div>
      <div class="account-bal">
        <div class="account-bal-val card-val ${bc}">${bal < 0 ? '-' : ''}${fmt(bal)}</div>
        <button onclick="confirmDeleteAccount('${a.id}',event)" class="btn-ico del" style="margin-top:6px;width:26px;height:26px;font-size:11px">🗑️</button>
      </div>
    </div>`;
  });

  if (!accounts.length) {
    html = '<div class="empty"><div class="empty-ico">💼</div><p>Sin billeteras. Tocá ＋ para agregar.</p></div>';
  }

  document.getElementById('cuentas-list').innerHTML = html;
  document.getElementById('cuentas-total-ars').textContent = fmt(arsTotal);

  // Transferencias recientes
  const mTf = transfers.filter(t => monthKey_fn(t.date) === mk);
  document.getElementById('cuentas-transfers-count').textContent = `${mTf.length} transferencia${mTf.length !== 1 ? 's' : ''}`;

  const tHtml = transfers.length ? [...transfers]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10)
    .map(t => {
      const fr = accounts.find(a => a.id === t.fromId);
      const to = accounts.find(a => a.id === t.toId);
      return `<div class="transfer-box">
        <div style="font-size:20px">${fr?.emoji || '💼'}</div>
        <div class="exp-info">
          <div class="exp-desc">${esc(t.description || 'Transferencia')}</div>
          <div class="exp-meta">${t.date} · ${esc(fr?.name || '?')} → ${esc(to?.name || '?')}</div>
        </div>
        <div class="exp-amt e">${fmt(t.amount)}</div>
        <button class="btn-ico del" onclick="deleteTransfer('${t.id}',event)" style="width:28px;height:28px;font-size:12px">🗑️</button>
      </div>`;
    })
    .join('')
    : '<div class="empty"><div class="empty-ico">⇄</div><p>Sin transferencias</p></div>';

  document.getElementById('transfers-list').innerHTML = tHtml;
}
