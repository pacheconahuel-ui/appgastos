import { LOCALE, CURRENCY, USD_CURRENCY } from '../config.js';

// Formato dinero ARS
export function fmt(n) {
  return CURRENCY + Math.round(Math.abs(n)).toLocaleString(LOCALE);
}

// Formato dinero USD
export function fmtU(n) {
  return USD_CURRENCY + ' ' + (Math.round(n * 100) / 100).toLocaleString(LOCALE);
}

// Formato tipo de cambio
export function fmtTC(n) {
  return CURRENCY + Math.round(n).toLocaleString(LOCALE);
}

// Formato fecha DD/MM
export function fmtDate(d) {
  if (!d) return '';
  const [, m, day] = d.split('-');
  return `${day}/${m}`;
}

// Clave mes (YYYY-MM)
export function monthKey(d) {
  return d ? d.slice(0, 7) : '';
}

// Mes actual (YYYY-MM)
export function nowKey() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
}

// Etiqueta mes legible
export function monthLabel(mk) {
  if (!mk) return '';
  const [y, m] = mk.split('-');
  const N = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return `${N[parseInt(m) - 1]} ${y}`;
}

// Escape HTML
export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ID único
export function newId() {
  return String(Date.now()) + Math.random().toString(36).slice(2, 6);
}

// Calcula la cantidad real de un gasto (si fue dividido)
export function effAmt(e) {
  return e.myAmount != null ? e.myAmount : (e.shared ? e.amount * (e.sharedPercent / 100) : e.amount);
}
