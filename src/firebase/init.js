import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { FB_CONFIG } from '../config.js';

// Inicializar Firebase
const app = initializeApp(FB_CONFIG);

// Servicios
export const auth = getAuth(app);
export const db = getDatabase(app);

console.log('[Firebase] Inicializado correctamente');
