import {esc,up} from '../core/util.js';
import {siralamaHtml,bitisDugmeleri,bitisOlay} from '../core/ui.js';
import {puanla} from './isimsehir.puan.js';

export default{
  mount(root,api){
    root.innerHTML='<div class="is" id="is"></div>';
    const kok=root.querySelector('#is');
    let oyunNo=null,turAnahtar=null,faz=null,suan=null,sayac=null,kilit=false,sonGonderim=0;
    const ad=(s,id)=>s.adlar[id]?`${s.adlar[id].avatar||''} ${esc(s.adlar[id].name)}`:'…';
    const dur=()=>{clearInterval(sayac);sayac=null};
    const girdiler=()=>[...kok.querySelectorAll('#is-form input')];
    const cevapAl=()=>Object.fromEntries(girdiler().map(i=>[i.dataset.k,i.value.trim()]));
    const kilitle=v=>{kilit=v;girdiler().forEach(i=>{i.disabled=v})};

    function gonder(){
      sonGonderim=Date.now();
      api.dispatch('cevap',{a:cevapAl()});
    }
    function durGuncelle(){
      const d=kok.querySelector('#is-dur');if(!d||!suan)return;
      const dolu=girdiler().every(i=>i.value.trim());
      const dese=!suan.durBy&&!kilit;
      d.disabled=!(dolu&&dese);
      d.textContent=kilit?'Diğerleri bitiriyor…':suan.durBy?'Süre azalıyor!':dolu?'DUR!':'Önce hepsini doldur';
    }
    function zamanla(){
      const s=suan;if(!s||s.faz!=='tur')return;
      const simdi=api.now();
      const sn=Math.max(0,Math.ceil((s.bitis-simdi)/1000));
      const el=kok.querySelector('#is-sn'),bar=kok.querySelector('#is-bar'),afis=kok.querySelector('#is-afis');
      if(!el)return;
      el.textContent=sn;el.classList.toggle('pill--az',sn<=10);
      bar.style.width=Math.max(0,(s.bitis-simdi)/s.sureMs*100).toFixed(1)+'%';
      bar.parentElement.classList.toggle('sure--az',sn<=10);
      if(s.durBy){
        const kalan=Math.max(0,Math.ceil((s.endsAt-simdi)/1000));
        afis.hidden=false;
        afis.textContent=s.durBy===api.uid?`DUR dedin! ${kalan} sn`:`${s.adlar[s.durBy]?.name||'Biri'} DUR dedi! ${kalan} sn kaldı`;
      }
      /* süre bitti: cevapları gönder (sunucu kabul edene dek tekrarlanır) */
      if(simdi>=s.endsAt&&!s.cevaplar[api.uid]&&Date.now()-sonGonderim>1500){kilitle(true);gonder();const d=kok.querySelector('#is-dur');if(d){d.disabled=true;d.textContent='Cevaplar toplanıyor…'}}
    }

    function turKur(s){
      kilit=false;sonGonderim=0;
      kok.innerHTML=`<div class="is__ust"><span class="pill">Tur ${s.tur}/${s.toplam}</span><span class="pill" id="is-sn"></span></div>
        <div class="sure"><i id="is-bar"></i></div>
        <div class="is__harf"><div class="is__harfkutu" role="img" aria-label="Harf ${esc(s.harf)}">${esc(s.harf)}</div><p class="ipucu ortala"><b>${esc(s.harf)}</b> ile başlayan cevaplar yaz</p></div>
        <div id="is-afis" class="is__afis" role="status" aria-live="polite" hidden></div>
        <form id="is-form" autocomplete="off" novalidate>${s.kategoriler.map(k=>`<label class="is__in"><span>${esc(k.ad)}</span><input class="alan" data-k="${esc(k.id)}" autocomplete="off" autocapitalize="words" enterkeyhint="next" spellcheck="false" aria-label="${esc(k.ad)} (${esc(s.harf)} ile)"></label>`).join('')}</form>
        <div class="alt"><button type="button" class="btn btn--ana btn--buyuk" id="is-dur" disabled>Önce hepsini doldur</button></div>`;
      kok.querySelector('#is-form').addEventListener('input',e=>{
        const t=e.target,v=up(t.value);
        t.classList.toggle('is__ok',!!v&&v[0]===suan.harf);
        t.classList.toggle('is__yanlis',!!v&&v[0]!==suan.harf);
        durGuncelle();
      });
      kok.querySelector('#is-form').addEventListener('keydown',e=>{
        if(e.key!=='Enter')return;
        e.preventDefault();
        const l=girdiler(),i=l.indexOf(e.target);
        if(i<l.length-1)l[i+1].focus();else e.target.blur();
      });
      kok.querySelector('#is-dur').addEventListener('click',()=>{
        if(kilit)return;
        sonGonderim=Date.now();
        api.dispatch('dur',{a:cevapAl()});
        kilitle(true);durGuncelle();
      });
      girdiler()[0]?.focus({preventScroll:true});
      dur();sayac=setInterval(zamanla,200);zamanla();
    }
    function turGuncelle(s){
      /* DUR'u başkası aldıysa ve bizimki kabul edilmediyse kilidi aç */
      if(kilit&&!s.cevaplar[api.uid]&&s.durBy&&s.durBy!==api.uid&&api.now()<s.endsAt)kilitle(false);
      if(s.cevaplar[api.uid]&&!kilit)kilitle(true);
      durGuncelle();zamanla();
    }

    function oyEkrani(s){
      const y=window.scrollY;
      const {pts,det}=puanla(s);
      const son=s.tur>=s.toplam;
      const benim=api.uid;
      const chip=(id,k)=>{
        const d=det[id+'|'+k.id];
        if(d.durum==='bos')return'<span class="ans ans--bos" aria-label="boş">—</span>';
        if(d.durum==='harf')return`<span class="ans ans--harf">${esc(d.a)}<small>harf uymuyor</small></span>`;
        if(d.durum==='kisa')return`<span class="ans ans--harf">${esc(d.a)}<small>çok kısa</small></span>`;
        if(d.durum==='ok')return`<span class="ans ans--ok">${esc(d.a)}<small>bilinen cevap ✓</small></span>`;
        const oyumVar=(s.oy[id+'|'+k.id]||[]).includes(benim);
        const metin=`${esc(d.a)}${d.red?`<small>${d.red} ret${oyumVar?' (sen)':''}</small>`:''}`;
        if(id===benim)return`<span class="ans ans--${d.durum}">${metin}</span>`;
        return`<button type="button" class="ans ans--${d.durum}${oyumVar?' ans--oyum':''}" data-k="${esc(id)}|${esc(k.id)}" aria-label="${esc(s.adlar[id]?.name||'')}: ${esc(d.a)}, ${d.durum==='red'?'geçersiz':'geçerli'}. Oyunu değiştirmek için dokun">${metin}</button>`;
      };
      const siralama=s.kat.map(id=>({id,add:pts[id],toplam:(s.skor[id]||0)+pts[id]})).sort((a,b)=>b.toplam-a.toplam);
      const insan=s.insanlar.length,hazirSay=s.insanlar.filter(id=>s.hazir[id]).length;
      const hazirMi=!!s.hazir[benim];
      kok.innerHTML=`<header class="is__baslik"><h2>${s.tur}. tur · <span class="is__vurgu">${esc(s.harf)}</span></h2><p class="ipucu">Şüpheli bir cevaba dokunarak “geçersiz” oyu ver; tekrar dokunursan geri alırsın. Tek cevap 10, aynı cevap 5 puan.</p></header>
        ${s.kategoriler.map(k=>`<section class="kart is__kart"><h3>${esc(k.ad)}</h3>${s.kat.map(id=>{const d=det[id+'|'+k.id];return`<div class="is__satir"><span class="is__ad">${ad(s,id)}</span>${chip(id,k)}<span class="is__pt${d.p?'':' is__pt--sifir'}">${d.p?'+'+d.p:'0'}</span></div>`}).join('')}</section>`).join('')}
        <section class="kart"><div class="etiket">Puan durumu</div>${siralama.map((p,i)=>`<div class="is__toplam${i===0?' is__toplam--ilk':''}"><span class="is__sira">${i+1}</span><span class="is__ad">${ad(s,p.id)}</span><span><span class="is__art">+${p.add}</span> <b>${p.toplam}</b></span></div>`).join('')}</section>
        <div class="alt"><button type="button" class="btn btn--ana btn--buyuk" data-is="hazir"${hazirMi?' disabled':''}>${hazirMi?`Bekleniyor… (${hazirSay}/${insan})`:son?'Sonuçları gör':'Tamam, sonraki tur'}</button></div>`;
      window.scrollTo(0,y);
    }
    function bitisEkrani(s){
      const liste=s.kat.map(id=>({uid:id,name:s.adlar[id]?.name||'?',avatar:s.adlar[id]?.avatar}));
      const en=Math.max(...liste.map(p=>s.skor[p.uid]||0));
      const kazan=liste.filter(p=>(s.skor[p.uid]||0)===en);
      const solo=s.insanlar.length<2;
      const bot=s.botlar.length>0;
      kok.innerHTML=`<div class="bitis__ikon">🏆</div><h2 class="bitis__baslik">${kazan.length>1?'Berabere!':esc(kazan[0].name)+' kazandı!'}</h2>${siralamaHtml(liste,s.skor)}${solo&&!bot?'':''}${bitisDugmeleri(api)}`;
    }

    kok.addEventListener('click',e=>{
      const b=e.target.closest('.ans[data-k]');
      if(b){api.dispatch('oy',{k:b.dataset.k});return}
      if(e.target.closest('[data-is="hazir"]'))api.dispatch('hazir');
    });
    bitisOlay(kok,api);

    return{
      update(snap){
        const s=snap.state;if(!s)return;
        suan=s;
        if(s.oyun!==oyunNo){oyunNo=s.oyun;turAnahtar=null;faz=null}
        if(s.faz==='tur'){
          const anahtar=s.oyun+':'+s.tur;
          if(turAnahtar!==anahtar||faz!=='tur'){turAnahtar=anahtar;faz='tur';turKur(s);if(s.cevaplar[api.uid])kilitle(true)}
          else turGuncelle(s);
        }else{
          dur();faz=s.faz;
          if(s.faz==='oy')oyEkrani(s);else bitisEkrani(s);
        }
      },
      destroy(){dur();root.innerHTML=''}
    };
  }
};
