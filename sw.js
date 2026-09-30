var CACHE='hawala-shell-v1';
var SELF_URL=self.location.href.replace(/sw\.js(\?.*)?$/,'hawala-web.html');
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.add(SELF_URL)}).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}));
  }).then(function(){return self.clients.claim()}));
});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var url=new URL(e.request.url);
  if(url.origin!==self.location.origin)return; /* fonts/Firebase/html2canvas CDNs: let the network/browser handle as before */
  e.respondWith(
    fetch(e.request).then(function(res){
      var copy=res.clone();
      caches.open(CACHE).then(function(c){c.put(e.request,copy)});
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(r){return r||caches.match(SELF_URL)});
    })
  );
});
