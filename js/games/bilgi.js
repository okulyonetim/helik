/* Bilgi Yarışması: herkes aynı anda cevaplar; doğru cevap 100 puan, hızlı olana +50'ye kadar bonus.
 * Çocuk, yetişkin ve aile soruları karışabilir; aile soruları oda sahibinin cihazından eklenir. */
import {shuffle,yasKarisimi} from '../core/util.js';
import {SORULAR} from './veri/sorular.js';
import {aileSorulari} from '../core/profile.js';
import view from './bilgi.view.js';

const TEMEL=100,BONUS=50;

/* Seviyeye göre soru seç: karışıkta çocuk/yetişkin/herkes sırayla, böylece herkes cevaplayabileceği soruyla karşılaşır */
export function soruSec(seviye,adet,rand,aile=[]){
  const havuz={c:[],y:[],h:[]};
  for(const [k,z,t,...o] of SORULAR)havuz[z].push({t,k,o});
  for(const p of Object.keys(havuz))havuz[p]=shuffle(havuz[p],rand);
  const sira=seviye==='cocuk'?['c','h','c']:seviye==='yetiskin'?['y','h','y']:['c','y','h'];
  const sec=[],ayri=shuffle(aile,rand).map(q=>({t:q.t,k:'Aile',o:q.o,aile:true}));
  const aileAdet=Math.min(ayri.length,Math.max(1,Math.ceil(adet/3)));
  sec.push(...(ayri.length?ayri.slice(0,aileAdet):[]));
  let i=0,guvenlik=0;
  while(sec.length<adet&&guvenlik++<500){
    const p=sira[i++%sira.length];
    const q=havuz[p].shift();
    if(q)sec.push(q);
    else if(!sira.some(x=>havuz[x].length))break;
  }
  return shuffle(sec,rand).slice(0,adet);
}
export const seviyeBul=(opts,players)=>{
  if(['cocuk','karisik','yetiskin'].includes(opts.seviye))return opts.seviye;
  const k=yasKarisimi(players);
  return k;
};
const hazirla=(q,rand)=>{
  const dogru=q.o[0];
  const o=shuffle(q.o,rand);
  return{t:q.t,k:q.k,o,d:o.indexOf(dogru),...(q.aile?{aile:1}:{})};
};
export const puanHesapla=(s,at)=>Math.round(TEMEL+BONUS*Math.max(0,Math.min(1,(s.bitis-at)/s.sureMs)));

function soruyuAc(s,ctx,i){
  return{...s,faz:'soru',i,basla:ctx.now,bitis:ctx.now+s.sureMs,cevaplar:{},puanlar:{},acikBitis:0};
}
function aciklaBitir(s,ctx){
  const q=s.sorular[s.i],skor={...s.skor},dogru={...s.dogru},puanlar={};
  for(const id of s.kat){
    const c=s.cevaplar[id];
    if(c&&c.c===q.d){const p=puanHesapla(s,c.t);puanlar[id]=p;skor[id]=(skor[id]||0)+p;dogru[id]=(dogru[id]||0)+1}
    else puanlar[id]=0;
  }
  return{...s,faz:'cevap',skor,dogru,puanlar,acikBitis:ctx.now+s.aciklamaMs};
}

const game={
  id:'bilgi',name:'Bilgi Yarışması',ikon:'🧠',renk:'#3b82f6',
  ozet:'Hızlı ve doğru cevapla',
  nasil:'Her soruda dört şık var. Herkes aynı anda cevaplar; doğru cevap 100 puan, ne kadar hızlı bulursan o kadar bonus alırsın. İstersen kendi aile sorularını da ekleyebilirsin.',
  cocuk:true,solo:true,online:true,players:{min:1,max:8},
  secenekler:[
    {anahtar:'adet',ad:'Soru sayısı',tur:'sec',secenekler:[{v:5,t:'5'},{v:10,t:'10'},{v:15,t:'15'}],varsayilan:10},
    {anahtar:'seviye',ad:'Seviye',tur:'sec',secenekler:[{v:'otomatik',t:'Otomatik'},{v:'cocuk',t:'Çocuk'},{v:'karisik',t:'Karışık'},{v:'yetiskin',t:'Yetişkin'}]},
    {anahtar:'aile',ad:'Aile sorularını ekle',tur:'ac',varsayilan:true,ipucu:'Oda sahibinin “Aile soruları” ekranında yazdığı sorular eklenir.'}
  ],
  init(ctx){
    const adet=[5,10,15].includes(Number(ctx.opts.adet))?Number(ctx.opts.adet):10;
    const seviye=seviyeBul(ctx.opts,ctx.players);
    const aile=ctx.opts.aile===false?[]:aileSorulari();
    const sorular=soruSec(seviye,adet,ctx.rand,aile).map(q=>hazirla(q,ctx.rand));
    const cocukVar=ctx.players.some(p=>p.age==='cocuk');
    const kat=ctx.players.map(p=>p.uid);
    const skor={},dogru={};for(const id of kat){skor[id]=0;dogru[id]=0}
    const s0={faz:'soru',oyun:Math.floor(ctx.rand()*1e9),seviye,i:0,toplam:sorular.length,sorular,kat,skor,dogru,
      sureMs:cocukVar?25000:15000,aciklamaMs:cocukVar?5000:3500,basla:0,bitis:0,cevaplar:{},puanlar:{},acikBitis:0};
    return soruyuAc(s0,ctx,0);
  },
  reduce(s,a,ctx){
    if(s.faz!=='soru'||a.type!=='sec')return s;
    if(!s.kat.includes(a.uid)||s.cevaplar[a.uid])return s;
    const c=a.c;
    if(!Number.isInteger(c)||c<0||c>3)return s;
    const at=Math.min(ctx.now,s.bitis);
    return{...s,cevaplar:{...s.cevaplar,[a.uid]:{c,t:at}}};
  },
  tick(s,ctx){
    const cevrimici=s.kat.filter(id=>ctx.players.some(p=>p.uid===id&&p.online));
    if(s.faz==='soru'){
      const hepsi=cevrimici.length>0&&cevrimici.every(id=>s.cevaplar[id]);
      if(hepsi||ctx.now>=s.bitis)return aciklaBitir(s,ctx);
      return null;
    }
    if(s.faz==='cevap'&&ctx.now>=s.acikBitis){
      if(s.i+1>=s.toplam)return{...s,faz:'bitti'};
      return soruyuAc(s,ctx,s.i+1);
    }
    return null;
  },
  view
};
export default game;
