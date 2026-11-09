/* Service worker ของหน้าแอปฝ่ายโสตฯ: ทำให้ Android ติดตั้งเป็นแอปได้ และเปิดหน้าแรกได้แม้เน็ตหลุด
   ดึงจากเน็ตก่อนเสมอ (แก้ไฟล์บน GitHub แล้วเห็นผลทันที) ถ้าเน็ตไม่มีค่อยใช้ของที่เก็บไว้ */
var CACHE = 'av-shell-v1';
var SHELL = ['./', './index.html', './manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(fetch(req).then(function (res) {
    if (res.ok) {
      var copy = res.clone();
      var nav = req.mode === 'navigate';
      /* หน้าแรกเก็บไว้ใช้ตอนออฟไลน์ (เฉพาะที่ไม่มี ?room= ฯลฯ) */
      if (!nav || !new URL(req.url).search) caches.open(CACHE).then(function (c) { c.put(nav ? './' : req, copy); });
    }
    return res;
  }).catch(function () {
    return (req.mode === 'navigate' ? caches.match('./') : caches.match(req)).then(function (hit) { return hit || caches.match('./index.html'); });
  }));
});
