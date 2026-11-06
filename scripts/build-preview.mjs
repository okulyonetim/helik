/* Tek dosyalık önizleme: ES modülleri file:// ile yüklenmediği için her şeyi tek HTML'e gömer.
 * Kullanım: npm run build:preview  →  dist/aile-oyunlari-onizleme.html */
import {build} from 'esbuild';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';

const kok=new URL('..',import.meta.url).pathname;
const r=await build({entryPoints:[kok+'js/main.js'],bundle:true,format:'iife',write:false,minify:true,target:'es2020',external:['https://*'],legalComments:'none'});
const js=r.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const css=['css/app.css','css/games.css'].map(f=>readFileSync(kok+f,'utf8')).join('\n');
let html=readFileSync(kok+'index.html','utf8');
html=html
  .replace(/<link rel="manifest"[^>]*>\n?/,'')
  .replace(/<link rel="apple-touch-icon"[^>]*>\n?/,'')
  .replace(/<link rel="icon"[^>]*>\n?/,'<link rel="icon" href="data:,">\n')
  .replace(/<link rel="stylesheet" href="css\/app.css">\n?/,()=>`<style>${css}</style>\n`)
  .replace(/<link rel="stylesheet" href="css\/games.css">\n?/,'')
  .replace(/<script type="module" src="js\/main.js"><\/script>/,()=>`<script>${js}</script>`);
mkdirSync(kok+'dist',{recursive:true});
const cikis=kok+'dist/aile-oyunlari-onizleme.html';
writeFileSync(cikis,html);
console.log('yazıldı:',cikis,(html.length/1024).toFixed(0)+' KB');
