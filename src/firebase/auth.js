import { auth } from './init.js';
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  signOut,
} from 'firebase/auth';
import { updateState } from '../state.js';

let isRegisterMode = false;

export async function loginGoogle() {
  try {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
    console.log('[Auth] Google login exitoso');
  } catch (e) {
    showLoginError(e.message);
  }
}

export async function loginEmail() {
  const email = document.getElementById('login-email').value.trim();
  const pass = document.getElementById('login-pass').value;

  if (!email || !pass) {
    showLoginError('Completá email y contraseña');
    return;
  }

  try {
    if (isRegisterMode) {
      await createUserWithEmailAndPassword(auth, email, pass);
      console.log('[Auth] Cuenta creada');
    } else {
      await signInWithEmailAndPassword(auth, email, pass);
      console.log('[Auth] Email login exitoso');
    }
  } catch (e) {
    showLoginError(e.message);
  }
}

export async function sendMagicLink() {
  const email = document.getElementById('login-email').value.trim();
  if (!email) {
    showLoginError('Escribí tu email primero.');
    return;
  }

  try {
    const url = window.location.href;
    await sendSignInLinkToEmail(auth, email, { url, handleCodeInApp: true });
    localStorage.setItem('gp_magic_email', email);
    document.getElementById('magic-link-sent').style.display = 'block';
    document.getElementById('login-err').textContent = '';
    console.log('[Auth] Magic link enviado');
  } catch (e) {
    showLoginError(e.message);
  }
}

export function checkMagicLink() {
  if (!signInWithEmailLink || !window.location.href.includes('oobCode')) return;

  let email = localStorage.getItem('gp_magic_email');
  if (!email) email = prompt('Confirma tu email:');

  if (email) {
    signInWithEmailLink(auth, email, window.location.href)
      .then(() => {
        localStorage.removeItem('gp_magic_email');
        window.history.replaceState({}, '', window.location.pathname);
        console.log('[Auth] Magic link verificado');
      })
      .catch(e => console.warn('Magic link error:', e));
  }
}

export function toggleRegisterMode() {
  isRegisterMode = !isRegisterMode;
  const btn = document.getElementById('btn-email-action');
  const toggle = document.getElementById('toggle-txt');
  if (btn) btn.textContent = isRegisterMode ? 'Crear cuenta' : 'Iniciar sesión';
  if (toggle) toggle.textContent = isRegisterMode ? 'Volver a login' : 'Registrarse';
}

export async function doLogout() {
  try {
    await signOut(auth);
    console.log('[Auth] Sesión cerrada');
    location.reload();
  } catch (e) {
    console.error('Logout error:', e);
  }
}

function showLoginError(msg) {
  const el = document.getElementById('login-err');
  if (el) el.textContent = msg;
}

// Setup auth button listeners
export function setupAuthListeners() {
  const btnGoogle = document.getElementById('btn-google');
  const btnEmail = document.getElementById('btn-email-action');
  const btnMagic = document.getElementById('btn-magic-link');
  const btnToggle = document.getElementById('btn-toggle-register');

  if (btnGoogle) btnGoogle.addEventListener('click', loginGoogle);
  if (btnEmail) btnEmail.addEventListener('click', loginEmail);
  if (btnMagic) btnMagic.addEventListener('click', sendMagicLink);
  if (btnToggle) btnToggle.addEventListener('click', toggleRegisterMode);

  // Magic link check
  checkMagicLink();
}
