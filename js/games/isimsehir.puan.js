/* İsim Şehir puanlama: hem oyun mantığı hem ekran aynı kuralı kullanır. */
import {up} from '../core/util.js';
import {SOZLUK} from './veri/isimsehir.js';

export const bilinenMi=(katId,harf,cevap)=>{
  const l=SOZLUK[katId]?.[harf];
  const a=up(cevap);
  return!!l&&l.some(w=>up(w)===a);
};

/* Tek bir cevabın durumu: bos | kisa | harf | ok (sözlükte var) | gecerli | red */
export function degerlendir(s,uid,kat){
  const a=String(s.cevaplar[uid]?.[kat.id]||'').trim();
  const d={a,durum:'bos',red:0};
  if(!a)return d;
  const u=up(a);
  if(u[0]!==s.harf){d.durum='harf';return d}
  if(u.length<2){d.durum='kisa';return d}
  if(!kat.ozel&&bilinenMi(kat.id,s.harf,a)){d.durum='ok';return d}
  const reddeden=(s.oy[uid+'|'+kat.id]||[]).filter(v=>v!==uid&&s.insanlar.includes(v));
  const digerleri=s.insanlar.filter(v=>v!==uid).length;
  d.red=reddeden.length;
  d.durum=reddeden.length>0&&reddeden.length*2>digerleri?'red':'gecerli';
  return d;
}
export function puanla(s){
  const pts={},det={};
  s.kat.forEach(id=>{pts[id]=0});
  for(const k of s.kategoriler){
    const gruplar={};
    for(const id of s.kat){
      const d=degerlendir(s,id,k);det[id+'|'+k.id]={...d,p:0};
      if(d.durum==='ok'||d.durum==='gecerli')(gruplar[up(d.a)]=gruplar[up(d.a)]||[]).push(id);
    }
    for(const g of Object.values(gruplar)){const p=g.length===1?10:5;for(const id of g){det[id+'|'+k.id].p=p;pts[id]+=p}}
  }
  return{pts,det};
}

