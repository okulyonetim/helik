/* Oyuncu profili ve aile soruları: yalnızca bu cihazda (localStorage) saklanır. */

const K_PROFIL='aoyun:profil';
const K_SORU='aoyun:aileSorulari';

export const AVATARLAR=['🦊','🐼','🐯','🦁','🐸','🐵','🐰','🐻','🐨','🦄','🐙','🦉','🐧','🐢','🦋','🐞','🌸','⭐','🚀','⚽','🎈','🍉','🍕','🎨'];

const oku=k=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):null}catch(_){return null}};
const yaz=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};

export function profilOku(){
  const p=oku(K_PROFIL);
  if(!p||!p.name)return null;
  return{name:String(p.name).slice(0,14),avatar:AVATARLAR.includes(p.avatar)?p.avatar:AVATARLAR[0],age:p.age==='cocuk'?'cocuk':'yetiskin'};
}
export const profilYaz=p=>yaz(K_PROFIL,p);

/* Aile soruları: [{t:'Soru', o:['Doğru','Yanlış1','Yanlış2','Yanlış3']}]  — o[0] her zaman doğru cevap */
export function aileSorulari(){
  const l=oku(K_SORU);
  return Array.isArray(l)?l.filter(q=>q&&q.t&&Array.isArray(q.o)&&q.o.length===4&&q.o.every(Boolean)):[];
}
export const aileSorulariYaz=l=>yaz(K_SORU,l.slice(0,80));
