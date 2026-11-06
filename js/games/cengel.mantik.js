/* Çengel bulmaca: saf mantık (arayüzden bağımsız) ve bulmaca verisinin tembel yüklenmesi. */
let DATA=null,vaat=null;
export function yukle(){
  if(DATA)return Promise.resolve();
  if(!vaat)vaat=import('./veri/cengel-bulmacalar.js').then(m=>{DATA=m.BULMACALAR}).catch(e=>{vaat=null;throw e});
  return vaat;
}
export const hazirMi=()=>!!DATA;
export const bulmaSayisi=z=>DATA?.[z]?.length||0;
export const bulma=(z,no)=>DATA?.[z]?.[no]||null;
export const SEVIYELER=['kolay','orta','zor'];

/* Izgara satırlarında '#' ipucu kutusu, '.' boş kutu, geri kalanı harf */
export const harfMi=ch=>ch!==undefined&&ch!=='#'&&ch!=='.';
export const cozumDizisi=b=>b.g.join('');

/* Ardışık 2+ harf dizilerinden kelimeleri çıkarır: [{yon:'a'|'d', hucreler:[idx…]}] */
const onbellek=new Map();
export function kelimeler(sol,C){
  const anahtar=C+':'+sol;
  const var_=onbellek.get(anahtar);if(var_)return var_;
  const R=sol.length/C,liste=[];
  for(let r=0;r<R;r++)for(let c=0;c<C;c++){
    if(!harfMi(sol[r*C+c]))continue;
    if(c===0||!harfMi(sol[r*C+c-1])){const h=[];for(let k=c;k<C&&harfMi(sol[r*C+k]);k++)h.push(r*C+k);if(h.length>1)liste.push({yon:'a',hucreler:h})}
    if(r===0||!harfMi(sol[(r-1)*C+c])){const h=[];for(let k=r;k<R&&harfMi(sol[k*C+c]);k++)h.push(k*C+c);if(h.length>1)liste.push({yon:'d',hucreler:h})}
  }
  if(onbellek.size>40)onbellek.clear();
  onbellek.set(anahtar,liste);
  return liste;
}

/* Bulmacanın ipucu listesi: her ipucu için cevabın hücreleri */
export function ipuclari(b){
  const C=b.c;
  return b.k.map(([ir,ic,yon,n,metin])=>{
    const hucreler=[];
    for(let k=0;k<n;k++)hucreler.push(yon==='a'?ir*C+ic+1+k:(ir+1+k)*C+ic);
    return{ir,ic,yon,n,metin,hucreler,ipucuHucre:ir*C+ic};
  });
}

export const tumuDolu=s=>{
  for(let i=0;i<s.sol.length;i++)if(harfMi(s.sol[i])&&s.dolu[i]===undefined)return false;
  return true;
};
export const harfSayisi=sol=>{let n=0;for(const ch of sol)if(harfMi(ch))n++;return n};

/* Yapılandırma hatası olmasın diye bulmaca verisini sınar (testlerde kullanılır): hata listesi döndürür */
export function dogrula(b){
  const hata=[];
  const {r,c,g,k}=b;
  if(g.length!==r)hata.push('satır sayısı');
  for(const s of g)if([...s].length!==c)hata.push('sütun sayısı');
  const sol=cozumDizisi(b);
  if(sol.length!==r*c)return hata.concat('uzunluk');
  const ip=ipuclari(b);
  const beklenen=new Set(ip.map(x=>x.yon+':'+x.hucreler[0]+':'+x.n));
  for(const x of ip){
    if(sol[x.ipucuHucre]!=='#')hata.push(`ipucu kutusu değil (${x.ir},${x.ic})`);
    if(x.hucreler.some(h=>h<0||h>=sol.length||!harfMi(sol[h])))hata.push(`cevap hücreleri harf değil (${x.ir},${x.ic},${x.yon})`);
    if(x.yon==='a'&&x.ic+x.n>=c)hata.push('sağa taşıyor');
    if(x.yon==='d'&&x.ir+x.n>=r)hata.push('aşağı taşıyor');
    if(!x.metin||x.metin.length>34)hata.push('ipucu metni');
  }
  if(ip.length!==new Set(ip.map(x=>x.ipucuHucre+x.yon)).size)hata.push('aynı kutuda aynı yönden iki ipucu');
  const gercek=kelimeler(sol,c);
  for(const w of gercek){
    const yon=w.yon,ilk=w.hucreler[0];
    if(!beklenen.has(yon+':'+ilk+':'+w.hucreler.length))hata.push(`ipucusuz kelime (${yon}, hücre ${ilk})`);
  }
  if(gercek.length!==ip.length)hata.push(`kelime sayısı ${gercek.length} ≠ ipucu sayısı ${ip.length}`);
  for(let i=0;i<sol.length;i++){
    if(harfMi(sol[i])&&!gercek.some(w=>w.hucreler.includes(i)))hata.push('yalnız harf '+i);
    if(sol[i]==='#'&&!ip.some(x=>x.ipucuHucre===i))hata.push('boş ipucu kutusu '+i);
  }
  return hata;
}
