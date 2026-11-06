/* Çengel bulmaca üreticisi (geliştirici aracı): söz bankasından hazır bulmacalar üretir.
 * Kullanım:  node scripts/cengel-uret.mjs   →  js/games/veri/cengel-bulmacalar.js
 * Üretim kuralı: her cevabın hemen solunda (yatay) ya da hemen üstünde (dikey) bir ipucu kutusu bulunur;
 * bir kutuda en çok iki ipucu (biri sağa, biri aşağı) olur. Harf kutuları arasındaki her ardışık
 * 2+ uzunluktaki dizi mutlaka bir cevaptır. */
import {writeFileSync} from 'node:fs';
import {BANKA} from './cengel-sozcukler.mjs';
import {rng} from '../js/core/util.js';

const SEVIYELER={
  kolay:{r:9,c:6,z:1,adet:16,deneme:1200},
  orta:{r:10,c:7,z:2,adet:16,deneme:900},
  zor:{r:11,c:8,z:3,adet:16,deneme:700}
};

function bulmacaUret(banka,R,C,rand,maxTur=120){
  const t=Array.from({length:R},()=>Array(C).fill(0)); // 0 boş, 1 harf, 2 ipucu, 3 kör
  const ch=Array.from({length:R},()=>Array(C).fill(''));
  const kelimeler=[];const kullanilan=new Set();
  const anahtar=new Set();

  function gecerliMi(){
    for(let r=0;r<R;r++){
      for(let c=0;c<C;c++){
        if(t[r][c]!==1)continue;
        if(c===0||t[r][c-1]!==1){let e=c;while(e+1<C&&t[r][e+1]===1)e++;if(e>c&&!anahtar.has(`a:${r}:${c}:${e-c+1}`))return false}
        if(r===0||t[r-1][c]!==1){let e=r;while(e+1<R&&t[e+1][c]===1)e++;if(e>r&&!anahtar.has(`d:${r}:${c}:${e-r+1}`))return false}
      }
    }
    return true;
  }
  function deneYerlestir(w,yon,sr,sc,uygula){
    const n=w.length,dr=yon==='d'?1:0,dc=yon==='a'?1:0;
    const ir=sr-dc*0-(yon==='d'?1:0),ic=sc-(yon==='a'?1:0);
    if(ir<0||ic<0)return null;
    const er=sr+dr*(n-1),ec=sc+dc*(n-1);
    if(er>=R||ec>=C)return null;
    if(t[ir][ic]===1)return null;
    // aynı kutuda aynı yönden ikinci ipucu olamaz
    if(kelimeler.some(k=>k.ir===ir&&k.ic===ic&&k.yon===yon))return null;
    let kesis=0;
    for(let k=0;k<n;k++){
      const r=sr+dr*k,c=sc+dc*k;
      if(t[r][c]===1){if(ch[r][c]!==w[k])return null;kesis++}
      else if(t[r][c]!==0)return null;
    }
    if(kesis===n)return null;
    const sr2=er+dr,sc2=ec+dc;
    if(sr2<R&&sc2<C&&t[sr2][sc2]===1)return null;
    if(!uygula)return{kesis};
    return{kesis};
  }
  function yerlestir(e,yon,sr,sc){
    const w=e.w,n=w.length,dr=yon==='d'?1:0,dc=yon==='a'?1:0;
    const ir=sr-(yon==='d'?1:0),ic=sc-(yon==='a'?1:0);
    const geri=[];
    const koy=(r,c,tt,hh)=>{geri.push([r,c,t[r][c],ch[r][c]]);t[r][c]=tt;if(hh!==undefined)ch[r][c]=hh};
    if(t[ir][ic]===0||t[ir][ic]===3)koy(ir,ic,2);
    for(let k=0;k<n;k++){const r=sr+dr*k,c=sc+dc*k;if(t[r][c]===0)koy(r,c,1,w[k])}
    const sr2=sr+dr*n,sc2=sc+dc*n;
    if(sr2<R&&sc2<C&&t[sr2][sc2]===0)koy(sr2,sc2,3);
    const anah=`${yon}:${sr}:${sc}:${n}`;
    anahtar.add(anah);
    if(!gecerliMi()){
      anahtar.delete(anah);
      for(let i=geri.length-1;i>=0;i--){const [r,c,tt,hh]=geri[i];t[r][c]=tt;ch[r][c]=hh}
      return false;
    }
    kelimeler.push({w,c:e.c,yon,ir,ic,sr,sc,n});
    kullanilan.add(w);
    return true;
  }
  let serbest=false; // ikinci aşama: kesişimsiz (ayrı küme) kelimelere de izin ver
  function adaylar(e){
    const liste=[];
    for(const yon of ['a','d']){
      for(let sr=0;sr<R;sr++)for(let sc=0;sc<C;sc++){
        const s=deneYerlestir(e.w,yon,sr,sc);
        if(s&&(kelimeler.length===0||s.kesis>0||serbest))liste.push({e,yon,sr,sc,puan:s.kesis*3+rand()*2+(e.w.length>4?.5:0)});
      }
    }
    return liste;
  }
  // ilk kelime: yatay, ikinci satırdan
  const havuz=[...banka];
  for(let i=havuz.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[havuz[i],havuz[j]]=[havuz[j],havuz[i]]}
  const ilk=havuz.find(e=>e.w.length>=Math.min(5,C-1))||havuz[0];
  if(!yerlestir(ilk,'a',1+Math.floor(rand()*2),1))return null;
  for(let tur=0;tur<maxTur;tur++){
    const orn=havuz.filter(e=>!kullanilan.has(e.w)).slice(0,90);
    let en=[];
    for(const e of orn)en.push(...adaylar(e));
    if(!en.length){
      for(const e of havuz.filter(e=>!kullanilan.has(e.w)).slice(90))en.push(...adaylar(e));
      if(!en.length){if(serbest)break;serbest=true;continue}
    }
    en.sort((a,b)=>b.puan-a.puan);
    const ust=en.slice(0,Math.min(5,en.length));
    let basari=false;
    for(const a of ust.sort(()=>rand()-.5)){if(yerlestir(a.e,a.yon,a.sr,a.sc)){basari=true;break}}
    if(!basari){
      for(const a of en){if(yerlestir(a.e,a.yon,a.sr,a.sc)){basari=true;break}}
      if(!basari)break;
    }
    // karıştır: kullanılmayanlar rastgele sırada kalsın
    for(let i=havuz.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[havuz[i],havuz[j]]=[havuz[j],havuz[i]]}
  }
  let harf=0;for(let r=0;r<R;r++)for(let c=0;c<C;c++){if(t[r][c]===1)harf++}
  const g=t.map((row,r)=>row.map((v,c)=>v===1?ch[r][c]:v===2?'#':'.').join(''));
  const k=kelimeler.map(x=>[x.ir,x.ic,x.yon,x.n,x.c]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]||(a[2]<b[2]?-1:1));
  return{r:R,c:C,g,k,harf,kelime:kelimeler.length};
}

export function bulmacalariUret(seviye,seedBase=1){
  const s=SEVIYELER[seviye];
  const banka=BANKA.filter(e=>e.z<=s.z);
  const sonuc=[];
  for(let n=0;n<s.adet;n++){
    let en=null;
    for(let d=0;d<s.deneme;d++){
      const rand=rng(seedBase*100003+n*7919+d*104729+s.r*31);
      const b=bulmacaUret(banka,s.r,s.c,rand);
      if(b&&(!en||b.harf>en.harf))en=b;
    }
    sonuc.push(en);
  }
  return sonuc;
}

if(import.meta.url===`file://${process.argv[1]}`){
  const cikti={};
  for(const sv of Object.keys(SEVIYELER)){
    const t0=Date.now();
    const liste=bulmacalariUret(sv);
    // aynı ızgarayı iki kez gönderme
    const gor=new Set();cikti[sv]=liste.filter(b=>{const a=b.g.join('/');if(gor.has(a))return false;gor.add(a);return true}).map(({r,c,g,k})=>({r,c,g,k}));
    const ort=liste.reduce((a,b)=>a+b.harf/(b.r*b.c),0)/liste.length;
    console.log(sv,liste.length,'bulmaca, ortalama harf oranı',ort.toFixed(2),'kelime/bulmaca',(liste.reduce((a,b)=>a+b.kelime,0)/liste.length).toFixed(1),(Date.now()-t0)+' ms');
  }
  const js=`/* Otomatik üretildi: scripts/cengel-uret.mjs — elle düzenlemeyin.
 * Biçim: r satır, c sütun, g ızgara satırları ('#' ipucu kutusu, '.' boş kutu, harf = cevap),
 * k = [ipucuKutusuSatır, ipucuKutusuSütun, 'a' (sağa) | 'd' (aşağı), uzunluk, ipucu] */
export const BULMACALAR=${JSON.stringify(cikti)};
`;
  writeFileSync(new URL('../js/games/veri/cengel-bulmacalar.js',import.meta.url),js);
  console.log('yazıldı',(js.length/1024).toFixed(1),'KB');
}
