// Íconos predefinidos por categoría
const ICONS = {
  'Comida': '🍽️',
  'Transporte': '🚗',
  'Entretenimiento': '🎮',
  'Trabajo': '💼',
  'Casa': '🏠',
  'Salud': '⚕️',
  'Otro': '📌',
};

// Categorías predefinidas
export const DEF_CATS = Object.keys(ICONS);

// Cargar overrides de usuario desde localStorage
function loadIconOverrides() {
  try {
    return JSON.parse(localStorage.getItem('gp_icons_v1')) || {};
  } catch {
    return {};
  }
}

// Guardar overrides de usuario
function saveIconOverrides(map) {
  try {
    localStorage.setItem('gp_icons_v1', JSON.stringify(map));
  } catch (e) {
    console.warn('Error saving icon overrides:', e);
  }
}

// Obtener ícono de una categoría (con override)
export function icon(cat) {
  const overrides = loadIconOverrides();
  return overrides[cat] || ICONS[cat] || '📌';
}

// Editar ícono de categoría
export function editCatIcon(catName) {
  const current = icon(catName);
  const newIco = prompt(`Cambiar ícono de "${catName}"\nActual: ${current}\n\nPegá un emoji nuevo:`, current);
  if (!newIco?.trim() || newIco.trim() === current) return;

  const t = newIco.trim();
  const ov = loadIconOverrides();
  ov[catName] = t;
  saveIconOverrides(ov);

  // Notify that icons changed
  if (window.renderAll) window.renderAll();
}

// Obtener categorías custom (no predefinidas)
export function customCats(cats) {
  return cats.filter(c => !DEF_CATS.includes(c));
}
