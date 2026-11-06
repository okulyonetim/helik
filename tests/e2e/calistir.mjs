/* İki/üç istemcili uçtan uca deneme (isteğe bağlı geliştirici aracı).
 * Kurulum:  npm i --no-save puppeteer-core     (ve bilgisayarda Chrome)
 * Çalıştırma:  npm run serve   (başka bir terminalde)  →  node tests/e2e/calistir.mjs [oyun]
 * Ekran görüntüleri e2e-cikti/ klasörüne yazılır. */
import puppeteer from 'puppeteer-core';
import {mkdirSync} from 'node:fs';

const URL=process.env.URL||'http://localhost:8080/tests/e2e/harness.html';
const CHROME=process.env.CHROME||'/usr/bin/google-chrome';
const CIKTI='e2e-cikti';mkdirSync(CIKTI,{recursive:true});
const bekle=ms=>new Promise(r=>setTimeout(r,ms));
const hatalar=[];
let sonuc={gecen:0,kalan:[]};
const ok=(kosul,ad)=>{if(kosul)sonuc.gecen++;else{sonuc.kalan.push(ad);console.log('  ✗',ad)}};

async function oturum(){
  const b=await puppeteer.launch({executablePath:CHROME,args:['--no-sandbox'],headless:'new'});
  const p=await b.newPage();
  await p.setViewport({width:1220,height:870,deviceScaleFactor:1});
  p.on('pageerror',e=>hatalar.push('PAGEERR '+e.message));
  p.on('console',m=>{if(m.type()==='error')hatalar.push('CONSOLE '+m.text())});
  await p.goto(URL,{waitUntil:'load'});
  await bekle(600);
  const fr=[0,1,2].map(i=>p.frames().find(f=>f.url().includes('u='+i)));
  for(const f of fr)await f.waitForFunction(()=>window.hazir,{timeout:5000});
  return{b,p,fr};
}
const goster=(f,sel)=>f.$eval(sel,e=>e.innerText).catch(()=>null);

const OYUNLAR={};
export {OYUNLAR,oturum,ok,bekle,goster,hatalar,sonuc,CIKTI};

/* ── Senaryolar ── */
const senaryolar=(await import('./senaryolar.mjs')).default;
const secili=process.argv[2];
for(const [ad,fn] of Object.entries(senaryolar)){
  if(secili&&secili!==ad)continue;
  console.log('•',ad);
  const {b,p,fr}=await oturum();
  try{await fn({p,fr,ok,bekle,goster,CIKTI,ad,kur:async(opts={},n=2)=>{
    await fr[0].evaluate((ad,o)=>window.hazirla(ad,o),ad,opts);
    for(let i=1;i<n;i++)await fr[i].evaluate(()=>window.katil());
    await bekle(120);
    await fr[0].evaluate(()=>window.baslatOyun());
    await bekle(500);
  }})}
  catch(e){sonuc.kalan.push(ad+': '+e.message);console.log('  ✗ HATA',e.message)}
  await b.close();
}
console.log('geçen',sonuc.gecen,'kalan',sonuc.kalan.length?sonuc.kalan:'yok');
console.log('konsol hataları',hatalar.length?hatalar:'yok');
process.exit(sonuc.kalan.length||hatalar.length?1:0);
