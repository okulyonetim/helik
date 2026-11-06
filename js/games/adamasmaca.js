/* Adam Asmaca: sıra tabanlı, ortak can. Kelime otomatik seçilir ya da bir oyuncu başkaları için yazar. */
import {up,ALFABE,pick,shuffle} from '../core/util.js';
import {KATEGORILER} from './veri/kelimeler.js';
import view from './adamasmaca.view.js';

export const HARFLER=ALFABE;
const ARA_MS=5000;

const uzunlukAraligi={kolay:[3,5],orta:[5,7],zor:[7,99]};
export function kelimeHavuzu(kat,zorluk){
  const tum=kat==='karisik'||!KATEGORILER[kat]?Object.entries(KATEGORILER).flatMap(([k,v])=>v.kelimeler.map(w=>({w:up(w),kat:k}))):KATEGORILER[kat].kelimeler.map(w=>({w:up(w),kat}));
  const [a,b]=uzunlukAraligi[zorluk]||uzunlukAraligi.orta;
  const uygun=tum.filter(x=>x.w.length>=a&&x.w.length<=b);
  return uygun.length>=5?uygun:tum;
}
export function kelimeSec(opts,kullanilan,rand){
  const havuz=kelimeHavuzu(opts.kategori,opts.zorluk);
  const yeni=havuz.filter(x=>!kullanilan.includes(x.w));
  return pick(yeni.length?yeni:havuz,rand);
}
export const kelimeGecerli=w=>{const k=up(w);return k.length>=3&&k.length<=14&&[...k].every(c=>ALFABE.includes(c))?k:null};
export const acikMi=(s)=>[...s.kelime].every(c=>s.tahmin.includes(c));
export const gizli=s=>[...new Set(s.kelime)].filter(c=>!s.tahmin.includes(c)).length;

/* Tahmin edebilecek oyuncular: kelimeyi yazan hariç */
const uygunlar=(s,ctx)=>ctx.players.filter(p=>p.uid!==s.koyan);
export function siradaki(s,ctx,mevcut=s.sira){
  const l=uygunlar(s,ctx),n=l.length;
  if(!n)return mevcut;
  const i=l.findIndex(p=>p.uid===mevcut);
  for(let k=1;k<=n;k++){const p=l[((i<0?-1:i)+k)%n];if(p.online)return p.uid}
  return l[0].uid;
}

function turBaslat(s,ctx,tur){
  const oyuncuMod=s.mod==='oyuncu'&&ctx.players.length>1;
  const n={...s,tur,tahmin:[],yanlis:0,sonuc:'',devamAt:0,ipucu:'',kelime:'',kat:''};
  if(oyuncuMod){
    const koyan=ctx.players[(tur-1)%ctx.players.length].uid;
    n.faz='kelime';n.koyan=koyan;n.sira=siradaki({...n,koyan},ctx,koyan);
    return n;
  }
  const x=kelimeSec(ctx.opts,s.kullanilan,ctx.rand);
  n.faz='oyun';n.koyan='';n.kelime=x.w;n.kat=x.kat;n.kullanilan=[...s.kullanilan,x.w];
  n.sira=ctx.players.length?ctx.players[(tur-1)%ctx.players.length].uid:'';
  return n;
}

function turuBitir(s,sonuc,ctx){
  const son=s.tur>=s.toplam;
  return{...s,sonuc,faz:son?'bitti':'arada',devamAt:son?0:ctx.now+ARA_MS};
}
function kazan(s,uid,puan,ctx){
  return turuBitir({...s,skor:{...s.skor,[uid]:(s.skor[uid]||0)+puan}},'kazandi',ctx);
}

const game={
  id:'adamasmaca',name:'Adam Asmaca',ikon:'🔤',renk:'#10b981',
  ozet:'Harfleri bul, kelimeyi çöz',
  nasil:'Gizli kelimenin harflerini sırayla tahmin edin. Doğru harf sırayı korur, yanlış harf bir hak götürür. Haklar bitmeden kelimeyi bulun!',
  cocuk:true,solo:true,online:true,players:{min:1,max:6},
  secenekler:[
    {anahtar:'kategori',ad:'Kelime türü',tur:'sec',secenekler:[{v:'karisik',t:'Karışık'},{v:'hayvan',t:'Hayvan'},{v:'yiyecek',t:'Yiyecek'},{v:'sehir',t:'Şehir'},{v:'esya',t:'Eşya'},{v:'meslek',t:'Meslek'},{v:'ulke',t:'Ülke'}]},
    {anahtar:'zorluk',ad:'Kelime uzunluğu',tur:'sec',secenekler:[{v:'kolay',t:'Kısa'},{v:'orta',t:'Orta'},{v:'zor',t:'Uzun'}],varsayilan:'orta'},
    {anahtar:'tur',ad:'Kelime sayısı',tur:'sec',secenekler:[{v:1,t:'1'},{v:3,t:'3'},{v:5,t:'5'}],varsayilan:3},
    {anahtar:'mod',ad:'Kelimeyi kim seçer?',tur:'sec',secenekler:[{v:'otomatik',t:'Uygulama'},{v:'oyuncu',t:'Sırayla biri yazar'}]},
    {anahtar:'cizim',ad:'Çizim',tur:'sec',secenekler:[{v:'otomatik',t:'Otomatik'},{v:'adam',t:'Adam'},{v:'balon',t:'Balon'}]}
  ],
  init(ctx){
    const cocukVar=ctx.players.some(p=>p.age==='cocuk');
    const cizim=ctx.opts.cizim==='adam'||ctx.opts.cizim==='balon'?ctx.opts.cizim:(cocukVar?'balon':'adam');
    const skor={};for(const p of ctx.players)skor[p.uid]=0;
    const toplam=[1,3,5].includes(Number(ctx.opts.tur))?Number(ctx.opts.tur):3;
    const s0={faz:'oyun',oyun:Math.floor(ctx.rand()*1e9),tur:1,toplam,mod:ctx.opts.mod==='oyuncu'?'oyuncu':'otomatik',cizim,hak:cocukVar?10:8,
      kelime:'',kat:'',ipucu:'',koyan:'',tahmin:[],yanlis:0,sira:'',skor,sonuc:'',devamAt:0,kullanilan:[]};
    return turBaslat(s0,ctx,1);
  },
  reduce(s,a,ctx){
    if(a.type==='kelime'){
      if(s.faz!=='kelime'||a.uid!==s.koyan)return s;
      const w=kelimeGecerli(a.w);if(!w)return s;
      const ip=String(a.ipucu||'').trim().slice(0,24);
      return{...s,faz:'oyun',kelime:w,ipucu:ip,kat:'',kullanilan:[...s.kullanilan,w]};
    }
    if(s.faz!=='oyun'||a.uid!==s.sira)return s;
    if(a.type==='tahmin'){
      const h=up(a.h);
      if(h.length!==1||!ALFABE.includes(h)||s.tahmin.includes(h))return s;
      const tahmin=[...s.tahmin,h];
      if(s.kelime.includes(h)){
        const adet=[...s.kelime].filter(c=>c===h).length;
        const n={...s,tahmin};
        if(acikMi(n))return kazan({...n,skor:{...s.skor,[a.uid]:(s.skor[a.uid]||0)+adet}},a.uid,3,ctx);
        return{...n,skor:{...s.skor,[a.uid]:(s.skor[a.uid]||0)+adet}};
      }
      const yanlis=s.yanlis+1;
      const n={...s,tahmin,yanlis};
      if(yanlis>=s.hak)return turuBitir(n,'kaybetti',ctx);
      return{...n,sira:siradaki(n,ctx)};
    }
    if(a.type==='bil'){
      const w=up(a.w);
      if(!w)return s;
      if(w===s.kelime){
        const kalan=gizli(s);
        return kazan({...s,tahmin:[...new Set([...s.tahmin,...s.kelime])]},a.uid,3+kalan,ctx);
      }
      const yanlis=Math.min(s.hak,s.yanlis+2);
      const n={...s,yanlis};
      if(yanlis>=s.hak)return turuBitir(n,'kaybetti',ctx);
      return{...n,sira:siradaki(n,ctx)};
    }
    return s;
  },
  tick(s,ctx){
    if(s.faz==='arada'){
      if(ctx.now>=s.devamAt)return turBaslat(s,ctx,s.tur+1);
      return null;
    }
    if(s.faz==='kelime'){
      const k=ctx.players.find(p=>p.uid===s.koyan);
      if((!k||!k.online)){
        const x=kelimeSec(ctx.opts,s.kullanilan,ctx.rand);
        return{...s,faz:'oyun',kelime:x.w,kat:x.kat,ipucu:'',koyan:'',kullanilan:[...s.kullanilan,x.w],sira:siradaki({...s,koyan:''},ctx,s.sira)};
      }
      return null;
    }
    if(s.faz==='oyun'){
      const p=ctx.players.find(q=>q.uid===s.sira);
      if(!p||!p.online){
        const yeni=siradaki(s,ctx);
        if(yeni!==s.sira)return{...s,sira:yeni};
      }
    }
    return null;
  },
  view
};
export default game;
