import '/src/styles/main.css';
import { auth, db } from './firebase/init.js';
import { state, updateState } from './state.js';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, onValue } from 'firebase/database';

console.log('[App] Iniciando Mis Gastos...');

// Theme toggle
const btnTheme = document.getElementById('btn-theme');
if (btnTheme) {
  btnTheme.addEventListener('click', () => {
    const light = document.body.classList.toggle('light');
    btnTheme.textContent = light ? '☀️' : '🌙';
    localStorage.setItem('gp_theme', light ? 'light' : 'dark');
  });
}

// Load theme from localStorage
function loadTheme() {
  const t = localStorage.getItem('gp_theme');
  if (t === 'light') {
    document.body.classList.add('light');
    if (btnTheme) btnTheme.textContent = '☀️';
  }
}

// Logout
const btnLogout = document.getElementById('btn-logout');
if (btnLogout) {
  btnLogout.addEventListener('click', async () => {
    if (confirm('¿Cerrar sesión?')) {
      await signOut(auth);
      location.reload();
    }
  });
}

// Auth listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log('[Auth] Usuario:', user.email);
    updateState({
      currentUID: user.uid,
      currentUser: user,
      isLoggedIn: true,
    });
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    // Cargar datos del usuario
    loadUserData(user.uid);
  } else {
    console.log('[Auth] Sin usuario');
    updateState({
      currentUID: null,
      currentUser: null,
      isLoggedIn: false,
    });
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
  }
});

// Cargar datos del usuario desde Firebase
function loadUserData(uid) {
  console.log('[Data] Cargando datos para:', uid);

  // Listener para gastos ARS
  onValue(ref(db, `usuarios/${uid}/gastos`), (snapshot) => {
    const data = snapshot.val();
    const expenses = data ? Object.values(data).filter(e => e && e.id) : [];
    updateState({ expenses });
    console.log('[Data] Gastos:', expenses.length);
  });

  // Listener para transacciones USD
  onValue(ref(db, `usuarios/${uid}/usd`), (snapshot) => {
    const data = snapshot.val();
    const usdTx = data ? Object.values(data).filter(t => t && t.id) : [];
    updateState({ usdTx });
    console.log('[Data] USD:', usdTx.length);
  });

  // Listener para deudas
  onValue(ref(db, `usuarios/${uid}/debts`), (snapshot) => {
    const data = snapshot.val();
    const debts = data ? Object.values(data).filter(d => d && d.id) : [];
    updateState({ debts });
    console.log('[Data] Deudas:', debts.length);
  });
}

// Firebase connection status
onValue(ref(db, '.info/connected'), (snapshot) => {
  const online = !!snapshot.val();
  updateState({ fbOnline: online });
  const pill = document.getElementById('sync-pill');
  if (pill) {
    pill.className = online ? 'sync-pill online' : 'sync-pill offline';
    document.getElementById('sync-label').textContent = online ? '● En línea' : '⚠ Offline';
  }
});

// Initialize theme
loadTheme();

console.log('[App] Listo ✅');
