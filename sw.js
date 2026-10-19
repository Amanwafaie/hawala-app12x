var CACHE='hawala-shell-v3';
var BASE=self.location.href.replace(/sw\.js(\?.*)?$/,'');
var SELF_URL=BASE+'hawala-web.html';
var FB='https://www.gstatic.com/firebasejs/8.10.1/';
var EXTRA=[
  FB+'firebase-app.js',
  FB+'firebase-auth.js',
  FB+'firebase-firestore.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
];

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return c.add(SELF_URL).then(function(){
        return Promise.all(['manifest.webmanifest','icon-192.png','icon-512.png'].map(function(f){return c.add(BASE+f).catch(function(){})}));
      }).then(function(){
        return Promise.all(EXTRA.map(function(u){
          return fetch(new Request(u,{mode:'no-cors'})).then(function(r){return c.put(u,r)}).catch(function(){});
        }));
      });
    }).then(function(){return self.skipWaiting()})
  );
});

self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}));
  }).then(function(){return self.clients.claim()}));
});

function cacheable(url){
  if(url.origin===self.location.origin)return true;
  if(url.hostname==='fonts.googleapis.com'||url.hostname==='fonts.gstatic.com')return true;
  if(url.hostname==='cdnjs.cloudflare.com')return true;
  if(url.hostname==='www.gstatic.com'&&url.pathname.indexOf('/firebasejs/')===0)return true;
  return false;
}

/* اول از حافظهٔ گوشی می‌خواند (سریع و آفلاین)، و پشت صحنه نسخهٔ تازه را می‌گیرد */
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var url=new URL(e.request.url);
  if(!cacheable(url))return;
  e.respondWith(
    caches.match(e.request,{ignoreSearch:true}).then(function(hit){
      var net=fetch(e.request).then(function(res){
        if(res&&(res.ok||res.type==='opaque')&&!res.redirected){
          var copy=res.clone();
          caches.open(CACHE).then(function(c){c.put(e.request,copy)});
        }
        return res;
      }).catch(function(){return null});
      if(hit){e.waitUntil(net);return hit}
      return net.then(function(r){
        if(r)return r;
        if(e.request.mode==='navigate')return caches.match(SELF_URL);
        return Response.error();
      });
    })
  );
});
