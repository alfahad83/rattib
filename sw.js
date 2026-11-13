// Service worker: يخلي واجهة التطبيق تفتح بسرعة وحتى بدون إنترنت.
// البيانات (Firebase) دايمًا تنجاب من الشبكة.
const CACHE = 'rattib-v5';
const SHELL = [
  './', './index.html', './business.html', './css/style.css',
  './js/app.js', './js/motion.js', './js/business.js', './js/store.js', './js/common.js', './js/config.js', './js/seed.js',
  './manifest.webmanifest', './icons/icon.svg', './icons/icon-192.png', './icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// الشبكة أولًا، وإذا ما فيه إنترنت نرجع للنسخة المحفوظة
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
