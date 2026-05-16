// Prepara el contexto global para legacy.js
// TODO: Gradualmente reemplazar estas con módulos ES6

// Variables globales
window.expenses = [];
window.usdTx = [];
window.debts = [];
window.persons = [];
window.cats = [];
window.accounts = [];
window.transfers = [];
window.budgets = {};
window.goals = [];
window.activeTab = 'dashboard';
window.currentUID = null;
window.fbOnline = false;
window.fbReady = false;
window.chart = null;
window.monthlyChart = null;
window.tcChart = null;

// Categorías predefinidas
window.DEF_CATS = ['Comida', 'Transporte', 'Entretenimiento', 'Trabajo', 'Casa', 'Salud', 'Otro'];
window.ICONS = {
  'Comida': '🍽️',
  'Transporte': '🚗',
  'Entretenimiento': '🎮',
  'Trabajo': '💼',
  'Casa': '🏠',
  'Salud': '⚕️',
  'Otro': '📌',
};

// LocalStorage key helper
window.lsKey = (key) => `${key}_${window.currentUID || 'anon'}`;

console.log('[Bootstrap] Variables globales inicializadas');
