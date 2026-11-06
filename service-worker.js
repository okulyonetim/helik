/* Çevrimdışı çalışma: önce ağ (güncel dosyalar), ağ yoksa önbellek. Önbellek listesi `npm run sw` ile güncellenir. */
const SURUM='aile-c744587e';
const DOSYALAR=[
  /*LISTE-BASLA*/
  'css/app.css',
  'css/games.css',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'icons/icon.svg',
  'index.html',
  'js/config.js',
  'js/core/app.js',
  'js/core/db-firebase.js',
  'js/core/db-memory.js',
  'js/core/profile.js',
  'js/core/room.js',
  'js/core/ui.js',
  'js/core/util.js',
  'js/games/adamasmaca.js',
  'js/games/adamasmaca.view.js',
  'js/games/bilgi.js',
  'js/games/bilgi.view.js',
  'js/games/boyama.js',
  'js/games/boyama.view.js',
  'js/games/cengel.js',
  'js/games/cengel.mantik.js',
  'js/games/cengel.view.js',
  'js/games/hafiza.js',
  'js/games/hafiza.view.js',
  'js/games/index.js',
  'js/games/isimsehir.js',
  'js/games/isimsehir.puan.js',
  'js/games/isimsehir.view.js',
  'js/games/kelime.js',
  'js/games/kelime.sozluk.js',
  'js/games/kelime.view.js',
  'js/games/veri/boyama-sayfalari.js',
  'js/games/veri/cengel-bulmacalar.js',
  'js/games/veri/isimsehir.js',
  'js/games/veri/kelimeler.js',
  'js/games/veri/sahneler.js',
  'js/games/veri/sorular.js',
  'js/games/veri/tr-sozluk.js',
  'js/games/yapboz.js',
  'js/games/yapboz.view.js',
  'js/main.js',
  'manifest.webmanifest'
  /*LISTE-BITIS*/
];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(SURUM).then(c=>c.addAll(DOSYALAR.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==SURUM).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin!==location.origin)return; // Firebase ve diğer dış istekler doğrudan ağdan
  e.respondWith(
    fetch(r,{cache:'no-cache'}).then(res=>{
      if(res.ok&&res.type==='basic'){const kopya=res.clone();caches.open(SURUM).then(c=>c.put(r,kopya))}
      return res;
    }).catch(()=>caches.match(r,{ignoreSearch:true}).then(x=>x||(r.mode==='navigate'?caches.match('index.html'):Response.error())))
  );
});
