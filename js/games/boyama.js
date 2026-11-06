/* Boyama: ortak sayfa. Renk seç, bölgeye dokun; herkes aynı sayfayı birlikte boyar. */
import {pick} from '../core/util.js';
import {SAYFALAR,SAYFA_LISTESI,PALET,bolgeIdleri} from './veri/boyama-sayfalari.js';
import view from './boyama.view.js';

const game={
  id:'boyama',name:'Boyama',ikon:'🎨',renk:'#f43f5e',
  ozet:'Birlikte renklendir',
  nasil:'Bir renk seç ve resmin içindeki bir yere dokun. Herkes aynı resmi birlikte boyar. Bitince resmi kaydedebilirsin.',
  cocuk:true,solo:true,online:true,players:{min:1,max:8},
  secenekler:[
    {anahtar:'sayfa',ad:'Sayfa',tur:'sec',secenekler:[{v:'rastgele',t:'Rastgele'},...SAYFA_LISTESI.map(x=>({v:x.id,t:x.ad}))]}
  ],
  init(ctx){
    const ids=SAYFA_LISTESI.map(x=>x.id);
    const sayfa=ids.includes(ctx.opts.sayfa)?ctx.opts.sayfa:pick(ids,ctx.rand);
    return{faz:'oyun',oyun:Math.floor(ctx.rand()*1e9),sayfa,dolgu:{},kat:ctx.players.map(p=>p.uid),surum:0};
  },
  reduce(s,a){
    if(s.faz!=='oyun'||!s.kat.includes(a.uid)&&a.type!=='sayfa')return s;
    if(a.type==='boya'){
      if(!bolgeIdleri(s.sayfa).includes(a.r))return s;
      const c=a.c;
      if(c===-1){
        if(s.dolgu[a.r]===undefined)return s;
        const d={...s.dolgu};delete d[a.r];return{...s,dolgu:d,surum:s.surum+1};
      }
      if(!Number.isInteger(c)||c<0||c>=PALET.length||s.dolgu[a.r]===c)return s;
      return{...s,dolgu:{...s.dolgu,[a.r]:c},surum:s.surum+1};
    }
    if(a.type==='temizle'){
      if(!Object.keys(s.dolgu).length)return s;
      return{...s,dolgu:{},surum:s.surum+1};
    }
    if(a.type==='sayfa'){
      if(!s.kat.includes(a.uid)||!SAYFALAR[a.s]||a.s===s.sayfa)return s;
      return{...s,sayfa:a.s,dolgu:{},surum:s.surum+1};
    }
    return s;
  },
  view
};
export default game;
