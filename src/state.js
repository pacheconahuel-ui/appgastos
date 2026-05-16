// Estado global de la aplicación
export const state = {
  // Auth
  currentUID: null,
  currentUser: null,
  isLoggedIn: false,

  // Datos principales
  expenses: [],
  usdTx: [],
  debts: [],
  persons: [],
  categories: [],
  accounts: [],
  transfers: [],
  budgets: {},
  goals: [],

  // UI
  activeTab: 'dashboard',
  fbOnline: false,
  fbReady: false,
  isDarkMode: true,

  // Control
  skipNextArs: false,
  skipNextUsd: false,
  skipNextDebt: false,
};

// Observer para cambios en estado
let observers = [];

export function subscribe(callback) {
  observers.push(callback);
  return () => {
    observers = observers.filter(cb => cb !== callback);
  };
}

export function notify(key) {
  observers.forEach(cb => cb(key, state[key]));
}

// Método para actualizar estado
export function updateState(updates) {
  Object.assign(state, updates);
  Object.keys(updates).forEach(key => notify(key));
}
