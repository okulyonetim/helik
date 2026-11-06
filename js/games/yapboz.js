/* Yapboz: ortak tahta. Parçayı seç, doğru yuvaya koy. Herkes aynı tahtada çalışır; koyduğun parça sana puan yazar. */
import {shuffle,pick} from '../core/util.js';
import {SAHNE_LISTESI} from './veri/sahneler.js';
import view from './yapboz.view.js';

export const BOYUTLAR={'2x3':[2,3],'3x4':[3,4],'4x5':[4,5],'5x6':[5,6]};

const game={
  id:'yapboz',name:'Yapboz',ikon:'🧩',renk:'#06b6d4',
  ozet:'Parçaları yerine yerleştir',
  nasil:'Alttaki parçalardan birine dokun, sonra tahtada yerine dokun. Doğru yerse oturur! Takılırsan İpucu düğmesi doğru yeri gösterir. Birlikte oynarsanız herkes aynı tahtada çalışır.',
  cocuk:true,solo:true,online:true,players:{min:1,max:6},
  secenekler:[
    {anahtar:'parca',ad:'Parça sayısı',tur:'sec',secenekler:[{v:'2x3',t:'6'},{v:'3x4',t:'12'},{v:'4x5',t:'20'},{v:'5x6',t:'30'}],varsayilan:'3x4'},
    {anahtar:'sahne',ad:'Resim',tur:'sec',secenekler:[{v:'rastgele',t:'Rastgele'},...SAHNE_LISTESI.map(x=>({v:x.id,t:x.ad}))]},
    {anahtar:'ipucu',ad:'Tahtada silik resim görünsün',tur:'ac',varsayilan:true}
  ],
  init(ctx){
    const [kolon,satir]=BOYUTLAR[ctx.opts.parca]||BOYUTLAR['3x4'];
    const n=kolon*satir;
    const ids=SAHNE_LISTESI.map(x=>x.id);
    const sahne=ids.includes(ctx.opts.sahne)?ctx.opts.sahne:pick(ids,ctx.rand);
    const skor={};for(const p of ctx.players)skor[p.uid]=0;
    return{faz:'oyun',oyun:Math.floor(ctx.rand()*1e9),sahne,kolon,satir,n,karisik:shuffle([...Array(n).keys()],ctx.rand),yer:Array(n).fill(''),
      kat:ctx.players.map(p=>p.uid),skor,basla:ctx.now,bitisAt:0,ipucu:ctx.opts.ipucu!==false};
  },
  reduce(s,a,ctx){
    if(s.faz!=='oyun'||a.type!=='koy')return s;
    if(!s.kat.includes(a.uid))return s;
    const i=a.i;
    if(!Number.isInteger(i)||i<0||i>=s.n||s.yer[i])return s;
    const yer=[...s.yer];yer[i]=a.uid;
    const n={...s,yer,skor:{...s.skor,[a.uid]:(s.skor[a.uid]||0)+1}};
    if(yer.every(Boolean)){n.faz='bitti';n.bitisAt=ctx.now}
    return n;
  },
  view
};
export default game;
