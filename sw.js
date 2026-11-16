/* 알림 받기용 서비스 워커 (화면을 저장해 두지 않고, 알림만 처리해요) */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
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
