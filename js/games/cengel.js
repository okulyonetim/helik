/* Çengel Bulmaca: ortak ızgara. Bir kutuya dokun, harfi yaz; doğruysa yerleşir (+2 puan), yanlışsa −1 olur.
 * Bir kelimeyi tamamlayan, kelimenin uzunluğu kadar bonus alır. Herkes aynı ızgarada birlikte çözer. */
import {yukle,bulma,bulmaSayisi,cozumDizisi,harfMi,kelimeler,tumuDolu,SEVIYELER} from './cengel.mantik.js';
import view from './cengel.view.js';

const game={
  id:'cengel',name:'Çengel Bulmaca',ikon:'🔤',renk:'#0d9488',
  ozet:'Ok işaretli ipuçlarını çöz',
  nasil:'İpucu kutusundaki tanıma uyan cevabı kutulara yaz. Bir kutuya dokun, alttaki klavyeden harfi seç. Doğru harf yerine oturur, yanlış harf puan kaybettirir. Takılırsan İpucu düğmesi seçili kutuyu açar. Birlikte oynarsanız herkes aynı bulmacayı çözer.',
  cocuk:true,solo:true,online:true,players:{min:1,max:6},
  secenekler:[
    {anahtar:'zorluk',ad:'Zorluk',tur:'sec',secenekler:[{v:'kolay',t:'Kolay (çocuklar)'},{v:'orta',t:'Orta'},{v:'zor',t:'Zor'}],varsayilan:'kolay'}
  ],
  yukle,
  init(ctx){
    const z=SEVIYELER.includes(ctx.opts.zorluk)?ctx.opts.zorluk:'kolay';
    const n=bulmaSayisi(z);
    if(!n)throw new Error('Bulmaca verisi yüklenmedi');
    const no=Math.floor(ctx.rand()*n);
    const b=bulma(z,no);
    const skor={};for(const p of ctx.players)skor[p.uid]=0;
    return{faz:'oyun',oyun:Math.floor(ctx.rand()*1e9),z,no,r:b.r,c:b.c,sol:cozumDizisi(b),dolu:{},
      kat:ctx.players.map(p=>p.uid),skor,basla:ctx.now,bitisAt:0,ipucu:0,son:null};
  },
  reduce(s,a,ctx){
    if(s.faz!=='oyun'||!s.kat.includes(a.uid))return s;
    if(a.type!=='yaz'&&a.type!=='ipucu')return s;
    const i=a.i;
    if(!Number.isInteger(i)||i<0||i>=s.sol.length||!harfMi(s.sol[i])||s.dolu[i]!==undefined)return s;
    const dogru=s.sol[i];
    let yeni;
    if(a.type==='ipucu'){
      yeni={...s,dolu:{...s.dolu,[i]:''},ipucu:s.ipucu+1};
    }else{
      const harf=typeof a.ch==='string'?a.ch.toLocaleUpperCase('tr'):'';
      if([...harf].length!==1)return s;
      const n=(s.son?.n||0)+1;
      if(harf!==dogru){
        return{...s,skor:{...s.skor,[a.uid]:Math.max(0,(s.skor[a.uid]||0)-1)},son:{i,ch:harf,ok:false,uid:a.uid,n}};
      }
      const dolu={...s.dolu,[i]:a.uid};
      let puan=2;
      for(const w of kelimeler(s.sol,s.c))if(w.hucreler.includes(i)&&w.hucreler.every(h=>dolu[h]!==undefined))puan+=w.hucreler.length;
      yeni={...s,dolu,skor:{...s.skor,[a.uid]:(s.skor[a.uid]||0)+puan},son:{i,ch:harf,ok:true,uid:a.uid,n}};
    }
    if(tumuDolu(yeni)){yeni.faz='bitti';yeni.bitisAt=ctx.now}
    return yeni;
  },
  view
};
export default game;
