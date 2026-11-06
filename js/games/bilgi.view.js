import {esc} from '../core/util.js';
import {siralamaHtml,bitisDugmeleri,bitisOlay} from '../core/ui.js';

const HARF=['A','B','C','D'];

export default{
  mount(root,api){
    root.innerHTML='<div class="bg" id="bg"></div>';
    const kok=root.querySelector('#bg');
    let sayac=null,suan=null,oyunNo=null,anahtar=null,secildi=-1;
    const dur=()=>{clearInterval(sayac);sayac=null};
    const kisi=(s,snap,id)=>snap.players.find(p=>p.uid===id);

    function zamanla(){
      const s=suan;if(!s||s.faz!=='soru')return;
      const el=kok.querySelector('#bg-sn'),bar=kok.querySelector('#bg-bar');if(!el)return;
      const kalan=Math.max(0,s.bitis-api.now());
      el.textContent=Math.ceil(kalan/1000);
      bar.style.width=(kalan/s.sureMs*100).toFixed(1)+'%';
      bar.parentElement.classList.toggle('sure--az',kalan<=5000);
    }
    function soruCiz(snap){
      const s=snap.state,q=s.sorular[s.i];
      secildi=s.cevaplar[api.uid]?s.cevaplar[api.uid].c:-1;
      kok.innerHTML=`<div class="is__ust"><span class="pill">Soru ${s.i+1}/${s.toplam}</span><span class="ac__etiket">${esc(q.k)}</span><span class="pill" id="bg-sn"></span></div>
        <div class="sure"><i id="bg-bar"></i></div>
        <h2 class="bg__soru" id="bg-soru">${esc(q.t)}</h2>
        <div class="bg__siklar" id="bg-siklar">${q.o.map((o,i)=>`<button type="button" class="bg__sik" data-c="${i}"><span class="bg__harf">${HARF[i]}</span><span class="bg__metin">${esc(o)}</span><span class="bg__kisiler" aria-hidden="true"></span></button>`).join('')}</div>
        <p class="ipucu ortala" id="bg-durum" aria-live="polite"></p><div id="bg-alt"></div>`;
      dur();sayac=setInterval(zamanla,200);zamanla();
    }
    function guncelle(snap){
      const s=snap.state,q=s.sorular[s.i];
      const bitti=s.faz!=='soru';
      const benim=s.cevaplar[api.uid];
      const dugmeler=[...kok.querySelectorAll('.bg__sik')];
      dugmeler.forEach((b,i)=>{
        b.disabled=bitti||!!benim;
        b.classList.toggle('bg__sik--secili',!bitti&&benim?.c===i);
        b.classList.toggle('bg__sik--dogru',bitti&&i===q.d);
        b.classList.toggle('bg__sik--yanlis',bitti&&benim?.c===i&&i!==q.d);
        const kim=kok.querySelectorAll('.bg__kisiler')[i];
        kim.textContent=bitti?s.kat.filter(id=>s.cevaplar[id]?.c===i&&(snap.players.length>1)).map(id=>kisi(s,snap,id)?.avatar||'🙂').join(''):'';
      });
      const durum=kok.querySelector('#bg-durum'),alt=kok.querySelector('#bg-alt');
      if(!bitti){
        const bekleyen=s.kat.filter(id=>!s.cevaplar[id]).length,cevapladi=s.kat.length-bekleyen;
        durum.textContent=benim?(s.kat.length>1?`Cevabın alındı · ${cevapladi}/${s.kat.length} kişi cevapladı`:'Cevabın alındı'):'Bir şık seç';
        alt.innerHTML='';
      }else{
        const p=s.puanlar[api.uid]||0;
        const dogruMu=benim&&benim.c===q.d;
        durum.innerHTML=!benim?'<b>Süre doldu</b>':dogruMu?`<b class="bg__ok">Doğru! +${p}</b>`:'<b class="bg__hata">Yanlış</b>';
        alt.innerHTML=s.kat.length>1?`<ul class="bg__puanlar">${[...s.kat].sort((a,b)=>(s.skor[b]||0)-(s.skor[a]||0)).map(id=>{const k=kisi(s,snap,id);return`<li><span>${esc(k?.avatar||'🙂')} ${esc(k?.name||'?')}</span><span class="bg__art">${s.puanlar[id]?'+'+s.puanlar[id]:''}</span><b>${s.skor[id]||0}</b></li>`}).join('')}</ul>`:'';
      }
    }
    function bitisCiz(snap){
      const s=snap.state;
      const solo=s.kat.length<2;
      const toplam=s.toplam;
      const d=s.dogru[api.uid]||0;
      const mesaj=d===toplam?'Mükemmel!':d>=toplam*0.7?'Harika!':d>=toplam*0.4?'İyi gidiyor!':'Bir sonrakinde daha iyi olacak!';
      kok.innerHTML=`<div class="bitis__ikon">🏆</div><h2 class="bitis__baslik">${solo?mesaj:'Yarışma bitti'}</h2>${solo?`<p class="ortala">${toplam} sorudan <b>${d}</b> doğru · <b>${s.skor[api.uid]||0}</b> puan</p>`:siralamaHtml(snap.players,s.skor,{ek:p=>`${s.dogru[p.uid]||0}/${toplam} doğru`})}${bitisDugmeleri(api)}`;
    }

    kok.addEventListener('click',e=>{
      const b=e.target.closest('.bg__sik');
      if(!b||b.disabled||!suan||suan.faz!=='soru')return;
      const c=Number(b.dataset.c);
      secildi=c;
      b.classList.add('bg__sik--secili');
      kok.querySelectorAll('.bg__sik').forEach(x=>{x.disabled=true});
      api.dispatch('sec',{c});
    });
    bitisOlay(kok,api);

    return{
      update(snap){
        const s=snap.state;if(!s)return;
        suan=s;
        if(s.oyun!==oyunNo){oyunNo=s.oyun;anahtar=null}
        if(s.faz==='bitti'){dur();anahtar='bitti';bitisCiz(snap);return}
        const k=s.oyun+':'+s.i;
        if(anahtar!==k){anahtar=k;soruCiz(snap)}
        guncelle(snap);
      },
      destroy(){dur();root.innerHTML=''}
    };
  }
};
