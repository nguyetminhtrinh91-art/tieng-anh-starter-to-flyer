// Đổi số phiên bản này (v1 -> v2 -> ...) mỗi khi bạn cập nhật nội dung
// index.html, để trình duyệt tải lại bản mới thay vì dùng bản cache cũ.
const CACHE_VERSION = 'v1';
const CACHE_NAME = 'dao-tieng-anh-' + CACHE_VERSION;

// Các file cốt lõi được cache ngay khi cài đặt (đường dẫn tương đối
// so với vị trí của service-worker.js, để chạy đúng cả khi web nằm
// trong thư mục con như username.github.io/ten-repo/).
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-192-maskable.png',
  './icons/icon-512-maskable.png',
  './icons/apple-touch-icon.png',
  './icons/favicon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names
        .filter((name) => name.startsWith('dao-tieng-anh-') && name !== CACHE_NAME)
        .map((name) => caches.delete(name))
    )).then(() => self.clients.claim())
  );
});

// Chiến lược: network-first cho điều hướng trang (để luôn thử lấy bản mới
// nhất khi có mạng), cache-first cho các tài nguyên tĩnh khác; luôn có
// bản cache để dùng offline khi không có mạng.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const isNavigation = request.mode === 'navigate';

  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
