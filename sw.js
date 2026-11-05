// Offline support for the website. Upload next to index.html.
// The page: fresh from the network when online, last saved copy when offline.
// Pinned library versions and fonts never change, so they are served from the cache once fetched.
// Supabase (sign-in and data) always goes to the network; offline changes wait on the device and sync when back online.
const C = 'money-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.hostname.endsWith('supabase.co')) return;
  if (r.mode === 'navigate' || u.origin === location.origin) {
    const key = r.mode === 'navigate' ? './' : r;
    e.respondWith(fetch(r).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(C).then(c => c.put(key, cp)); }
      return res;
    }).catch(() => caches.match(key).then(m => m || caches.match('./'))));
    return;
  }
  if (/(^|\.)cdn\.jsdelivr\.net$|^fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) {
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => {
      if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(C).then(c => c.put(r, cp)); }
      return res;
    })));
  }
});
