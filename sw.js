const CACHE='bhaai-shell-v1';
const CORE=['/offline-fallback.html','/logo.jpeg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('bhaai-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET'||new URL(request.url).origin!==self.location.origin)return;
  if(request.mode==='navigate'){
    event.respondWith(fetch(request).then(response=>{
      if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}
      return response;
    }).catch(async()=>{
      const cached=await caches.match(request);
      if(cached)return cached;
      const fallback=await caches.match('/offline-fallback.html');
      if(!fallback)return new Response('You are offline. Please reconnect to access BHAAI PDFs.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
      const target=new URL('/offline-fallback.html',self.location.origin);target.searchParams.set('return',request.url);
      return fetch(target).catch(()=>fallback);
    }));
    return;
  }
  if(CORE.includes(new URL(request.url).pathname)){
    event.respondWith(caches.match(request).then(cached=>cached||fetch(request)));
  }
});
