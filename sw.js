const CACHE = 'gastos-v4';
const ASSETS = [
  '/AppGastos/',
  '/AppGastos/index.html',
  '/AppGastos/icons/icon-192.png',
  '/AppGastos/icons/icon-512.png',
  '/AppGastos/icons/icon-maskable-512.png',
  '/AppGastos/icons/apple-touch-icon.png',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.0/firebase-database-compat.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => {
      // Cache what we can, ignore failures for CDN assets
      return Promise.allSettled(ASSETS.map(url => c.add(url).catch(() => {})));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Mensaje desde la app para mostrar notificación
self.addEventListener('message', e => {
  if (e.data?.type === 'SHOW_NOTIF') {
    self.registration.showNotification(e.data.title, {
      body: e.data.body,
      icon: '/AppGastos/icons/icon-192.png',
      badge: '/AppGastos/icons/icon-192.png',
      tag: e.data.tag || 'gastos-notif',
      vibrate: [100, 50, 100],
      data: { url: '/AppGastos/' }
    });
  }
});

// Click en notificación → abrir/enfocar la app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const appClient = list.find(c => c.url.includes('/AppGastos'));
      if (appClient) return appClient.focus();
      return clients.openWindow('/AppGastos/');
    })
  );
});

self.addEventListener('fetch', e => {
  // Firebase / auth requests — always go to network
  if (e.request.url.includes('firebase') || e.request.url.includes('googleapis.com/identitytoolkit')) {
    return;
  }
  // HTML navigation — network first so updates are always picked up
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Static assets — cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (e.request.method === 'GET' && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
