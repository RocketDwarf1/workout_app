/* Offline support. Only the app's own files are cached here; saved progress lives in the phone's local storage,
   which this worker never reads, changes or deletes, so updating the app keeps every entry. */
const VERSION = 'u6-app-9b9f8207b2';
const FILES = ["./", "index.html", "manifest.webmanifest", "icons/apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "fonts/barlow-condensed-latin-600-normal.woff2", "fonts/barlow-condensed-latin-700-normal.woff2", "fonts/barlow-latin-400-normal.woff2", "fonts/barlow-latin-500-normal.woff2", "fonts/barlow-latin-600-normal.woff2", "fonts/ibm-plex-mono-latin-500-normal.woff2"];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('u6-app-') && k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, url = new URL(r.url);
  if (r.method !== 'GET' || url.origin !== location.origin) return;
  if (r.mode === 'navigate') {
    /* newest version when online (gives up after 3 s), the saved copy when offline */
    e.respondWith(new Promise(resolve => {
      let done = false; const fallback = () => caches.match('index.html').then(hit => { if (!done) { done = true; resolve(hit || Response.error()); } });
      const t = setTimeout(fallback, 3000);
      fetch(r).then(res => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put('index.html', copy)); } if (!done) { done = true; clearTimeout(t); resolve(res); } }).catch(() => { clearTimeout(t); fallback(); });
    }));
    return;
  }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r)));
});
