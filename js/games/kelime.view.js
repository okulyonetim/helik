import {esc,up,shuffle} from '../core/util.js';
import {siralamaHtml,bitisDugmeleri,bitisOlay} from '../core/ui.js';
import {yukle,hazirMi,gecerli,hepsiniBul,puanOf} from './kelime.sozluk.js';

export default{
  mount(root,api){
    root.innerHTML='<div class="kl" id="kl"></div>';
    const kok=root.querySelector('#kl');
    let sayac=null,suan=null,snapSon=null,oyunNo=null,anahtar=null,faz=null;
    let sira=[],giris=[],bekleyen=null,oncekiSayi=0,mesajSil=null,yok=false;
    const dur=()=>{clearInterval(sayac);sayac=null};
    const q=s=>kok.querySelector(s);
    const harfler=()=>suan?.harfler||[];

    function mesaj(metin,tur=''){
      const m=q('#kl-mesaj');if(!m)return;
      m.textContent=metin;m.className='kl__mesaj'+(tur?' kl__mesaj--'+tur:'');
      clearTimeout(mesajSil);mesajSil=setTimeout(()=>{const x=q('#kl-mesaj');if(x){x.textContent='';x.className='kl__mesaj'}},2200);
    }
    function tasCiz(){
      const h=harfler();
      q('#kl-taslar').innerHTML=sira.map(i=>`<button type="button" class="kl__tas" data-i="${i}"${giris.includes(i)?' disabled':''} aria-label="${esc(up(h[i]))}">${esc(up(h[i]))}</button>`).join('');
      const g=q('#kl-giris');
      g.innerHTML=giris.length?giris.map(i=>`<span class="kl__harf">${esc(up(h[i]))}</span>`).join(''):'<span class="kl__bos">Harflere dokun</span>';
    }
    function gonder(){
      const s=suan;if(!s||s.faz!=='tur')return;
      const w=giris.map(i=>s.harfler[i]).join('');
      if(w.length<3){mesaj('En az 3 harf gerekir','hata');return}
      if((s.bulunan[api.uid]||[]).includes(w)){mesaj('Bu kelimeyi zaten buldun','hata');giris=[];tasCiz();return}
      if(hazirMi()&&!gecerli(w)){mesaj(`Sözlükte yok: ${up(w)}`,'hata');q('#kl-giris').classList.remove('kl__titre');void q('#kl-giris').offsetWidth;q('#kl-giris').classList.add('kl__titre');return}
      bekleyen={w,t:Date.now()};
      api.dispatch('kelime',{w});
      giris=[];tasCiz();mesaj('Kontrol ediliyor…');
    }
    function sil(){giris.pop();tasCiz()}

    function zamanla(){
      const s=suan;if(!s)return;
      if(s.faz==='tur'){
        const kalan=Math.max(0,s.bitis-api.now()),el=q('#kl-sn'),bar=q('#kl-bar');if(!el)return;
        el.textContent=Math.ceil(kalan/1000);el.classList.toggle('pill--az',kalan<=10000);
        bar.style.width=(kalan/s.sureMs*100).toFixed(1)+'%';bar.parentElement.classList.toggle('sure--az',kalan<=10000);
        if(bekleyen&&Date.now()-bekleyen.t>2500){mesaj('Kabul edilmedi','hata');bekleyen=null}
      }else if(s.faz==='ara'){
        const e=q('#kl-ara');if(e)e.textContent=Math.max(0,Math.ceil((s.araBitis-api.now())/1000));
      }
    }

    function turKur(s){
      sira=s.harfler.map((_,i)=>i);giris=[];bekleyen=null;oncekiSayi=(s.bulunan[api.uid]||[]).length;
      kok.innerHTML=`<div class="is__ust"><span class="pill">Tur ${s.tur}/${s.toplam}</span><span class="pill" id="kl-sn"></span></div>
        <div class="sure"><i id="kl-bar"></i></div>
        <div class="kl__giris" id="kl-giris" aria-live="polite"></div>
        <p class="kl__mesaj" id="kl-mesaj" role="status"></p>
        <div class="kl__taslar" id="kl-taslar"></div>
        <div class="kl__dugmeler"><button type="button" class="btn btn--ikincil" data-kl="karistir">🔀 Karıştır</button><button type="button" class="btn btn--ikincil" data-kl="sil">⌫ Sil</button><button type="button" class="btn btn--ana" data-kl="gonder">Gönder ✔</button></div>
        <p class="ipucu ortala" id="kl-digerleri"></p>
        <div class="etiket">Bulduklarım <span id="kl-say"></span></div><div class="cipler" id="kl-liste"></div>`;
      tasCiz();dur();sayac=setInterval(zamanla,250);zamanla();
    }
    function turGuncelle(snap){
      const s=snap.state;
      const benim=s.bulunan[api.uid]||[];
      if(benim.length>oncekiSayi){
        const yeni=benim[benim.length-1];
        if(bekleyen&&bekleyen.w===yeni){mesaj(`Bulundu! +${puanOf(yeni)}`,'ok');bekleyen=null}
        oncekiSayi=benim.length;
      }
      q('#kl-say').textContent=`(${benim.length} · ${s.turPuan[api.uid]||0} puan)`;
      q('#kl-liste').innerHTML=[...benim].reverse().sort((a,b)=>b.length-a.length).map(w=>`<span class="kl__chip">${esc(up(w))}<small>+${puanOf(w)}</small></span>`).join('')||'<span class="ipucu">Henüz kelime yok</span>';
      const digerleri=snap.players.filter(p=>!p.spectator&&p.uid!==api.uid);
      q('#kl-digerleri').textContent=digerleri.length?digerleri.map(p=>`${p.avatar||''} ${p.name}: ${(s.bulunan[p.uid]||[]).length}`).join('  ·  '):'';
      zamanla();
    }
    function panelCiz(snap){
      const s=snap.state,bitti=s.faz==='bitti';
      dur();
      const benim=s.bulunan[api.uid]||[];
      const kacan=hazirMi()?hepsiniBul(s.harfler,{yalnizYaygin:true}).filter(w=>!benim.includes(w)&&w.length>=4).slice(0,16):[];
      const solo=s.kat.length<2;
      kok.innerHTML=`<div class="bitis__ikon">${bitti?'🏆':'⏱️'}</div><h2 class="bitis__baslik">${bitti?'Oyun bitti':`${s.tur}. tur bitti`}</h2>
        <p class="ortala">Bütün harflerle yazılan kelime: <b>${esc(up(s.tohum))}</b></p>
        ${solo?`<p class="ortala"><b>${benim.length}</b> kelime · bu tur <b>${s.turPuan[api.uid]||0}</b> puan · toplam <b>${s.skor[api.uid]||0}</b></p>`:siralamaHtml(snap.players,s.skor,{ek:p=>`+${s.turPuan[p.uid]||0} · ${(s.bulunan[p.uid]||[]).length} kelime`})}
        <div class="etiket">Senin kelimelerin</div><div class="cipler">${[...benim].sort((a,b)=>b.length-a.length).map(w=>`<span class="kl__chip">${esc(up(w))}<small>+${puanOf(w)}</small></span>`).join('')||'<span class="ipucu">Bu turda kelime bulamadın</span>'}</div>
        ${kacan.length?`<div class="etiket">Bunları da yazabilirdin</div><div class="cipler">${kacan.map(w=>`<span class="kl__chip kl__chip--soluk">${esc(up(w))}</span>`).join('')}</div>`:''}
        ${bitti?bitisDugmeleri(api):`<p class="ipucu ortala">Sonraki tur <b id="kl-ara">…</b> sn içinde başlıyor</p>`}`;
      if(!bitti){sayac=setInterval(zamanla,500);zamanla()}
    }

    kok.addEventListener('click',e=>{
      const t=e.target.closest('.kl__tas');
      if(t&&!t.disabled&&suan?.faz==='tur'){giris.push(Number(t.dataset.i));tasCiz();return}
      const d=e.target.closest('[data-kl]');
      if(!d)return;
      if(d.dataset.kl==='sil')sil();
      else if(d.dataset.kl==='gonder')gonder();
      else if(d.dataset.kl==='karistir'){sira=shuffle(sira);tasCiz()}
    });
    const tus=e=>{
      if(faz!=='tur'||e.ctrlKey||e.metaKey||e.altKey)return;
      if(/^(INPUT|TEXTAREA)$/.test(e.target?.tagName||''))return;
      if(e.key==='Enter'){e.preventDefault();gonder();return}
      if(e.key==='Backspace'){e.preventDefault();sil();return}
      if(e.key.length===1){
        const c=e.key.toLocaleLowerCase('tr');
        const i=harfler().findIndex((h,k)=>h===c&&!giris.includes(k));
        if(i>=0){giris.push(i);tasCiz()}
      }
    };
    document.addEventListener('keydown',tus);
    bitisOlay(kok,api);

    kok.innerHTML='<p class="ipucu ortala" style="margin-top:30vh">Sözlük yükleniyor…</p>';
    yukle().then(()=>{if(!yok&&snapSon)arayuz.update(snapSon)}).catch(()=>{if(!yok)kok.innerHTML='<p class="ortala">Sözlük yüklenemedi. İnternetini kontrol edip tekrar dene.</p>'});

    const arayuz={
      update(snap){
        const s=snap.state;if(!s)return;
        snapSon=snap;suan=s;
        if(!hazirMi())return;
        if(s.oyun!==oyunNo){oyunNo=s.oyun;anahtar=null}
        if(s.faz==='tur'){
          const k=s.oyun+':'+s.tur;
          if(anahtar!==k||faz!=='tur'){anahtar=k;faz='tur';turKur(s)}
          turGuncelle(snap);
        }else{
          const k=s.oyun+':'+s.tur+':'+s.faz;
          faz=s.faz;
          if(anahtar!==k){anahtar=k;panelCiz(snap)}
        }
      },
      destroy(){yok=true;dur();clearTimeout(mesajSil);document.removeEventListener('keydown',tus);root.innerHTML=''}
    };
    /* yukle().then içinde "this" kullanılamayacağı için arayüze bağlanır */
    return arayuz;
  }
};
