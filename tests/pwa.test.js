import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {dosyaListesi} from '../scripts/sw-uret.mjs';

const oku=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');

test('service worker: bütün uygulama dosyaları önbellek listesinde (eksikse `npm run sw`)',()=>{
  const sw=oku('service-worker.js');
  const blok=sw.slice(sw.indexOf('/*LISTE-BASLA*/'),sw.indexOf('/*LISTE-BITIS*/'));
  const listede=new Set([...blok.matchAll(/'([^']+)'/g)].map(m=>m[1]));
  for(const f of dosyaListesi())assert.ok(listede.has(f),'service-worker.js listesinde yok: '+f);
  for(const f of listede)assert.ok(existsSync(new URL('../'+f,import.meta.url)),'listedeki dosya yok: '+f);
});

test('manifest: gerekli alanlar ve simgeler mevcut',()=>{
  const m=JSON.parse(oku('manifest.webmanifest'));
  assert.equal(m.display,'standalone');assert.ok(m.start_url&&m.name&&m.short_name);
  assert.ok(m.icons.some(i=>i.sizes==='192x192')&&m.icons.some(i=>i.sizes==='512x512')&&m.icons.some(i=>i.purpose==='maskable'));
  for(const i of m.icons)assert.ok(existsSync(new URL('../'+i.src,import.meta.url)),'simge yok: '+i.src);
});

test('index.html: bağlı dosyalar var',()=>{
  const h=oku('index.html');
  for(const m of h.matchAll(/(?:href|src)="([^"#]+)"/g))if(!/^https?:/.test(m[1]))assert.ok(existsSync(new URL('../'+m[1],import.meta.url)),'yok: '+m[1]);
});

test('veritabanı kuralları: geçerli JSON, varsayılan kapalı, odalar kimlik ister',()=>{
  const k=JSON.parse(oku('database.rules.json')).rules;
  assert.equal(k['.read'],false);assert.equal(k['.write'],false);
  const oda=k.rooms.$kod;
  assert.ok(/auth != null/.test(oda.meta['.read']));
  assert.ok(/players/.test(oda.state['.read']),'durumu yalnızca oda üyeleri okur');
  assert.ok(/auth\.uid === \$uid/.test(oda.players.$uid['.write']),'herkes yalnız kendi oyuncu kaydını yazar');
});
