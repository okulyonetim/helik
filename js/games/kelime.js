/* Kelime Türetme: herkes aynı harflerden kelime üretir; her oyuncu kendi kelimelerinin puanını alır. */
import {shuffle,pick,low} from '../core/util.js';
import {yukle,gecerli,tohumlar,cikarilabilir,puanOf} from './kelime.sozluk.js';
import view from './kelime.view.js';

export {PUAN,puanOf} from './kelime.sozluk.js';
const KABUL_PAYI=1500,ARA_MS=10000;

function turBaslat(s,ctx,tur){
  const adaylar=tohumlar(s.boyut).filter(w=>!s.kullanilan.includes(w));
  const tohum=pick(adaylar.length?adaylar:tohumlar(s.boyut),ctx.rand);
  let harfler=shuffle([...tohum],ctx.rand);
  for(let i=0;i<5&&harfler.join('')===tohum;i++)harfler=shuffle([...tohum],ctx.rand);
  const bulunan={},turPuan={};
  for(const id of s.kat){bulunan[id]=[];turPuan[id]=0}
  return{...s,faz:'tur',tur,harfler,tohum,kullanilan:[...s.kullanilan,tohum],basla:ctx.now,bitis:ctx.now+s.sureMs,bulunan,turPuan,araBitis:0};
}

const game={
  id:'kelime',name:'Kelime Türetme',ikon:'🔠',renk:'#8b5cf6',
  ozet:'Harflerden kelime üret',
  nasil:'Ekrandaki harflere dokunarak kelime oluştur. Uzun kelime daha çok puan getirir. Herkes aynı harfleri görür ve kendi kelimelerinin puanını alır. Çocuk varsa süre 30 sn uzar.',
  cocuk:true,solo:true,online:true,players:{min:1,max:8},
  yukle,
  secenekler:[
    {anahtar:'boyut',ad:'Harf sayısı',tur:'sec',secenekler:[{v:6,t:'6'},{v:7,t:'7'},{v:8,t:'8'}],varsayilan:7},
    {anahtar:'tur',ad:'Tur sayısı',tur:'sec',secenekler:[{v:1,t:'1'},{v:3,t:'3'},{v:5,t:'5'}],varsayilan:3},
    {anahtar:'sure',ad:'Tur süresi (saniye)',tur:'sec',secenekler:[{v:60,t:'60'},{v:90,t:'90'},{v:120,t:'120'}],varsayilan:90}
  ],
  init(ctx){
    const boyut=[6,7,8].includes(Number(ctx.opts.boyut))?Number(ctx.opts.boyut):7;
    const toplam=[1,3,5].includes(Number(ctx.opts.tur))?Number(ctx.opts.tur):3;
    const cocukVar=ctx.players.some(p=>p.age==='cocuk');
    const sureMs=([60,90,120].includes(Number(ctx.opts.sure))?Number(ctx.opts.sure):90)*1000+(cocukVar?30000:0);
    const kat=ctx.players.map(p=>p.uid);
    const skor={};for(const id of kat)skor[id]=0;
    return turBaslat({faz:'tur',oyun:Math.floor(ctx.rand()*1e9),toplam,boyut,sureMs,kat,skor,kullanilan:[],harfler:[],tohum:'',basla:0,bitis:0,bulunan:{},turPuan:{},araBitis:0},ctx,1);
  },
  reduce(s,a,ctx){
    if(s.faz!=='tur'||a.type!=='kelime')return s;
    if(!s.kat.includes(a.uid)||ctx.now>s.bitis+KABUL_PAYI)return s;
    const w=low(a.w);
    if(w.length<3||w.length>s.harfler.length||w.length>12)return s;
    if(!cikarilabilir(s.harfler,w)||!gecerli(w))return s;
    const mevcut=s.bulunan[a.uid]||[];
    if(mevcut.includes(w))return s;
    const p=puanOf(w);
    return{...s,bulunan:{...s.bulunan,[a.uid]:[...mevcut,w]},turPuan:{...s.turPuan,[a.uid]:(s.turPuan[a.uid]||0)+p},skor:{...s.skor,[a.uid]:(s.skor[a.uid]||0)+p}};
  },
  tick(s,ctx){
    if(s.faz==='tur'&&ctx.now>=s.bitis+KABUL_PAYI){
      if(s.tur>=s.toplam)return{...s,faz:'bitti'};
      return{...s,faz:'ara',araBitis:ctx.now+ARA_MS};
    }
    if(s.faz==='ara'&&ctx.now>=s.araBitis)return turBaslat(s,ctx,s.tur+1);
    return null;
  },
  view
};
export default game;
