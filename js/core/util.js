/* Ortak yardımcılar: hem tarayıcıda hem Node testlerinde çalışır. */

export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

/* Türkçe büyük harf ve boşluk düzeni: i→İ, ı→I */
export const up=s=>String(s??'').trim().replace(/\s+/g,' ').toLocaleUpperCase('tr');
export const low=s=>String(s??'').trim().replace(/\s+/g,' ').toLocaleLowerCase('tr');

export const ALFABE='ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('');

export const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));

/* Tohumlu rastgele sayı üreteci (mulberry32): testler ve aynı bulmacayı herkese göstermek için */
export function rng(seed=Date.now()){
  let a=seed>>>0;
  return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296};
}
export const seedOf=s=>{let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0};

export const pick=(arr,rand=Math.random)=>arr[Math.floor(rand()*arr.length)];
export function shuffle(arr,rand=Math.random){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]]}
  return a;
}

export const fmtSure=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};

/* Oda kodu: karışabilen harf ve rakamlar (0/O, 1/I) yok */
const KOD='ABCDEFGHJKLMNPRSTUVYZ23456789';
export const yeniKod=(rand=Math.random,n=5)=>Array.from({length:n},()=>KOD[Math.floor(rand()*KOD.length)]).join('');
export const kodTemiz=s=>up(s).replace(/[^A-Z0-9]/g,'');

/* Derin kopya (JSON uyumlu veri için) */
export const kopya=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));

/* Oyuncu listesinden yaş karışımı: 'cocuk' | 'karisik' | 'yetiskin' */
export function yasKarisimi(players){
  const c=players.filter(p=>p.age==='cocuk').length,y=players.length-c;
  if(c&&y)return'karisik';
  return c?'cocuk':'yetiskin';
}

/* Sıralı puan tablosu: [{uid,puan}] büyükten küçüğe, eşitlikte ad sırası */
export function siralama(players,scores){
  return[...players].map(p=>({...p,puan:scores?.[p.uid]||0})).sort((a,b)=>b.puan-a.puan||String(a.name).localeCompare(b.name,'tr'));
}
