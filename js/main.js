import {baslat} from './core/app.js';

baslat();

/* Çevrimdışı çalışma: yalnızca http(s) üzerinde (dosyadan açılışta atlanır) */
if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
  addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(()=>{}));
}
