// Service worker for the installed app.
// It caches NOTHING (so employees always get the latest version); it only shows a friendly
// Hebrew page instead of the browser's error screen when the phone has no internet.
const OFFLINE_PAGE = `<!doctype html>
<html lang="he" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TSK - אין חיבור</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#F4F7FB;
       font-family:system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:#1F2937;text-align:center;padding:24px;box-sizing:border-box}
  .card{background:#fff;border-radius:24px;padding:32px 24px;max-width:340px;box-shadow:0 4px 16px rgba(16,24,40,.08)}
  img{height:72px;margin-bottom:16px}
  h1{font-size:22px;margin:0 0 8px}
  p{color:#6B7280;margin:0 0 20px;line-height:1.5}
  button{background:#254E7B;color:#fff;border:0;border-radius:14px;padding:14px 28px;font-size:16px;font-weight:600}
</style></head>
<body><div class="card">
  <img src="/icons/icon-192.png" alt="TSK">
  <h1>אין חיבור לאינטרנט</h1>
  <p>בדקו את החיבור ונסו שוב.</p>
  <button onclick="location.reload()">נסו שוב</button>
</div></body></html>`;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open('tsk-offline').then((cache) => cache.add('/icons/icon-192.png')));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(
        () => new Response(OFFLINE_PAGE, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
      )
    );
  } else if (request.url.endsWith('/icons/icon-192.png')) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
  }
});
