/* İsim Şehir: herkes aynı harfle cevap yazar, DUR denince süre kısalır, cevaplar birlikte oylanır.
 * Tek başına oynarken rakipler botlardır (aynı kod yolu, bot cevapları durumda planlanır). */
import {up,shuffle,pick} from '../core/util.js';
import {SOZLUK} from './veri/isimsehir.js';
import view from './isimsehir.view.js';
import {bilinenMi,degerlendir,puanla} from './isimsehir.puan.js';
export {bilinenMi,degerlendir,puanla};

export const HARFLER='ABCÇDEFGHIİKLMNOÖPRSŞTUÜVYZ'.split('');   /* Ğ ve J yok: bu harfle kelime bulmak çok zor */
export const TEMEL=[{id:'isim',ad:'İsim'},{id:'sehir',ad:'Şehir'},{id:'hayvan',ad:'Hayvan'},{id:'bitki',ad:'Bitki'},{id:'esya',ad:'Eşya'},{id:'ulke',ad:'Ülke'}];
const BOTLAR=[{id:'bot1',name:'Kaan',avatar:'🤖',acc:.9,speed:.9},{id:'bot2',name:'Selin',avatar:'🎀',acc:.8,speed:.75},{id:'bot3',name:'Mert',avatar:'🛹',acc:.65,speed:1.1}];
const DUR_SURE=5000,TOPLAMA_PAYI=2500,OY_SURESI=75000;

const temizCevap=(s,a)=>{
  const o={};
  for(const k of s.kategoriler)o[k.id]=String(a?.[k.id]??'').trim().slice(0,30);
  return o;
};

function botPlani(s,ctx,botlar,harf,sureMs){
  return botlar.map(b=>{
    const ans={};let enGec=0,n=0;
    for(const k of s.kategoriler){
      const l=!k.ozel&&SOZLUK[k.id]?.[harf];
      if(l&&l.length&&ctx.rand()<b.acc){
        const t=(5000+ctx.rand()*sureMs*.7)*b.speed;
        ans[k.id]={w:pick(l,ctx.rand),t:Math.round(t)};enGec=Math.max(enGec,t);n++;
      }
    }
    const durAt=n>=Math.max(3,s.kategoriler.length-1)&&enGec+1200<sureMs-3000?Math.round(enGec+1200):null;
    return{id:b.id,ans,durAt};
  });
}

function turBaslat(s,ctx,tur){
  const bos=HARFLER.filter(h=>!s.kullanilan.includes(h));
  const harf=pick(bos.length?bos:HARFLER,ctx.rand);
  const n={...s,faz:'tur',tur,harf,kullanilan:[...s.kullanilan,harf],basla:ctx.now,bitis:ctx.now+s.sureMs,endsAt:ctx.now+s.sureMs,durBy:'',cevaplar:{},oy:{},hazir:{},oyBitis:0};
  n.botPlan=botPlani(n,ctx,s.botlar,harf,s.sureMs);
  return n;
}

function sonrakiTur(s,ctx){
  const {pts}=puanla(s);
  const skor={...s.skor};
  for(const id of s.kat)skor[id]=(skor[id]||0)+pts[id];
  if(s.tur>=s.toplam)return{...s,skor,faz:'bitti'};
  return turBaslat({...s,skor},ctx,s.tur+1);
}

const game={
  id:'isimsehir',name:'İsim Şehir',ikon:'✏️',renk:'#ec4899',
  ozet:'Aynı harfle cevap yaz, DUR de',
  nasil:'Ekranda bir harf çıkar. Her kategori için o harfle başlayan bir cevap yaz. Biri DUR derse herkesin birkaç saniyesi kalır. Kimsenin yazmadığı cevap 10, aynı cevaplar 5 puan. Şüpheli cevapları birlikte oylarsınız. Çocuk varsa süre 30 sn uzar.',
  cocuk:true,solo:true,online:true,players:{min:1,max:8},
  secenekler:[
    {anahtar:'kategoriler',ad:'Kategoriler (en az 3)',tur:'coklu',enAz:3,secenekler:TEMEL.map(k=>({v:k.id,t:k.ad}))},
    {anahtar:'ozel',ad:'Kendi kategorilerin',tur:'liste',max:3,uzunluk:18,yer:'Örn: dizi, ünlü, marka'},
    {anahtar:'tur',ad:'Tur sayısı',tur:'sec',secenekler:[{v:3,t:'3'},{v:5,t:'5'}],varsayilan:3},
    {anahtar:'sure',ad:'Süre (saniye)',tur:'sec',secenekler:[{v:45,t:'45'},{v:60,t:'60'},{v:90,t:'90'}],varsayilan:60}
  ],
  init(ctx){
    const secili=Array.isArray(ctx.opts.kategoriler)&&ctx.opts.kategoriler.length?ctx.opts.kategoriler:TEMEL.map(k=>k.id);
    const kategoriler=[...TEMEL.filter(k=>secili.includes(k.id)),...(Array.isArray(ctx.opts.ozel)?ctx.opts.ozel:[]).slice(0,3).map((ad,i)=>({id:'x'+i,ad:String(ad).slice(0,18),ozel:true}))];
    if(kategoriler.length<3)kategoriler.push(...TEMEL.filter(k=>!kategoriler.some(x=>x.id===k.id)).slice(0,3-kategoriler.length));
    const solo=ctx.opts.mode==='solo'&&ctx.players.length===1;
    const botlar=solo?BOTLAR:[];
    const adlar={};
    for(const p of ctx.players)adlar[p.uid]={name:p.name,avatar:p.avatar};
    for(const b of botlar)adlar[b.id]={name:b.name,avatar:b.avatar,bot:true};
    const kat=[...ctx.players.map(p=>p.uid),...botlar.map(b=>b.id)];
    const skor={};for(const id of kat)skor[id]=0;
    const cocukVar=ctx.players.some(p=>p.age==='cocuk');
    const sureMs=([45,60,90].includes(Number(ctx.opts.sure))?Number(ctx.opts.sure):60)*1000+(cocukVar?30000:0);
    const s0={faz:'tur',oyun:Math.floor(ctx.rand()*1e9),tur:0,toplam:[3,5].includes(Number(ctx.opts.tur))?Number(ctx.opts.tur):3,
      kat,insanlar:ctx.players.map(p=>p.uid),botlar,adlar,kategoriler,kullanilan:[],sureMs,skor,
      harf:'',basla:0,bitis:0,endsAt:0,durBy:'',cevaplar:{},oy:{},hazir:{},oyBitis:0,botPlan:[]};
    return turBaslat(s0,ctx,1);
  },
  reduce(s,a,ctx){
    if(s.faz==='tur'){
      if(!s.insanlar.includes(a.uid))return s;
      if(a.type==='cevap'){
        if(s.cevaplar[a.uid])return s;
        return{...s,cevaplar:{...s.cevaplar,[a.uid]:temizCevap(s,a.a)}};
      }
      if(a.type==='dur'){
        if(s.durBy||s.cevaplar[a.uid])return s;
        const c=temizCevap(s,a.a);
        if(s.kategoriler.some(k=>!c[k.id]))return s;           /* hepsi dolmadan DUR denmez */
        return{...s,durBy:a.uid,endsAt:Math.min(s.endsAt,ctx.now+DUR_SURE),cevaplar:{...s.cevaplar,[a.uid]:c}};
      }
      return s;
    }
    if(s.faz==='oy'){
      if(!s.insanlar.includes(a.uid))return s;
      if(a.type==='oy'){
        const [hedef,kat]=String(a.k||'').split('|');
        if(!hedef||hedef===a.uid||!s.kat.includes(hedef)||!s.kategoriler.some(k=>k.id===kat))return s;
        const k=hedef+'|'+kat,l=s.oy[k]||[];
        const yeni=l.includes(a.uid)?l.filter(x=>x!==a.uid):[...l,a.uid];
        return{...s,oy:{...s.oy,[k]:yeni}};
      }
      if(a.type==='hazir'){
        if(s.hazir[a.uid])return s;
        return{...s,hazir:{...s.hazir,[a.uid]:true}};
      }
    }
    return s;
  },
  tick(s,ctx){
    const cevrimici=s.insanlar.filter(id=>ctx.players.some(p=>p.uid===id&&p.online));
    if(s.faz==='tur'){
      /* botlar DUR der */
      if(!s.durBy){
        const gecen=ctx.now-s.basla;
        const b=s.botPlan.find(x=>x.durAt!=null&&gecen>=x.durAt);
        if(b)return{...s,durBy:b.id,endsAt:Math.min(s.endsAt,ctx.now+DUR_SURE)};
      }
      const hepsiGonderdi=cevrimici.length>0&&cevrimici.every(id=>s.cevaplar[id]);
      if(ctx.now>=s.endsAt&&(hepsiGonderdi||ctx.now>=s.endsAt+TOPLAMA_PAYI)){
        /* bot cevapları: süre dolduğu ana kadar yazabildikleri */
        const gecen=Math.min(ctx.now,s.endsAt)-s.basla;
        const cevaplar={...s.cevaplar};
        for(const id of s.insanlar)if(!cevaplar[id])cevaplar[id]={};
        for(const b of s.botPlan){
          cevaplar[b.id]={};
          for(const k in b.ans)if(b.ans[k].t<=gecen)cevaplar[b.id][k]=b.ans[k].w;
        }
        return{...s,faz:'oy',cevaplar,oy:{},hazir:{},oyBitis:ctx.now+OY_SURESI};
      }
      return null;
    }
    if(s.faz==='oy'){
      if(!cevrimici.length)return null;
      const hepsi=cevrimici.every(id=>s.hazir[id]);
      if(hepsi||ctx.now>=s.oyBitis)return sonrakiTur(s,ctx);
    }
    return null;
  },
  view
};
export default game;
