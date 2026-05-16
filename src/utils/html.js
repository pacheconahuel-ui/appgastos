// Escape HTML para evitar XSS
export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Haptic feedback (vibración mobile)
export function haptic(pattern = [30, 30, 60]) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

// Toast notifications
let toastTimer;
export function toast(msg, ms = 2500) {
  const el = document.getElementById('toast');
  if (!el) return;

  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), ms);
}

// Confirm dialog
export function showConfirm(message, onYes, onNo) {
  const el = document.getElementById('conf-txt');
  if (el) el.textContent = message;

  const overlay = document.getElementById('conf-overlay');
  if (!overlay) return;

  overlay.classList.add('on');

  // Setup buttons
  const btnYes = document.getElementById('btn-conf-yes');
  const btnNo = document.getElementById('btn-conf-no');

  const cleanup = () => {
    overlay.classList.remove('on');
    if (btnYes) btnYes.removeEventListener('click', handleYes);
    if (btnNo) btnNo.removeEventListener('click', handleNo);
  };

  const handleYes = () => {
    cleanup();
    onYes?.();
  };

  const handleNo = () => {
    cleanup();
    onNo?.();
  };

  if (btnYes) {
    btnYes.removeEventListener('click', handleYes);
    btnYes.addEventListener('click', handleYes);
  }

  if (btnNo) {
    btnNo.removeEventListener('click', handleNo);
    btnNo.addEventListener('click', handleNo);
  }
}
