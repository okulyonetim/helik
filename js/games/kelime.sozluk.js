/* Kelime Türetme sözlüğü: yalnızca bu oyun açılınca yüklenir (yaklaşık 350 KB, sonra önbellekte kalır). */
let LISTE=null,SET=null,YAYGIN_SAYISI=0,TOHUM=null,sozVaadi=null;

export function yukle(){
  if(SET)return Promise.resolve();
  if(!sozVaadi){
    sozVaadi=import('./veri/tr-sozluk.js').then(m=>{
      const y=m.YAYGIN.split(' '),d=m.DIGER.split(' ');
      LISTE=[...y,...d];YAYGIN_SAYISI=y.length;SET=new Set(LISTE);
      TOHUM={};for(const k of Object.keys(m.TOHUM))TOHUM[k]=m.TOHUM[k].split(' ');
    }).catch(e=>{sozVaadi=null;throw e});
  }
  return sozVaadi;
}
export const hazirMi=()=>!!SET;
/* Sözlük yüklenemediyse (olmaması gereken durum) oyun kilitlenmesin diye kabul eder */
export const gecerli=w=>SET?SET.has(w):true;
export const tohumlar=n=>TOHUM?.[n]||[];

const sayim=harfler=>{const m={};for(const c of harfler)m[c]=(m[c]||0)+1;return m};
export function cikarilabilir(harfler,w){
  if(w.length>harfler.length)return false;
  const m=sayim(harfler);
  for(const c of w){if(!m[c])return false;m[c]--}
  return true;
}
/* Raftan yazılabilen bütün sözlük kelimeleri; yaygınlar önde, uzunlar önce */
export function hepsiniBul(harfler,{yalnizYaygin=false}={}){
  if(!LISTE)return[];
  const m0=sayim(harfler),n=harfler.length,sonuc=[];
  const bitis=yalnizYaygin?YAYGIN_SAYISI:LISTE.length;
  for(let i=0;i<bitis;i++){
    const w=LISTE[i];
    if(w.length>n)continue;
    const m={...m0};let ok=true;
    for(const c of w){if(!m[c]){ok=false;break}m[c]--}
    if(ok)sonuc.push(w);
  }
  return sonuc.sort((a,b)=>b.length-a.length||a.localeCompare(b,'tr'));
}

/* Kelime uzunluğuna göre puan */
export const PUAN=[0,0,0,1,2,4,7,11,16];
export const puanOf=w=>PUAN[Math.min(w.length,8)]||0;
