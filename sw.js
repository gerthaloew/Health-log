/* 서비스 워커: 알림 처리 + 앱 파일을 기기에 저장해 두었다가 연결이 불안정할 때 대신 열어줘요
   (식사·운동 같은 기록 데이터는 저장하지 않고, 항상 서버에서 최신으로 받아요) */
const SHELL='shell-v1',RUN='run-v1',PRE=['./','index.html','manifest.webmanifest','icon-192.png','apple-touch-icon.png'],
EXT=['cdn.jsdelivr.net','unpkg.com','fonts.googleapis.com','fonts.gstatic.com'];
self.addEventListener('install',e=>{self.skipWaiting();
  e.waitUntil(caches.open(SHELL).then(c=>Promise.all(PRE.map(u=>c.add(new Request(u,{cache:'reload'})).catch(()=>{})))))});
self.addEventListener('activate',e=>e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k!==SHELL&&k!==RUN)await caches.delete(k);
  await self.clients.claim()})()));
const put=async(name,req,res)=>{try{if(res&&(res.ok||res.type==='opaque')){const c=await caches.open(name);
  const u=new URL(req.url);if(u.origin===location.origin){for(const k of await c.keys()){const x=new URL(k.url);if(x.pathname===u.pathname&&x.search!==u.search)await c.delete(k)}}
  await c.put(req,res.clone())}}catch(_){}return res};
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  if(r.mode==='navigate'&&u.origin===location.origin){
    e.respondWith((async()=>{const ac=new AbortController(),t=setTimeout(()=>ac.abort(),4500);
      try{const res=await fetch(r,{signal:ac.signal,cache:"no-cache"});clearTimeout(t);return put(SHELL,new Request(u.pathname.endsWith('/')?'./':u.pathname.split('/').pop()||'./'),res)}
      catch(_){clearTimeout(t);return (await caches.match(r,{ignoreSearch:true}))||(await caches.match('index.html'))||(await caches.match('./'))||Response.error()}})());return}
  if(u.origin===location.origin||EXT.includes(u.hostname)){
    e.respondWith((async()=>{const hit=await caches.match(r);
      const net=fetch(r).then(res=>put(RUN,r,res)).catch(()=>null);
      if(hit){net.catch(()=>{});return hit}
      return (await net)||Response.error()})())}});
self.addEventListener('push',e=>{
  let d={};try{d=e.data?e.data.json():{}}catch(_){}
  e.waitUntil(self.registration.showNotification(d.title||'건강 기록',{
    body:d.body||'',icon:'icon-192.png',badge:'icon-192.png',data:{url:d.url||'./'}
  }));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const url=new URL((e.notification.data&&e.notification.data.url)||'./',self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{
    for(const c of list){if('focus' in c){return c.focus().then(w=>{try{w.navigate(url)}catch(_){}return w})}}
    return self.clients.openWindow(url);
  }));
});
