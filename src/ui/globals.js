// Expone funciones de modales como globales para legacy.js
import { openModal, saveExpense, closeModal } from '../modals/expense.js';
import { openUsdModal, saveUsdTx, closeUsdModal } from '../modals/usd-modal.js';
import { openDebtModal, closeDebtModal } from '../modals/debt-modal.js';
import { openContactsModal, closeContactsModal } from '../modals/contacts.js';
import { openCatManager, closeCatManager } from '../modals/categories.js';

// Exponer en window para legacy.js
window.openModal = openModal;
window.saveExpense = saveExpense;
window.closeModal = closeModal;

window.openUsdModal = openUsdModal;
window.saveUsdTx = saveUsdTx;
window.closeUsdModal = closeUsdModal;

window.openDebtModal = openDebtModal;
window.closeDebtModal = closeDebtModal;

window.openContactsModal = openContactsModal;
window.closeContactsModal = closeContactsModal;

window.openCatManager = openCatManager;
window.closeCatManager = closeCatManager;

// Funciones globales para operaciones de gastos (llamadas desde HTML inline)
window.editExp = (id, event) => {
  event?.preventDefault();
  const expense = window.expenses?.find(e => e.id === id);
  if (expense) openModal(expense);
};

window.delExp = (id, event) => {
  event?.preventDefault();
  const expense = window.expenses?.find(e => e.id === id);
  if (expense) {
    openModal(expense);
    setTimeout(() => {
      const delBtn = document.getElementById('btn-del-exp');
      if (delBtn) delBtn.click();
    }, 100);
  }
};

// Funciones globales para USD
window.editUsdTx = (id, event) => {
  event?.preventDefault();
  const tx = window.usdTx?.find(t => t.id === id);
  if (tx) openUsdModal(tx);
};

window.delUsdTx = (id, event) => {
  event?.preventDefault();
  const tx = window.usdTx?.find(t => t.id === id);
  if (tx) {
    openUsdModal(tx);
    setTimeout(() => {
      const delBtn = document.getElementById('btn-del-usd');
      if (delBtn) delBtn.click();
    }, 100);
  }
};

// Otros modales (placeholders por ahora)
window.closeSettleModal = () => { const o = document.getElementById('settle-overlay'); if (o) o.classList.remove('on'); };
window.openSettleModal = () => { const o = document.getElementById('settle-overlay'); if (o) o.classList.add('on'); };

window.closeTransferModal = () => { const o = document.getElementById('transfer-overlay'); if (o) o.classList.remove('on'); };
window.openTransferModal = () => { const o = document.getElementById('transfer-overlay'); if (o) o.classList.add('on'); };

window.closeAccountModal = () => { const o = document.getElementById('account-overlay'); if (o) o.classList.remove('on'); };
window.openAccountModal = () => { const o = document.getElementById('account-overlay'); if (o) o.classList.add('on'); };

window.closeGoalModal = () => { const o = document.getElementById('goal-overlay'); if (o) o.classList.remove('on'); };
window.openGoalModal = () => { const o = document.getElementById('goal-overlay'); if (o) o.classList.add('on'); };

window.closeBudgetModal = () => { const o = document.getElementById('budget-overlay'); if (o) o.classList.remove('on'); };
window.openBudgetModal = () => { const o = document.getElementById('budget-overlay'); if (o) o.classList.add('on'); };

window.closeQuickAdd = () => { const o = document.getElementById('quick-add-overlay'); if (o) o.classList.remove('on'); };
window.openQuickAdd = () => { const o = document.getElementById('quick-add-overlay'); if (o) o.classList.add('on'); };

window.closeGlobalSearch = () => { const o = document.getElementById('gsearch-overlay'); if (o) o.classList.remove('on'); };
window.openGlobalSearch = () => { const o = document.getElementById('gsearch-overlay'); if (o) o.classList.add('on'); };

console.log('[Globals] Funciones expuestas en window');
