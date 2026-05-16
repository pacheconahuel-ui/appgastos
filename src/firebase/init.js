import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { FB_CONFIG } from '../config.js';

// Reusar app existente si el compat SDK ya la inicializó
const app = getApps().length ? getApp() : initializeApp(FB_CONFIG);

// Servicios
export const auth = getAuth(app);
export const db = getDatabase(app);

console.log('[Firebase] Inicializado correctamente');
