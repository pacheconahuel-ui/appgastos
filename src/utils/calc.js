import { monthKey, effAmt } from './format.js';

export function calcSummary(mk, expenses) {
  const rows = expenses.filter(e => monthKey(e.date) === mk);
  let ing = 0, pag = 0, real = 0;
  rows.forEach(e => {
    if (e.type === 'Ingreso') {
      ing += e.amount;
    } else {
      pag += e.amount;
      real += effAmt(e);
    }
  });
  return { ing, pag, real, bal: ing - real };
}

export function calcByCat(mk, expenses) {
  const map = {};
  expenses
    .filter(e => monthKey(e.date) === mk && e.type === 'Egreso')
    .forEach(e => {
      map[e.category] = (map[e.category] || 0) + effAmt(e);
    });
  return map;
}

export function personBalance(personId, debts) {
  return debts
    .filter(d => d.personId === personId && !d.settled)
    .reduce((s, d) => s + d.amount, 0);
}

export function personDebtsActive(personId, debts) {
  return debts
    .filter(d => d.personId === personId && !d.settled)
    .sort((a, b) => b.date?.localeCompare(a.date) || b.createdAt - a.createdAt);
}

export function personDebtsSettled(personId, debts) {
  return debts
    .filter(d => d.personId === personId && d.settled)
    .sort((a, b) => b.settledDate?.localeCompare(a.settledDate) || 0);
}

export function allMonths(expenses) {
  const s = new Set(expenses.map(e => monthKey(e.date)).filter(Boolean));
  s.add(new Date().toISOString().slice(0, 7));
  return [...s].sort((a, b) => b.localeCompare(a));
}
