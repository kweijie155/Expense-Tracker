// Pocket Ledger offline support. Your entries live in this phone's storage, never in this file or online.
const VERSION = 'pocket-ledger-f7f0e2f684';
const SHELL = ["./", "manifest.webmanifest", "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png", "google-sheets-script.txt", "fonts/manrope-vietnamese-wght-normal.woff2", "fonts/manrope-latin-ext-wght-normal.woff2", "fonts/manrope-latin-wght-normal.woff2"];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// Open instantly from the saved copy and refresh it in the background,
// so a new version shows up the next time the app is opened.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const key = req.mode === 'navigate' ? './' : req;
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const saved = await cache.match(key, { ignoreSearch: true });
    const update = fetch(req).then((res) => {
      if (res && res.ok && !res.redirected) cache.put(key, res.clone());
      return res;
    });
    if (saved) {
      event.waitUntil(update.catch(() => {}));
      return saved;
    }
    return update.catch(() => cache.match('./'));
  })());
});
