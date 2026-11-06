/* Hafıza: eş kartları bul. Sıra tabanlı; eşleştiren sırayı tutar. Tek başına ya da 6 kişiye kadar. */
import {shuffle} from '../core/util.js';
import view from './hafiza.view.js';

export const TEMALAR={
  hayvan:['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔'],
  meyve:['🍎','🍌','🍇','🍓','🍉','🍒','🍑','🍍','🥝','🍋','🍊','🥕','🌽','🍅'],
  arac:['🚗','🚕','🚌','🚓','🚑','🚒','🚜','🚲','🚀','🚂','⛵','🚁'],
  karisik:['🐶','🐱','🍎','🍌','🚗','🚀','⚽','🎈','🌸','⭐','🎸','🍕','🦋','🐢','🍦','🎂']
};
export const ZORLUK={kolay:{cift:6,kolon:3},orta:{cift:8,kolon:4},zor:{cift:12,kolon:4}};

/* Sıradaki çevrimiçi oyuncu (tek kişi kaldıysa aynı kişi) */
export function sonraki(uid,ctx){
  const l=ctx.players,n=l.length;if(!n)return uid;
  const i=l.findIndex(p=>p.uid===uid);
  for(let k=1;k<=n;k++){
    const p=l[((i<0?-1:i)+k)%n];
    if(p.online)return p.uid;
  }
  return uid;
}

const game={
  id:'hafiza',name:'Hafıza',ikon:'🃏',renk:'#f59e0b',
  ozet:'Aynı kartları bul',
  nasil:'Kartlara dokunup çevir. İki kart aynıysa sende kalır ve bir daha açarsın. Farklıysa kapanır ve sıra diğer oyuncuya geçer. En çok çifti bulan kazanır.',
  cocuk:true,solo:true,online:true,players:{min:1,max:6},
  secenekler:[
    {anahtar:'zorluk',ad:'Zorluk',tur:'sec',secenekler:[{v:'kolay',t:'Kolay'},{v:'orta',t:'Orta'},{v:'zor',t:'Zor'}],varsayilan:'orta'},
    {anahtar:'tema',ad:'Kartlar',tur:'sec',secenekler:[{v:'hayvan',t:'Hayvanlar'},{v:'meyve',t:'Meyveler'},{v:'arac',t:'Araçlar'},{v:'karisik',t:'Karışık'}]}
  ],
  init(ctx){
    const z=ZORLUK[ctx.opts.zorluk]||ZORLUK.orta;
    const tema=TEMALAR[ctx.opts.tema]||TEMALAR.hayvan;
    const secilen=shuffle(tema,ctx.rand).slice(0,z.cift);
    const kartlar=shuffle([...secilen,...secilen],ctx.rand);
    const cocukVar=ctx.players.some(p=>p.age==='cocuk');
    const skor={},hamle={};
    for(const p of ctx.players){skor[p.uid]=0;hamle[p.uid]=0}
    return{faz:'oyun',tur:Math.floor(ctx.rand()*1e9),kartlar,kolon:z.kolon,sahip:kartlar.map(()=>''),acik:[],
      kalan:z.cift,sira:ctx.players[0]?.uid||'',skor,hamle,gizleAt:0,gizleMs:cocukVar?2300:1500};
  },
  reduce(s,a,ctx){
    if(s.faz!=='oyun'||a.type!=='cevir')return s;
    if(a.uid!==s.sira||s.gizleAt)return s;
    const i=a.i;
    if(!Number.isInteger(i)||i<0||i>=s.kartlar.length||s.sahip[i]||s.acik.includes(i))return s;
    const acik=[...s.acik,i];
    const n={...s,acik};
    if(acik.length===2){
      const [x,y]=acik;
      n.hamle={...s.hamle,[a.uid]:(s.hamle[a.uid]||0)+1};
      if(s.kartlar[x]===s.kartlar[y]){
        const sahip=[...s.sahip];sahip[x]=a.uid;sahip[y]=a.uid;
        n.sahip=sahip;n.acik=[];
        n.skor={...s.skor,[a.uid]:(s.skor[a.uid]||0)+1};
        n.kalan=s.kalan-1;
        if(n.kalan===0)n.faz='bitti';
      }else n.gizleAt=ctx.now+s.gizleMs;
    }
    return n;
  },
  tick(s,ctx){
    if(s.faz!=='oyun')return null;
    if(s.gizleAt){
      if(ctx.now>=s.gizleAt)return{...s,acik:[],gizleAt:0,sira:sonraki(s.sira,ctx)};
      return null;
    }
    const p=ctx.players.find(q=>q.uid===s.sira);
    if((!p||!p.online)&&ctx.players.some(q=>q.online&&q.uid!==s.sira))return{...s,acik:[],sira:sonraki(s.sira,ctx)};
    return null;
  },
  view
};
export default game;
