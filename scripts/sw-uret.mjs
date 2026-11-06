/* service-worker.js içindeki önbellek listesini ve sürüm damgasını günceller.
 * Kullanım: npm run sw   (dosya ekleyip sildikten sonra ya da yayına çıkmadan önce) */
import {readFileSync,writeFileSync,readdirSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join} from 'node:path';

const kok=new URL('..',import.meta.url).pathname;
const tara=(d)=>readdirSync(join(kok,d)).flatMap(a=>{
  const y=join(d,a);return statSync(join(kok,y)).isDirectory()?tara(y):[y];
});
export function dosyaListesi(){
  return['index.html','manifest.webmanifest',...tara('css'),...tara('js'),...tara('icons')]
    .map(x=>x.split('\\').join('/')).sort();
}
export function guncelle(){
  const liste=dosyaListesi();
  const h=createHash('sha1');
  for(const f of liste)h.update(f).update(readFileSync(join(kok,f)));
  const surum='aile-'+h.digest('hex').slice(0,8);
  const yol=join(kok,'service-worker.js');
  let s=readFileSync(yol,'utf8');
  s=s.replace(/const SURUM='[^']*';/,`const SURUM='${surum}';`);
  s=s.replace(/\/\*LISTE-BASLA\*\/[\s\S]*?\/\*LISTE-BITIS\*\//,`/*LISTE-BASLA*/\n${liste.map(f=>`  '${f}'`).join(',\n')}\n  /*LISTE-BITIS*/`);
  writeFileSync(yol,s);
  return{surum,adet:liste.length};
}
if(import.meta.url===`file://${process.argv[1]}`){const r=guncelle();console.log('service-worker.js güncellendi:',r.surum,r.adet+' dosya')}
