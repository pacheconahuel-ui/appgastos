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

// Otros modales
window.closeSettleModal = () => console.log('[Settle Modal] Cerrar');
window.closeTransferModal = () => console.log('[Transfer Modal] Cerrar');
window.closeAccountModal = () => console.log('[Account Modal] Cerrar');
window.closeGoalModal = () => console.log('[Goal Modal] Cerrar');
window.closeBudgetModal = () => console.log('[Budget Modal] Cerrar');
window.closeAddContactModal = () => console.log('[Add Contact Modal] Cerrar');
window.closeQuickAdd = () => console.log('[Quick Add Modal] Cerrar');
window.closeGlobalSearch = () => console.log('[Global Search] Cerrar');

console.log('[Globals] Funciones expuestas en window');
