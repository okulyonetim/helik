/* Yapboz resimleri: kodla çizilen renkli sahneler. ciz(W,H) → SVG iç işaretlemesi (viewBox 0 0 W H).
 * Her sahnede gökyüzü dahil her bölgede ayırt edici şekiller var, böylece parçalar birbirine benzemez. */
const yildiz=(cx,cy,r,ic=.45)=>{
  const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*ic:r;p.push((cx+rr*Math.cos(a)).toFixed(1)+','+(cy+rr*Math.sin(a)).toFixed(1))}
  return`<polygon points="${p.join(' ')}"/>`;
};
const bulut=(x,y,s,renk='#fff')=>`<g fill="${renk}"><ellipse cx="${x}" cy="${y}" rx="${s*1.2}" ry="${s*.6}"/><circle cx="${x-s*.5}" cy="${y-s*.3}" r="${s*.55}"/><circle cx="${x+s*.2}" cy="${y-s*.5}" r="${s*.7}"/><circle cx="${x+s*.8}" cy="${y-s*.15}" r="${s*.5}"/></g>`;

export const SAHNELER={
  koy:{ad:'Köy',ciz:(W,H)=>{
    const u=Math.min(W,H),x=f=>(f*W).toFixed(1),y=f=>(f*H).toFixed(1),r=f=>(f*u).toFixed(1);
    let s=`<defs><linearGradient id="gk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4aa8ff"/><stop offset="1" stop-color="#bfe6ff"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#gk)"/>`;
    s+=`<g stroke="#ffb300" stroke-width="${r(.012)}">${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return`<line x1="${x(.8)}" y1="${y(.12)}" x2="${(W*.8+Math.cos(a)*u*.2).toFixed(1)}" y2="${(H*.12+Math.sin(a)*u*.2).toFixed(1)}"/>`}).join('')}</g><circle cx="${x(.8)}" cy="${y(.12)}" r="${r(.1)}" fill="#ffd54f"/>`;
    s+=bulut(W*.25,H*.1,u*.09)+bulut(W*.58,H*.22,u*.07)+bulut(W*.12,H*.3,u*.06);
    s+=`<path d="M0 ${y(.62)} Q${x(.25)} ${y(.45)} ${x(.55)} ${y(.62)} T${x(1)} ${y(.58)} V${y(1)} H0z" fill="#7cc45a"/>`;
    s+=`<path d="M0 ${y(.72)} Q${x(.4)} ${y(.6)} ${x(.8)} ${y(.72)} T${x(1.2)} ${y(.7)} V${y(1)} H0z" fill="#5aa83f"/>`;
    s+=`<rect x="${x(.2)}" y="${y(.52)}" width="${x(.42)}" height="${y(.2)}" fill="#f4d9a6" stroke="#8d6e63" stroke-width="2"/><polygon points="${x(.15)},${y(.53)} ${x(.41)},${y(.4)} ${x(.67)},${y(.53)}" fill="#d9534f" stroke="#8d3a37" stroke-width="2"/>`;
    s+=`<rect x="${x(.52)}" y="${y(.41)}" width="${x(.06)}" height="${y(.07)}" fill="#a1887f"/><rect x="${x(.34)}" y="${y(.6)}" width="${x(.14)}" height="${y(.12)}" fill="#8d6e63"/><circle cx="${x(.46)}" cy="${y(.66)}" r="${r(.008)}" fill="#ffd54f"/>`;
    s+=`<rect x="${x(.24)}" y="${y(.56)}" width="${x(.1)}" height="${y(.07)}" fill="#81d4fa" stroke="#5d4037" stroke-width="2"/><rect x="${x(.52)}" y="${y(.56)}" width="${x(.1)}" height="${y(.07)}" fill="#81d4fa" stroke="#5d4037" stroke-width="2"/>`;
    s+=`<rect x="${x(.84)}" y="${y(.55)}" width="${x(.05)}" height="${y(.17)}" fill="#795548"/><circle cx="${x(.865)}" cy="${y(.5)}" r="${r(.13)}" fill="#2e7d32"/><circle cx="${x(.8)}" cy="${y(.55)}" r="${r(.07)}" fill="#43a047"/><circle cx="${x(.93)}" cy="${y(.53)}" r="${r(.07)}" fill="#388e3c"/>`;
    for(const [fx,fy,c] of [[.1,.82,'#ec407a'],[.22,.9,'#ffee58'],[.4,.85,'#ab47bc'],[.58,.93,'#ef5350'],[.75,.84,'#ffee58'],[.9,.92,'#ec407a'],[.3,.78,'#fff']])s+=`<circle cx="${x(fx)}" cy="${y(fy)}" r="${r(.022)}" fill="${c}"/><circle cx="${x(fx)}" cy="${y(fy)}" r="${r(.008)}" fill="#ff8f00"/>`;
    s+=`<path d="M${x(.38)} ${y(.72)} L${x(.46)} ${y(.72)} L${x(.55)} ${y(1)} L${x(.3)} ${y(1)}z" fill="#d7ccc8"/>`;
    return s}},
  deniz:{ad:'Deniz',ciz:(W,H)=>{
    const u=Math.min(W,H),x=f=>(f*W).toFixed(1),y=f=>(f*H).toFixed(1),r=f=>(f*u).toFixed(1);
    let s=`<defs><linearGradient id="gd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe0b2"/><stop offset="1" stop-color="#90caf9"/></linearGradient><linearGradient id="gs" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#29b6f6"/><stop offset="1" stop-color="#01579b"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#gd)"/>`;
    s+=`<circle cx="${x(.25)}" cy="${y(.15)}" r="${r(.11)}" fill="#ff9800"/>`+bulut(W*.7,H*.12,u*.08)+bulut(W*.45,H*.25,u*.05);
    for(const [fx,fy] of [[.6,.2],[.8,.28],[.15,.3]])s+=`<path d="M${x(fx)} ${y(fy)} q${r(.02)} ${r(-.02)} ${r(.04)} 0 q${r(.02)} ${r(-.02)} ${r(.04)} 0" fill="none" stroke="#37474f" stroke-width="2"/>`;
    s+=`<rect y="${y(.4)}" width="${W}" height="${y(.6)}" fill="url(#gs)"/>`;
    for(let i=0;i<5;i++){const yy=.45+i*.045;s+=`<path d="M0 ${y(yy)} ${Array.from({length:6},(_,k)=>`q${x(.08)} ${y(-.02)} ${x(.17)} 0 t${x(.17)} 0`).join(' ').slice(0,200)}" fill="none" stroke="#e1f5fe" stroke-opacity=".6" stroke-width="2.5"/>`}
    s+=`<path d="M${x(.2)} ${y(.52)} h${x(.4)} l${x(-.06)} ${y(.07)} h${x(-.28)}z" fill="#8d6e63" stroke="#4e342e" stroke-width="2"/><rect x="${x(.39)}" y="${y(.3)}" width="${x(.02)}" height="${y(.22)}" fill="#5d4037"/><polygon points="${x(.41)},${y(.3)} ${x(.6)},${y(.5)} ${x(.41)},${y(.5)}" fill="#fff" stroke="#90a4ae" stroke-width="2"/><polygon points="${x(.38)},${y(.34)} ${x(.24)},${y(.5)} ${x(.38)},${y(.5)}" fill="#ef5350"/>`;
    s+=`<path d="M0 ${y(.9)} Q${x(.3)} ${y(.82)} ${x(.6)} ${y(.9)} T${x(1)} ${y(.88)} V${y(1)} H0z" fill="#ffe082"/>`;
    for(const [fx,fy,c] of [[.3,.7,'#ff7043'],[.65,.78,'#ffca28'],[.15,.8,'#ab47bc']]){s+=`<g transform="translate(${x(fx)} ${y(fy)})"><ellipse rx="${r(.07)}" ry="${r(.04)}" fill="${c}"/><polygon points="${r(.06)},0 ${r(.11)},${r(-.04)} ${r(.11)},${r(.04)}" fill="${c}"/><circle cx="${r(-.04)}" cy="${r(-.01)}" r="${r(.01)}" fill="#fff"/></g>`}
    s+=`<g fill="#e53935">${yildiz(W*.8,H*.93,u*.05)}</g><g fill="#f06292">${yildiz(W*.2,H*.95,u*.04)}</g>`;
    for(const [fx,fy,rr] of [[.82,.6,.025],[.86,.68,.018],[.78,.72,.012],[.1,.62,.02]])s+=`<circle cx="${x(fx)}" cy="${y(fy)}" r="${r(rr)}" fill="#e1f5fe" fill-opacity=".7" stroke="#fff"/>`;
    s+=`<path d="M${x(.9)} ${y(1)} q${x(-.04)} ${y(-.08)} 0 ${y(-.14)} q${x(.04)} ${y(-.04)} 0 ${y(-.1)}" fill="none" stroke="#2e7d32" stroke-width="${r(.015)}"/>`;
    return s}},
  uzay:{ad:'Uzay',ciz:(W,H)=>{
    const u=Math.min(W,H),x=f=>(f*W).toFixed(1),y=f=>(f*H).toFixed(1),r=f=>(f*u).toFixed(1);
    let s=`<defs><linearGradient id="gu" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1a1446"/><stop offset="1" stop-color="#4a1a6b"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#gu)"/>`;
    let k=7;const sr=()=>{k=(k*9301+49297)%233280;return k/233280};
    for(let i=0;i<40;i++)s+=`<circle cx="${(sr()*W).toFixed(1)}" cy="${(sr()*H).toFixed(1)}" r="${((0.003+sr()*0.005)*u).toFixed(1)}" fill="${['#fff','#ffe082','#b3e5fc'][i%3]}"/>`;
    s+=`<g fill="#ffd54f">${yildiz(W*.2,H*.12,u*.05)}${yildiz(W*.85,H*.4,u*.04)}${yildiz(W*.1,H*.55,u*.03)}</g>`;
    s+=`<circle cx="${x(.78)}" cy="${y(.14)}" r="${r(.12)}" fill="#ff8a65"/><ellipse cx="${x(.78)}" cy="${y(.14)}" rx="${r(.2)}" ry="${r(.04)}" fill="none" stroke="#ffe0b2" stroke-width="${r(.015)}" transform="rotate(-20 ${x(.78)} ${y(.14)})"/><circle cx="${x(.74)}" cy="${y(.1)}" r="${r(.025)}" fill="#e64a19"/>`;
    s+=`<circle cx="${x(.2)}" cy="${y(.82)}" r="${r(.15)}" fill="#cfd8dc"/><circle cx="${x(.15)}" cy="${y(.78)}" r="${r(.03)}" fill="#b0bec5"/><circle cx="${x(.25)}" cy="${y(.86)}" r="${r(.04)}" fill="#b0bec5"/><circle cx="${x(.22)}" cy="${y(.75)}" r="${r(.02)}" fill="#b0bec5"/>`;
    s+=`<circle cx="${x(.85)}" cy="${y(.78)}" r="${r(.07)}" fill="#4fc3f7"/><path d="M${x(.8)} ${y(.76)} q${r(.05)} ${r(.03)} ${r(.1)} 0" fill="none" stroke="#81c784" stroke-width="${r(.015)}"/>`;
    s+=`<g transform="rotate(25 ${x(.5)} ${y(.5)})"><path d="M${x(.5)} ${y(.22)} Q${x(.62)} ${y(.36)} ${x(.62)} ${y(.62)} H${x(.38)} Q${x(.38)} ${y(.36)} ${x(.5)} ${y(.22)}z" fill="#eceff1" stroke="#455a64" stroke-width="2"/><path d="M${x(.5)} ${y(.22)} Q${x(.57)} ${y(.29)} ${x(.59)} ${y(.36)} H${x(.41)} Q${x(.43)} ${y(.29)} ${x(.5)} ${y(.22)}z" fill="#ef5350"/><circle cx="${x(.5)}" cy="${y(.45)}" r="${r(.065)}" fill="#4fc3f7" stroke="#455a64" stroke-width="3"/><polygon points="${x(.38)},${y(.54)} ${x(.27)},${y(.7)} ${x(.38)},${y(.64)}" fill="#ef5350"/><polygon points="${x(.62)},${y(.54)} ${x(.73)},${y(.7)} ${x(.62)},${y(.64)}" fill="#ef5350"/><rect x="${x(.44)}" y="${y(.62)}" width="${x(.12)}" height="${y(.04)}" fill="#78909c"/><path d="M${x(.45)} ${y(.66)} Q${x(.5)} ${y(.86)} ${x(.55)} ${y(.66)}z" fill="#ffa726"/><path d="M${x(.47)} ${y(.66)} Q${x(.5)} ${y(.76)} ${x(.53)} ${y(.66)}z" fill="#ffee58"/></g>`;
    return s}},
  bahce:{ad:'Çiçek bahçesi',ciz:(W,H)=>{
    const u=Math.min(W,H),x=f=>(f*W).toFixed(1),y=f=>(f*H).toFixed(1),r=f=>(f*u).toFixed(1);
    let s=`<defs><linearGradient id="gb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#81d4fa"/><stop offset="1" stop-color="#e1f5fe"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#gb)"/>`;
    s+=`<circle cx="${x(.15)}" cy="${y(.1)}" r="${r(.08)}" fill="#fff59d"/>`+bulut(W*.6,H*.12,u*.08)+bulut(W*.3,H*.28,u*.05);
    s+=`<path d="M0 ${y(.5)} Q${x(.5)} ${y(.4)} ${x(1)} ${y(.5)} V${y(1)} H0z" fill="#9ccc65"/><rect y="${y(.7)}" width="${W}" height="${y(.3)}" fill="#7cb342"/>`;
    const cicek=(cx,cy,pr,renk,orta)=>{let g=`<line x1="${x(cx)}" y1="${y(cy)}" x2="${x(cx)}" y2="${y(1)}" stroke="#33691e" stroke-width="${r(.012)}"/><ellipse cx="${x(cx+.05)}" cy="${y(cy+.18)}" rx="${r(.04)}" ry="${r(.016)}" fill="#558b2f" transform="rotate(-30 ${x(cx+.05)} ${y(cy+.18)})"/>`;
      for(let i=0;i<8;i++){const a=i*Math.PI/4;g+=`<circle cx="${(W*cx+Math.cos(a)*u*pr*1.1).toFixed(1)}" cy="${(H*cy+Math.sin(a)*u*pr*1.1).toFixed(1)}" r="${(u*pr*.8).toFixed(1)}" fill="${renk}"/>`}
      return g+`<circle cx="${x(cx)}" cy="${y(cy)}" r="${(u*pr*.85).toFixed(1)}" fill="${orta}"/>`};
    s+=cicek(.22,.6,.055,'#f48fb1','#fdd835')+cicek(.55,.52,.07,'#ffee58','#8d6e63')+cicek(.82,.64,.05,'#ce93d8','#ffee58')+cicek(.4,.82,.045,'#ef5350','#fff59d')+cicek(.1,.85,.04,'#fff','#ffb300');
    s+=`<g transform="translate(${x(.65)} ${y(.3)})"><ellipse cx="${r(-.04)}" cy="0" rx="${r(.045)}" ry="${r(.03)}" fill="#ff7043" transform="rotate(-30 ${r(-.04)} 0)"/><ellipse cx="${r(.04)}" cy="0" rx="${r(.045)}" ry="${r(.03)}" fill="#ffa726" transform="rotate(30 ${r(.04)} 0)"/><rect x="${r(-.006)}" y="${r(-.03)}" width="${r(.012)}" height="${r(.06)}" fill="#37474f"/></g>`;
    s+=`<g transform="translate(${x(.3)} ${y(.4)})"><ellipse cx="${r(-.035)}" cy="0" rx="${r(.035)}" ry="${r(.022)}" fill="#7e57c2" transform="rotate(-30 ${r(-.035)} 0)"/><ellipse cx="${r(.035)}" cy="0" rx="${r(.035)}" ry="${r(.022)}" fill="#9575cd" transform="rotate(30 ${r(.035)} 0)"/></g>`;
    s+=`<ellipse cx="${x(.78)}" cy="${y(.9)}" rx="${r(.07)}" ry="${r(.035)}" fill="#f44336"/><circle cx="${x(.75)}" cy="${y(.89)}" r="${r(.008)}" fill="#fff"/><circle cx="${x(.8)}" cy="${y(.9)}" r="${r(.008)}" fill="#fff"/>`;
    return s}}
};
export const SAHNE_LISTESI=Object.entries(SAHNELER).map(([id,v])=>({id,ad:v.ad}));
export const sahneSvg=(id,W,H)=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${(SAHNELER[id]||SAHNELER.koy).ciz(W,H)}</svg>`;
export const sahneUrl=(id,W,H)=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(sahneSvg(id,W,H));
