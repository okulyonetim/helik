import {esc,up,ALFABE} from '../core/util.js';
import {siralamaHtml,bitisDugmeleri,bitisOlay} from '../core/ui.js';

const PARCA=10;
/* Klasik çizim: yanlış sayısına göre parça parça belirir */
function adamSvg(yanlis,hak,kaybetti){
  const goster=kaybetti?PARCA:Math.round(yanlis*PARCA/hak);
  const p=[
    '<line x1="20" y1="205" x2="140" y2="205"/>',
    '<line x1="50" y1="205" x2="50" y2="20"/>',
    '<line x1="50" y1="20" x2="130" y2="20"/>',
    '<line x1="50" y1="50" x2="80" y2="20"/>',
    '<line x1="130" y1="20" x2="130" y2="45"/>',
    '<circle cx="130" cy="62" r="17"/>',
    '<line x1="130" y1="79" x2="130" y2="135"/>',
    '<line x1="130" y1="92" x2="108" y2="118"/>',
    '<line x1="130" y1="92" x2="152" y2="118"/>',
    '<line x1="130" y1="135" x2="112" y2="170"/><line x1="130" y1="135" x2="148" y2="170"/>'
  ];
  return`<svg viewBox="0 0 200 220" class="ac__cizim" role="img" aria-label="${goster} parça çizildi" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round">${p.slice(0,goster).join('')}</svg>`;
}
/* Balon çizimi: her yanlışta bir balon patlar (çocuklar için daha yumuşak) */
const BALON_RENK=['#ef4444','#f59e0b','#22c55e','#3b82f6','#a855f7','#ec4899','#14b8a6','#f97316','#6366f1','#84cc16'];
function balonSvg(yanlis,hak){
  const kalan=hak-yanlis,els=[];
  for(let i=0;i<hak;i++){
    if(i>=kalan)continue;
    const t=hak===1?0.5:i/(hak-1);
    const x=30+t*180,y=62-Math.sin(t*Math.PI)*26;
    els.push(`<line x1="${x.toFixed(1)}" y1="${(y+24).toFixed(1)}" x2="120" y2="140" stroke="currentColor" stroke-width="1.5"/><ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="17" ry="22" fill="${BALON_RENK[i%BALON_RENK.length]}"/>`);
  }
  return`<svg viewBox="0 0 240 230" class="ac__cizim" role="img" aria-label="${kalan} balon kaldı">${els.join('')}<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><circle cx="120" cy="158" r="12" fill="var(--kart-bg)"/><line x1="120" y1="170" x2="120" y2="200"/><line x1="120" y1="178" x2="104" y2="156"/><line x1="120" y1="178" x2="120" y2="145"/><line x1="120" y1="200" x2="106" y2="224"/><line x1="120" y1="200" x2="134" y2="224"/></g><circle cx="116" cy="156" r="1.6" fill="currentColor"/><circle cx="124" cy="156" r="1.6" fill="currentColor"/><path d="M114 162 Q120 167 126 162" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>`;
}

export default{
  mount(root,api){
    root.innerHTML=`<div class="ac">
      <div id="ac-ust"></div>
      <p class="hf__durum" id="ac-durum" aria-live="polite"></p>
      <form id="ac-koy" class="kart" hidden><label class="etiket" for="ac-kw">Kelimeyi yaz (diğerleri görmesin!)</label><input class="alan" id="ac-kw" maxlength="14" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="Örn: BALIK"><label class="etiket" for="ac-ki">İpucu (isteğe bağlı)</label><input class="alan" id="ac-ki" maxlength="24" autocomplete="off" placeholder="Örn: denizde yaşar"><button type="submit" class="btn btn--ana btn--buyuk">Kelimeyi gönder</button></form>
      <div class="ac__klavye" id="ac-klavye">${ALFABE.map(h=>`<button type="button" class="ac__tus" data-h="${h}">${h}</button>`).join('')}</div>
      <div class="ac__bilkutu" id="ac-bilkutu"><button type="button" class="btn btn--ikincil" id="ac-bilbtn">Kelimeyi bil</button>
        <form id="ac-bil" hidden><input class="alan" id="ac-bw" maxlength="14" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="Kelime tahmini"><button type="submit" class="btn btn--ana">Gönder</button></form>
        <p class="ipucu" id="ac-bilip" hidden>Yanlış bilirsen 2 hak gider.</p></div>
      <div id="ac-sonuc"></div></div>`;
    const q=s=>root.querySelector(s);
    const ust=q('#ac-ust'),durum=q('#ac-durum'),koy=q('#ac-koy'),klavye=q('#ac-klavye'),bilkutu=q('#ac-bilkutu'),bil=q('#ac-bil'),bilbtn=q('#ac-bilbtn'),bilip=q('#ac-bilip'),sonuc=q('#ac-sonuc');
    let oyunNo=null,tur=null;
    const tuslar=Object.fromEntries([...klavye.children].map(b=>[b.dataset.h,b]));
    klavye.addEventListener('click',e=>{const b=e.target.closest('[data-h]');if(b&&!b.disabled)api.dispatch('tahmin',{h:b.dataset.h})});
    bilbtn.addEventListener('click',()=>{const ac=bil.hidden;bil.hidden=!ac;bilip.hidden=!ac;if(ac)q('#ac-bw').focus()});
    bil.addEventListener('submit',e=>{e.preventDefault();const w=up(q('#ac-bw').value);if(!w)return;api.dispatch('bil',{w});q('#ac-bw').value='';bil.hidden=true;bilip.hidden=true});
    koy.addEventListener('submit',e=>{
      e.preventDefault();
      const w=up(q('#ac-kw').value);
      if(w.length<3||w.length>14||[...w].some(c=>!ALFABE.includes(c))){q('#ac-kw').setCustomValidity('3–14 harf, yalnızca Türkçe harfler');q('#ac-kw').reportValidity();setTimeout(()=>q('#ac-kw').setCustomValidity(''),1500);return}
      api.dispatch('kelime',{w,ipucu:q('#ac-ki').value});
      q('#ac-kw').value='';q('#ac-ki').value='';
    });
    bitisOlay(sonuc,api);
    const ad=(snap,uid)=>{const p=snap.players.find(x=>x.uid===uid);return p?`${p.avatar||''} ${esc(p.name)}`:'…'};

    return{
      update(snap){
        const s=snap.state;if(!s)return;
        if(s.oyun!==oyunNo){oyunNo=s.oyun;tur=null;sonuc.innerHTML=''}
        if(s.tur!==tur){tur=s.tur;bil.hidden=true;bilip.hidden=true;q('#ac-bw').value='';sonuc.innerHTML=''}
        const benKoyan=s.koyan===api.uid;
        const oynuyor=s.faz==='oyun';
        const benim=oynuyor&&s.sira===api.uid;
        const bitti=s.faz==='arada'||s.faz==='bitti';
        const kaybetti=bitti&&s.sonuc==='kaybetti';
        /* üst bölüm */
        const kelimeHtml=s.faz==='kelime'?'':[...s.kelime].map(c=>{
          const acik=s.tahmin.includes(c);
          return`<span class="ac__harf${acik?' ac__harf--acik':''}${!acik&&bitti?' ac__harf--kacirilan':''}">${acik||bitti?esc(c):''}</span>`;
        }).join('');
        const etiket=s.faz==='kelime'?'':(s.ipucu?`İpucu: ${esc(s.ipucu)}`:s.kat?esc(({hayvan:'Hayvan',yiyecek:'Yiyecek',sehir:'Şehir',esya:'Eşya',meslek:'Meslek',ulke:'Ülke'})[s.kat]||''):'');
        const hak=s.hak-s.yanlis;
        ust.innerHTML=`<div class="ac__bilgi"><span>Kelime ${s.tur}/${s.toplam}</span>${etiket?`<span class="ac__etiket">${etiket}</span>`:''}${s.faz==='kelime'?'':`<span>Kalan hak: <b>${hak}</b></span>`}</div>${s.faz==='kelime'?'':(s.cizim==='balon'?balonSvg(s.yanlis,s.hak):adamSvg(s.yanlis,s.hak,kaybetti))}<div class="ac__kelime" role="text" aria-label="${s.faz==='kelime'?'Kelime bekleniyor':[...s.kelime].map(c=>s.tahmin.includes(c)||bitti?c:'boş').join(' ')}">${kelimeHtml}</div>`;
        /* klavye */
        const sahipli=s.faz!=='kelime';
        klavye.hidden=!sahipli;
        for(const h of ALFABE){
          const b=tuslar[h],kullanildi=s.tahmin.includes(h);
          b.classList.toggle('dogru',kullandiDogru(s,h,kullanildi));
          b.classList.toggle('yanlis',kullanildi&&!s.kelime.includes(h));
          b.disabled=!benim||kullanildi;
        }
        bilkutu.hidden=!benim;
        if(!benim){bil.hidden=true;bilip.hidden=true}
        /* durum */
        koy.hidden=!(s.faz==='kelime'&&benKoyan);
        if(s.faz==='kelime')durum.textContent=benKoyan?'Sıra sende: bir kelime seç!':`${snap.players.find(p=>p.uid===s.koyan)?.name||'Biri'} bir kelime düşünüyor…`;
        else if(s.faz==='arada'||s.faz==='bitti')durum.textContent=s.sonuc==='kazandi'?'Bildiniz! 🎉':'Olmadı… 😕 Kelime yukarıda.';
        else durum.textContent=benim?'Sıra sende! Bir harf seç':`Sıra: ${ad(snap,s.sira)}${s.koyan?` · Kelimeyi yazan: ${ad(snap,s.koyan)}`:''}`;
        durum.classList.toggle('hf__durum--ben',benim||(s.faz==='kelime'&&benKoyan));
        /* sonuç */
        if(s.faz==='arada')sonuc.innerHTML=`<p class="ipucu ortala">Sonraki kelime birazdan geliyor…</p>`;
        else if(s.faz==='bitti'){
          const solo=snap.players.filter(p=>!p.spectator).length<2;
          sonuc.innerHTML=`<div class="bitis__ikon">${s.sonuc==='kazandi'?'🎉':'🏁'}</div><h2 class="bitis__baslik">Oyun bitti</h2>${solo?`<p class="ortala">Toplam puanın: <b>${s.skor[api.uid]||0}</b></p>`:siralamaHtml(snap.players,s.skor)}${bitisDugmeleri(api)}`;
        }else if(sonuc.innerHTML)sonuc.innerHTML='';
      },
      destroy(){root.innerHTML=''}
    };
  }
};
const kullandiDogru=(s,h,k)=>k&&s.kelime.includes(h);
