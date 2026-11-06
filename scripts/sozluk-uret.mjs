import nspell from 'nspell';
import dict from 'dictionary-tr';
import {createRequire} from 'node:module';
import fs from 'node:fs';
/* Kullanım: npm i --no-save an-array-of-turkish-words nspell dictionary-tr && node scripts/sozluk-uret.mjs
 * Çıktı: tr-sozluk.js (js/games/veri/ içine taşınır). Yalnızca sözlüğü yenilemek isterken gerekir. */
const require=createRequire(import.meta.url);
const words=require('an-array-of-turkish-words');
const sp=nspell(dict);
const A=/^[abcçdefgğhıijklmnoöprsştuüvyz]+$/;

/* Aile oyunu için uygunsuz sözcükler: kök listesi (kısa kökler yalnızca çekimli halleriyle) */
const KOK=['amk','aq','sik','siktir','sikik','göt','götveren','piç','orospu','kahpe','yarrak','yarak','amcık','amına','bok','boktan','döl','kıç','pezevenk','ibne','puşt','gavat','fahişe','sürtük','kancık','kaltak','gerzek','dangalak','embesil','andaval','şerefsiz','namussuz','haysiyetsiz','lan','leş','geber','gebertmek','zıkkım','zibidi','hıh','ulan','sapık','zina','seks','sekste','cinsel','mastürbasyon','penis','vajina','erotik','porno','tecavüz','ensest'];
const KISA=/^(ler|lar|i|ı|u|ü|e|a|in|ın|un|ün|im|ım|le|la|ten|tan|den|dan|te|ta|de|da|ti|tı|di|dı|ci|cı|çi|çı)$/;
const yasak=w=>KOK.some(k=>w===k||(k.length>=5?w.startsWith(k):(w.startsWith(k)&&KISA.test(w.slice(k.length)))));

const lenOk=(w,i)=>{
  if(w.length===3)return i<12000;
  if(w.length===4)return i<110000;
  return i<150000;
};
const secilen=[];
words.forEach((w,i)=>{
  if(w.length<3||w.length>8||!A.test(w))return;
  if(!lenOk(w,i))return;
  if(yasak(w))return;
  if(!sp.correct(w))return;
  secilen.push({w,i});
});
const rank=new Map();words.forEach((w,i)=>{if(!rank.has(w))rank.set(w,i)});
const uniq=[...new Set(secilen.map(x=>x.w))];
const yaygin=uniq.filter(w=>w.length>=4&&rank.get(w)<45000).sort((a,b)=>a.localeCompare(b,'tr'));
const ys=new Set(yaygin);
const diger=uniq.filter(w=>!ys.has(w)).sort((a,b)=>a.localeCompare(b,'tr'));
const liste=[...yaygin,...diger];
const L={};for(const w of liste)L[w.length]=(L[w.length]||0)+1;
console.log('sözlük',liste.length,'yaygın',yaygin.length,L);
const harfSay=w=>{const m={};for(const c of w)m[c]=(m[c]||0)+1;return m};
const cikar=(raf,w)=>{if(w.length>raf.n)return false;const m={...raf.m};for(const c of w){if(!m[c])return false;m[c]--}return true};
const tohum={6:[],7:[],8:[]};
const adaylar=liste.filter(w=>w.length>=6&&rank.get(w)<20000).sort((a,b)=>rank.get(a)-rank.get(b));
for(const w of adaylar){
  if(tohum[w.length].length>=800)continue;
  const raf={m:harfSay(w),n:w.length};
  let n=0;for(const x of liste){if(cikar(raf,x))n++}
  if(n>=25&&n<=600)tohum[w.length].push(w);
}
console.log('tohum',Object.fromEntries(Object.entries(tohum).map(([k,v])=>[k,v.length])));
const kaynak='/* Kelime Türetme sözlüğü (otomatik üretildi: scripts/sozluk-uret.mjs).\n * Kaynak: an-array-of-turkish-words (MIT) kelimeleri, dictionary-tr (MIT) yazım denetiminden geçirilip aile oyununa uygun olmayanlar ayıklandı.\n * YAYGIN: sık kullanılan kelimeler (ipucu olarak gösterilebilir). DIGER: geçerli ama seyrek. TOHUM: raf üretmek için 6-8 harfli kelimeler. */\n'
 +'export const TOHUM='+JSON.stringify(Object.fromEntries(Object.entries(tohum).map(([k,v])=>[k,v.join(' ')])))+';\n'
 +'export const YAYGIN='+JSON.stringify(yaygin.join(' '))+';\n'
 +'export const DIGER='+JSON.stringify(diger.join(' '))+';\n';
fs.writeFileSync('tr-sozluk.js',kaynak);
console.log('3 harf:',liste.filter(w=>w.length===3).length);
console.log('boyut KB',(kaynak.length/1024).toFixed(0));
