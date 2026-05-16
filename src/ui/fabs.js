// FABs (Floating Action Buttons) dinámicos
export function renderFabs() {
  const container = document.getElementById('fabs');
  const html = `
    <button class="fab" id="fab-ars" title="Agregar movimiento">＋</button>
    <button class="fab" id="fab-quick" title="Agregar rápido" style="background:linear-gradient(135deg,#a78bfa,#667eea);box-shadow:0 8px 32px rgba(167,139,250,.35);padding:15px 18px">⚡</button>
    <button class="fab gold-fab hidden" id="fab-usd" title="Agregar USD">💵</button>
    <button class="fab teal-fab hidden" id="fab-debt" title="Registrar deuda">💚</button>
    <button class="fab hidden" id="fab-account" title="Transferir dinero" style="background:linear-gradient(135deg,#60a5fa,#3b82f6);box-shadow:0 8px 32px rgba(96,165,250,.35)">⇄</button>
  `;
  container.innerHTML = html;

  // Setup event listeners
  document.getElementById('fab-ars')?.addEventListener('click', () => {
    if (window.openModal) window.openModal();
  });

  document.getElementById('fab-quick')?.addEventListener('click', () => {
    if (window.openQuickAdd) window.openQuickAdd();
  });

  document.getElementById('fab-usd')?.addEventListener('click', () => {
    if (window.openUsdModal) window.openUsdModal();
  });

  document.getElementById('fab-debt')?.addEventListener('click', () => {
    if (window.openDebtModal) window.openDebtModal();
  });

  document.getElementById('fab-account')?.addEventListener('click', () => {
    if (window.openTransferModal) window.openTransferModal();
  });
}

export function showFabsForTab(tab) {
  const fabArs = document.getElementById('fab-ars');
  const fabQuick = document.getElementById('fab-quick');
  const fabUsd = document.getElementById('fab-usd');
  const fabDebt = document.getElementById('fab-debt');
  const fabAccount = document.getElementById('fab-account');

  const inMain = tab === 'dashboard' || tab === 'lista';
  fabArs?.classList.toggle('hidden', !inMain);
  fabQuick?.classList.toggle('hidden', !inMain);
  fabUsd?.classList.toggle('hidden', tab !== 'usd');
  fabDebt?.classList.toggle('hidden', tab !== 'saldos');
  fabAccount?.classList.toggle('hidden', tab !== 'cuentas');
}
