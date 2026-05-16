// Manejo de confirmaciones y borrados
let pendingDel = null;

export function getPendingDel() {
  return pendingDel;
}

export function setPendingDel(value) {
  pendingDel = value;
}

// Mostrar confirmación de borrado
export function showDeleteConfirm(type, id, message) {
  pendingDel = { type, id };
  const el = document.getElementById('conf-txt');
  if (el) el.textContent = message + '\nEsta acción no se puede deshacer.';
  const overlay = document.getElementById('conf-overlay');
  if (overlay) overlay.classList.add('on');
}

// Cerrar diálogo de confirmación
export function closeConfirm() {
  pendingDel = null;
  const overlay = document.getElementById('conf-overlay');
  if (overlay) overlay.classList.remove('on');
}
