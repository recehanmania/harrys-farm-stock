// V144 no-cache service worker. Paksa web ambil file terbaru dari Vercel.
self.addEventListener("install", function(e){ self.skipWaiting(); });
self.addEventListener("activate", function(e){ e.waitUntil((async function(){
  if(self.caches){ const names = await caches.keys(); await Promise.all(names.map(n=>caches.delete(n))); }
  await self.clients.claim();
})()); });
self.addEventListener("fetch", function(e){
  e.respondWith(fetch(e.request, {cache:"no-store"}).catch(function(){ return fetch(e.request); }));
});
