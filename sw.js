// Offline support for the website. Upload next to index.html.
// The page: fresh from the network when online (never the browser's 10-minute copy), last saved copy only when offline.
// Pinned library versions and fonts never change, so they are served from the cache once fetched.
// Supabase (sign-in and data) always goes to the network; offline changes wait on the device and sync when back online.
// v2 (2026-11-15): v1 kept one shared copy for every page, so an old test page (8-tab bottom bar) could be shown as the
// real site when the network was slow; the new cache name drops all of that.
const C = 'money-v2';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.hostname.endsWith('supabase.co')) return;
  // the test page always comes from the network and is never stored, so it can't stand in for the real page offline
  if (/test\.html$/.test(u.pathname)) return;
  if (r.mode === 'navigate' || u.origin === location.origin) {
    // the real site is stored under one key whatever address opened it (/money/ or /money/index.html)
    const key = r.mode === 'navigate' ? './' : u.pathname;
    e.respondWith(fetch(r.mode === 'navigate' ? u.origin + u.pathname : r, { cache: 'no-store' }).then(res => {
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
