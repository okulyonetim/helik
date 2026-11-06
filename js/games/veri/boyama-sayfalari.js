/* Boyama sayfaları: 400x400 çizim alanında, dokunulabilen bölgeler.
 * Bölge: [kimlik, etiket, nitelikler]. "_" ile başlayan kimlikler yalnızca çizgidir (boyanmaz). */
export const PALET=['#e53935','#fb8c00','#fdd835','#9ccc65','#2e7d32','#26c6da','#42a5f5','#1e4fa3','#8e24aa','#f48fb1','#795548','#9e9e9e','#212121'];
const yildizPts=(cx,cy,r,ic=.45)=>Array.from({length:10},(_,i)=>{const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*ic:r;return(cx+rr*Math.cos(a)).toFixed(0)+','+(cy+rr*Math.sin(a)).toFixed(0)}).join(' ');
const bulut=(id,x,y)=>[id,'path',`d="M${x} ${y} a22 22 0 0 1 40-10 a26 26 0 0 1 50 8 a18 18 0 0 1 -4 34 h-72 a17 17 0 0 1 -14 -32z"`];
const yaprakcik=(id,cx,cy,rot)=>[id,'ellipse',`cx="${cx}" cy="${cy}" rx="34" ry="14" transform="rotate(${rot} ${cx} ${cy})"`];

export const SAYFALAR={
  ev:{ad:'Ev',bolgeler:[
    ['gok','rect','x="0" y="0" width="400" height="400"'],
    ['gunes','circle','cx="335" cy="68" r="36"'],
    bulut('bulut1',40,95),bulut('bulut2',190,60),
    ['tepe','path','d="M0 300 Q100 215 220 300 T400 285 V400 H0z"'],
    ['cimen','path','d="M0 320 Q150 290 400 320 V400 H0z"'],
    ['baca','rect','x="228" y="140" width="24" height="50"'],
    ['duvar','rect','x="105" y="205" width="160" height="115"'],
    ['cati','polygon','points="88,210 185,130 282,210"'],
    ['kapi','rect','x="165" y="250" width="40" height="70"'],
    ['pencere1','rect','x="122" y="235" width="30" height="30"'],
    ['pencere2','rect','x="222" y="235" width="30" height="30"'],
    ['_cam1','path','d="M137 235 V265 M122 250 H152" fill="none"'],
    ['_cam2','path','d="M237 235 V265 M222 250 H252" fill="none"'],
    ['yol','path','d="M160 322 H210 L240 400 H130z"'],
    ['govde','rect','x="318" y="245" width="22" height="80"'],
    ['yaprak','circle','cx="329" cy="215" r="48"'],
    ['cicek1','circle','cx="55" cy="350" r="12"'],['cicek2','circle','cx="95" cy="372" r="12"'],['cicek3','circle','cx="290" cy="365" r="12"']
  ]},
  balik:{ad:'Balık',bolgeler:[
    ['su','rect','x="0" y="0" width="400" height="400"'],
    ['kum','path','d="M0 335 Q100 310 200 335 T400 325 V400 H0z"'],
    ['yosun1','path','d="M330 335 Q310 290 335 255 Q355 225 335 190 L355 190 Q380 230 358 262 Q335 295 355 335z"'],
    ['yosun2','path','d="M60 345 Q45 310 65 285 Q80 262 62 235 L80 235 Q98 262 82 290 Q65 315 82 345z"'],
    ['kuyruk','polygon','points="285,195 355,140 355,250"'],
    ['yuzgec1','polygon','points="160,140 205,95 235,145"'],
    ['yuzgec2','polygon','points="170,245 205,290 230,245"'],
    ['govde','ellipse','cx="190" cy="195" rx="98" ry="62"'],
    ['goz','circle','cx="140" cy="178" r="14"'],
    ['_bebek','circle','cx="137" cy="178" r="6" fill="#222"'],
    ['_agiz','path','d="M95 205 Q112 218 128 208" fill="none"'],
    ['_pul1','path','d="M185 170 q12 10 0 22 M210 175 q12 10 0 22 M235 185 q10 8 0 18" fill="none"'],
    ['kabarcik1','circle','cx="85" cy="115" r="15"'],['kabarcik2','circle','cx="62" cy="158" r="10"'],['kabarcik3','circle','cx="108" cy="72" r="8"'],
    ['minik','ellipse','cx="300" cy="300" rx="34" ry="19"'],
    ['minikKuyruk','polygon','points="332,300 358,284 358,316"'],
    ['denizyildizi','polygon',`points="${yildizPts(200,365,26)}"`]
  ]},
  kelebek:{ad:'Kelebek',bolgeler:[
    ['gok','rect','x="0" y="0" width="400" height="400"'],
    ['gunes','circle','cx="60" cy="60" r="32"'],
    ['cim','path','d="M0 350 Q100 330 200 350 T400 345 V400 H0z"'],
    ['kanatUstSol','ellipse','cx="130" cy="150" rx="82" ry="58" transform="rotate(-28 130 150)"'],
    ['kanatUstSag','ellipse','cx="270" cy="150" rx="82" ry="58" transform="rotate(28 270 150)"'],
    ['kanatAltSol','ellipse','cx="150" cy="248" rx="58" ry="46" transform="rotate(22 150 248)"'],
    ['kanatAltSag','ellipse','cx="250" cy="248" rx="58" ry="46" transform="rotate(-22 250 248)"'],
    ['benek1','circle','cx="115" cy="140" r="16"'],['benek2','circle','cx="285" cy="140" r="16"'],
    ['benek3','circle','cx="140" cy="250" r="12"'],['benek4','circle','cx="260" cy="250" r="12"'],
    ['govde','ellipse','cx="200" cy="205" rx="15" ry="82"'],
    ['kafa','circle','cx="200" cy="118" r="20"'],
    ['_anten','path','d="M192 102 Q170 62 148 55 M208 102 Q230 62 252 55" fill="none"'],
    ['cicek1','circle','cx="70" cy="365" r="14"'],['cicek2','circle','cx="330" cy="370" r="14"']
  ]},
  roket:{ad:'Roket',bolgeler:[
    ['uzay','rect','x="0" y="0" width="400" height="400"'],
    ['gezegen','circle','cx="80" cy="85" r="42"'],
    ['_halka','ellipse','cx="80" cy="85" rx="66" ry="14" fill="none" transform="rotate(-18 80 85)"'],
    ['gezegen2','circle','cx="325" cy="110" r="28"'],
    ['ay','circle','cx="330" cy="330" r="38"'],
    ['yildiz1','polygon',`points="${yildizPts(250,55,20)}"`],['yildiz2','polygon',`points="${yildizPts(60,230,16)}"`],['yildiz3','polygon',`points="${yildizPts(345,225,14)}"`],
    ['alev','path','d="M168 292 Q200 395 232 292z"'],
    ['kanat1','polygon','points="142,215 90,298 142,276"'],
    ['kanat2','polygon','points="258,215 310,298 258,276"'],
    ['govde','path','d="M200 65 Q262 140 262 255 H138 Q138 140 200 65z"'],
    ['burun','path','d="M200 65 Q238 105 250 140 H150 Q162 105 200 65z"'],
    ['pencere','circle','cx="200" cy="190" r="27"'],
    ['motor','rect','x="165" y="255" width="70" height="37"'],
    ['_cizgi','path','d="M138 235 H262" fill="none"']
  ]},
  cicek:{ad:'Çiçek',bolgeler:[
    ['gok','rect','x="0" y="0" width="400" height="400"'],
    ['gunes','circle','cx="65" cy="62" r="34"'],
    bulut('bulut',230,70),
    ['toprak','rect','x="0" y="335" width="400" height="65"'],
    ['sap','rect','x="192" y="170" width="16" height="150"'],
    yaprakcik('yaprak1',158,260,-28),yaprakcik('yaprak2',242,235,28),
    ...Array.from({length:6},(_,i)=>{const a=i*60,cx=(200+56*Math.cos(a*Math.PI/180)).toFixed(0),cy=(125+56*Math.sin(a*Math.PI/180)).toFixed(0);return[`petal${i+1}`,'ellipse',`cx="${cx}" cy="${cy}" rx="40" ry="23" transform="rotate(${a} ${cx} ${cy})"`]}),
    ['merkez','circle','cx="200" cy="125" r="32"'],
    ['saksi','polygon','points="145,310 255,310 238,395 162,395"'],
    ['_kenar','path','d="M138 310 H262" fill="none" stroke-width="8"'],
    ['ari','ellipse','cx="320" cy="200" rx="22" ry="14"'],
    ['_ariCizgi','path','d="M312 188 V212 M322 188 V212 M332 190 V210" fill="none"']
  ]},
  araba:{ad:'Araba',bolgeler:[
    ['gok','rect','x="0" y="0" width="400" height="400"'],
    ['gunes','circle','cx="335" cy="65" r="34"'],
    bulut('bulut',45,85),
    ['yol','rect','x="0" y="305" width="400" height="95"'],
    ['_serit','path','d="M20 360 H80 M130 360 H190 M240 360 H300 M350 360 H400" fill="none"'],
    ['govde','rect','x="45" y="215" width="310" height="80" rx="22"'],
    ['kabin','path','d="M108 217 L150 160 H262 L305 217z"'],
    ['cam1','polygon','points="124,213 156,172 198,172 198,213"'],
    ['cam2','polygon','points="208,213 208,172 256,172 286,213"'],
    ['far','circle','cx="340" cy="248" r="11"'],
    ['stop','rect','x="48" y="238" width="16" height="20" rx="4"'],
    ['teker1','circle','cx="125" cy="295" r="34"'],['jant1','circle','cx="125" cy="295" r="14"'],
    ['teker2','circle','cx="285" cy="295" r="34"'],['jant2','circle','cx="285" cy="295" r="14"']
  ]}
};
export const SAYFA_LISTESI=Object.entries(SAYFALAR).map(([id,v])=>({id,ad:v.ad}));
export const bolgeIdleri=id=>(SAYFALAR[id]?.bolgeler||[]).filter(b=>!b[0].startsWith('_')).map(b=>b[0]);

/* SVG işaretlemesi; dolgu: {bolgeId: paletIndeksi} */
export function sayfaSvg(id,dolgu={},{etkilesim=true}={}){
  const s=SAYFALAR[id]||SAYFALAR.ev;
  const govde=s.bolgeler.map(([r,t,a])=>{
    if(r.startsWith('_'))return`<${t} ${a} stroke="#222" stroke-width="3" stroke-linecap="round" pointer-events="none"${/fill=/.test(a)?'':' fill="none"'}/>`;
    const c=dolgu[r]!==undefined?PALET[dolgu[r]]:'#ffffff';
    return`<${t} ${a} data-r="${r}" fill="${c}" stroke="#222" stroke-width="3" stroke-linejoin="round"${etkilesim?' tabindex="-1"':''}/>`;
  }).join('');
  return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400" role="img" aria-label="${s.ad} boyama sayfası">${govde}</svg>`;
}
