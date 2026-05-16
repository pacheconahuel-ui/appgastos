import { LS_KEYS } from '../config.js';

// Helper para crear clave única por usuario
export function lsKey(key, uid) {
  return uid ? `${key}_${uid}` : key;
}

// Guardar gastos ARS
export function saveArs(expenses, uid) {
  try {
    localStorage.setItem(lsKey(LS_KEYS.EXPENSES, uid), JSON.stringify(expenses));
  } catch (e) {
    console.warn('Error saving ARS:', e);
  }
}

// Cargar gastos ARS
export function loadArs(uid) {
  try {
    return JSON.parse(localStorage.getItem(lsKey(LS_KEYS.EXPENSES, uid))) || [];
  } catch {
    return [];
  }
}

// Guardar USD
export function saveUsd(usdTx, uid) {
  try {
    localStorage.setItem(lsKey(LS_KEYS.USD_TX, uid), JSON.stringify(usdTx));
  } catch (e) {
    console.warn('Error saving USD:', e);
  }
}

// Cargar USD
export function loadUsd(uid) {
  try {
    return JSON.parse(localStorage.getItem(lsKey(LS_KEYS.USD_TX, uid))) || [];
  } catch {
    return [];
  }
}

// Guardar deudas
export function saveDebts(debts, uid) {
  try {
    localStorage.setItem(lsKey(LS_KEYS.DEBTS, uid), JSON.stringify(debts));
  } catch (e) {
    console.warn('Error saving debts:', e);
  }
}

// Cargar deudas
export function loadDebts(uid) {
  try {
    return JSON.parse(localStorage.getItem(lsKey(LS_KEYS.DEBTS, uid))) || [];
  } catch {
    return [];
  }
}

// Guardar contactos
export function savePersons(persons, uid) {
  try {
    localStorage.setItem(lsKey(LS_KEYS.PERSONS, uid), JSON.stringify(persons));
  } catch (e) {
    console.warn('Error saving persons:', e);
  }
}

// Cargar contactos
export function loadPersons(uid) {
  try {
    return JSON.parse(localStorage.getItem(lsKey(LS_KEYS.PERSONS, uid))) || [];
  } catch {
    return [];
  }
}

// Guardar categorías
export function saveCats(cats, uid) {
  try {
    localStorage.setItem(lsKey(LS_KEYS.CATEGORIES, uid), JSON.stringify(cats));
  } catch (e) {
    console.warn('Error saving cats:', e);
  }
}

// Cargar categorías
export function loadCats(uid) {
  try {
    return JSON.parse(localStorage.getItem(lsKey(LS_KEYS.CATEGORIES, uid))) || [];
  } catch {
    return [];
  }
}

// Billeteras
export function loadAccounts() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.ACCOUNTS)) || [];
  } catch {
    return [];
  }
}

export function saveAccounts(accounts) {
  try {
    localStorage.setItem(LS_KEYS.ACCOUNTS, JSON.stringify(accounts));
  } catch (e) {
    console.warn('Error saving accounts:', e);
  }
}

// Transferencias
export function loadTransfers() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.TRANSFERS)) || [];
  } catch {
    return [];
  }
}

export function saveTransfers(transfers) {
  try {
    localStorage.setItem(LS_KEYS.TRANSFERS, JSON.stringify(transfers));
  } catch (e) {
    console.warn('Error saving transfers:', e);
  }
}

// Presupuestos
export function loadBudgets() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.BUDGETS)) || {};
  } catch {
    return {};
  }
}

export function saveBudgets(budgets) {
  try {
    localStorage.setItem(LS_KEYS.BUDGETS, JSON.stringify(budgets));
  } catch (e) {
    console.warn('Error saving budgets:', e);
  }
}

// Metas
export function loadGoals() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.GOALS)) || [];
  } catch {
    return [];
  }
}

export function saveGoals(goals) {
  try {
    localStorage.setItem(LS_KEYS.GOALS, JSON.stringify(goals));
  } catch (e) {
    console.warn('Error saving goals:', e);
  }
}
