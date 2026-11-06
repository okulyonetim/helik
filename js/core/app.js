/* Uygulama kabuğu: profil, ana ekran, oda kur/katıl, lobi, oyun ekranı, aile soruları. */
import {esc,kodTemiz,yeniKod} from './util.js';
import {AVATARLAR,profilOku,profilYaz,aileSorulari,aileSorulariYaz} from './profile.js';
import {createMemoryHub} from './db-memory.js';
import {Room,OdaHatasi} from './room.js';
import {ayarVar,baglan} from './db-firebase.js';
import {toast,onay,skorSeridi,kopyala} from './ui.js';
import {LIST,GAMES} from '../games/index.js';
import {FIREBASE} from '../config.js';

const kok=document.getElementById('app');
const S={profil:profilOku(),room:null,off:null,gorunum:null,gorunumId:null,fb:null,taslak:{},soloSec:null};
const onlineVar=ayarVar(FIREBASE);

const yaz=(html,sinif='')=>{kok.className='ekran '+sinif;kok.innerHTML=html;window.scrollTo(0,0)};
const modAyarla=()=>{document.documentElement.dataset.mod=S.profil?.age==='cocuk'?'cocuk':'yetiskin'};

/* ── Profil ── */
function profilEkrani(ilk){
  const p=S.profil||{name:'',avatar:AVATARLAR[0],age:'yetiskin'};
  yaz(`<section class="kart kart--genis"><h1>${ilk?'Hoş geldin!':'Profilim'}</h1><p class="ipucu">Ailen seni oyunlarda bu adla ve simgeyle görecek.</p>
    <label class="etiket" for="pad">Adın</label><input id="pad" class="alan" maxlength="14" autocomplete="off" placeholder="Adını yaz" value="${esc(p.name)}">
    <div class="etiket">Simgen</div><div class="avatarlar" role="radiogroup" aria-label="Simge seç">${AVATARLAR.map(a=>`<button type="button" class="av" role="radio" aria-checked="${a===p.avatar}" data-av="${a}">${a}</button>`).join('')}</div>
    <div class="etiket">Kimsin?</div><div class="seg" role="group"><button type="button" class="seg__b" data-yas="cocuk" aria-pressed="${p.age==='cocuk'}">🧒 Çocuk</button><button type="button" class="seg__b" data-yas="yetiskin" aria-pressed="${p.age!=='cocuk'}">🧑 Yetişkin</button></div>
    <p class="ipucu">Çocuk seçersen yazılar büyür, sorular ve oyunlar kolaylaşır.</p>
    <div class="satir"><button type="button" class="btn btn--ana" id="kaydet">Kaydet</button>${ilk?'':'<button type="button" class="btn btn--ikincil" id="vazgec">Vazgeç</button>'}</div></section>`);
  const sec={...p};
  const ad=document.getElementById('pad');
  kok.onclick=e=>{
    const a=e.target.closest('[data-av]'),y=e.target.closest('[data-yas]');
    if(a){sec.avatar=a.dataset.av;kok.querySelectorAll('[data-av]').forEach(b=>b.setAttribute('aria-checked',String(b===a)))}
    else if(y){sec.age=y.dataset.yas;kok.querySelectorAll('[data-yas]').forEach(b=>b.setAttribute('aria-pressed',String(b===y)))}
    else if(e.target.id==='kaydet'){
      const n=ad.value.trim();
      if(!n){toast('Önce adını yaz');ad.focus();return}
      S.profil={name:n.slice(0,14),avatar:sec.avatar,age:sec.age};profilYaz(S.profil);modAyarla();
      yonlendir();
    }else if(e.target.id==='vazgec')ana();
  };
}

/* ── Ana ekran ── */
function ana(){
  ayril();
  const kartlar=LIST.map(g=>`<button type="button" class="oyunkart" style="--kart:${g.renk}" data-oyun="${g.id}"><span class="oyunkart__ikon" aria-hidden="true">${g.ikon}</span><strong>${esc(g.name)}</strong><small>${esc(g.ozet)}</small></button>`).join('');
  yaz(`<header class="baslik"><div><h1>Aile Oyunları</h1><p class="ipucu">Merhaba ${esc(S.profil.name)}! Ne oynayalım?</p></div><button type="button" class="avbtn" data-act="profil" aria-label="Profilim">${esc(S.profil.avatar)}</button></header>
    <section class="kart katil"><label class="etiket" for="kod">Odaya katıl</label><div class="satir"><input id="kod" class="alan alan--kod" maxlength="5" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="KOD" aria-label="Oda kodu"><button type="button" class="btn btn--ana" data-act="katil">Katıl</button></div>${onlineVar?'':'<p class="ipucu">Online oynamak için Firebase ayarı gerekir (README). Şimdilik tek başına oynayabilirsin.</p>'}</section>
    <div class="oyunlar">${kartlar}</div>
    <button type="button" class="kart kart--link" data-act="aile"><span class="oyunkart__ikon" aria-hidden="true">📝</span><span><strong>Aile soruları</strong><small>Bilgi Yarışması için kendi sorularını yaz (${aileSorulari().length})</small></span></button>`);
  kok.onclick=e=>{
    const o=e.target.closest('[data-oyun]'),a=e.target.closest('[data-act]');
    if(o)oyunSayfasi(o.dataset.oyun);
    else if(a?.dataset.act==='profil')profilEkrani(false);
    else if(a?.dataset.act==='aile')aileEkrani();
    else if(a?.dataset.act==='katil')kodlaKatil(document.getElementById('kod').value);
  };
  const kod=document.getElementById('kod');
  kod.addEventListener('keydown',e=>{if(e.key==='Enter')kodlaKatil(kod.value)});
  kod.addEventListener('input',()=>{kod.value=kodTemiz(kod.value)});
}

/* ── Oyun sayfası: açıklama + tek başıma / oda kur ── */
function oyunSayfasi(id){
  const g=GAMES[id];
  yaz(`<header class="baslik"><button type="button" class="ikonbtn" data-act="geri" aria-label="Geri">←</button><h1>${esc(g.name)}</h1><span></span></header>
    <section class="kart kart--genis oyunsayfa" style="--kart:${g.renk}"><div class="oyunsayfa__ikon" aria-hidden="true">${g.ikon}</div><p>${esc(g.nasil)}</p>
    <p class="ipucu">${g.players.max>1?`Oyuncu: ${g.players.min===g.players.max?g.players.min:`${g.players.min}–${g.players.max}`}`:'Tek kişilik'} · ${g.cocuk?'Çocuklar için uygun':'Daha çok büyükler için'}</p>
    <div class="yigin">${g.solo?`<button type="button" class="btn btn--ana" data-act="solo">Tek başıma oyna</button>`:''}${g.online?`<button type="button" class="btn ${g.solo?'btn--ikincil':'btn--ana'}" data-act="kur"${onlineVar?'':' disabled'}>Oda kur (online)</button>`:''}${g.online&&!onlineVar?'<p class="ipucu">Online için Firebase ayarı gerekir (README).</p>':''}</div></section>`);
  kok.onclick=e=>{
    const a=e.target.closest('[data-act]')?.dataset.act;
    if(a==='geri')ana();else if(a==='solo')soloSecenek(g);else if(a==='kur')odaKur(g);
  };
}

/* ── Seçenekler (lobi ve tek başına ortak) ── */
const varsayilanlar=g=>Object.fromEntries((g.secenekler||[]).map(o=>[o.anahtar,o.tur==='liste'?[]:(o.varsayilan??(o.tur==='coklu'?o.secenekler.map(c=>c.v):o.tur==='ac'?false:o.secenekler[0].v))]));
function secenekHtml(g,opts,dz){
  const dis=dz?'':' disabled';
  return(g.secenekler||[]).map(o=>{
    const baslik=`<div class="etiket">${esc(o.ad)}</div>`;
    if(o.tur==='sec')return`<div class="secenek">${baslik}<div class="seg" role="group" aria-label="${esc(o.ad)}">${o.secenekler.map(c=>`<button type="button" class="seg__b" data-sec="${o.anahtar}" data-v="${esc(c.v)}" aria-pressed="${String(opts[o.anahtar])===String(c.v)}"${dis}>${esc(c.t)}</button>`).join('')}</div></div>`;
    if(o.tur==='coklu')return`<div class="secenek">${baslik}<div class="cipler">${o.secenekler.map(c=>`<button type="button" class="cip" data-coklu="${o.anahtar}" data-v="${esc(c.v)}" aria-pressed="${(opts[o.anahtar]||[]).includes(c.v)}"${dis}>${esc(c.t)}</button>`).join('')}</div></div>`;
    if(o.tur==='ac')return`<div class="secenek"><button type="button" class="cip cip--genis" data-ac="${o.anahtar}" aria-pressed="${!!opts[o.anahtar]}"${dis}>${esc(o.ad)}</button>${o.ipucu?`<p class="ipucu">${esc(o.ipucu)}</p>`:''}</div>`;
    if(o.tur==='liste'){
      const l=opts[o.anahtar]||[];
      return`<div class="secenek">${baslik}<div class="cipler">${l.map((x,i)=>`<button type="button" class="cip" data-sil="${o.anahtar}" data-i="${i}" aria-pressed="true" aria-label="${esc(x)} öğesini kaldır"${dis}>${esc(x)} ✕</button>`).join('')}</div>${dz?`<form class="ekle" data-ekle="${o.anahtar}"><input class="alan" id="lst-${o.anahtar}" maxlength="${o.uzunluk||18}" placeholder="${esc(o.yer||'')}" autocomplete="off" value="${esc(S.taslak[o.anahtar]||'')}"><button type="submit" class="btn btn--ikincil">Ekle</button></form>`:''}</div>`;
    }
    return'';
  }).join('');
}
/* Seçenek olaylarını bağlar; degistir(patch) çağrılır. */
function secenekOlay(kapsayici,g,opts,degistir){
  kapsayici.addEventListener('click',e=>{
    const sec=e.target.closest('[data-sec]'),col=e.target.closest('[data-coklu]'),ac=e.target.closest('[data-ac]'),sil=e.target.closest('[data-sil]');
    if(sec){const o=g.secenekler.find(x=>x.anahtar===sec.dataset.sec);const c=o.secenekler.find(x=>String(x.v)===sec.dataset.v);degistir({[o.anahtar]:c.v})}
    else if(col){
      const k=col.dataset.coklu,o=g.secenekler.find(x=>x.anahtar===k),cur=[...(opts()[k]||[])],c=o.secenekler.find(x=>String(x.v)===col.dataset.v).v;
      const i=cur.indexOf(c);if(i>=0)cur.splice(i,1);else cur.push(c);
      if(o.enAz&&cur.length<o.enAz)return toast(`En az ${o.enAz} seçenek kalmalı`);
      degistir({[k]:cur});
    }else if(ac)degistir({[ac.dataset.ac]:!opts()[ac.dataset.ac]});
    else if(sil){const k=sil.dataset.sil,cur=[...(opts()[k]||[])];cur.splice(Number(sil.dataset.i),1);degistir({[k]:cur})}
  });
  kapsayici.addEventListener('input',e=>{const t=e.target;if(t.id?.startsWith('lst-'))S.taslak[t.id.slice(4)]=t.value});
  kapsayici.addEventListener('submit',e=>{
    const f=e.target.closest('[data-ekle]');if(!f)return;
    e.preventDefault();
    const k=f.dataset.ekle,o=g.secenekler.find(x=>x.anahtar===k),inp=f.querySelector('input'),v=inp.value.trim();
    if(!v)return;
    const cur=[...(opts()[k]||[])];
    if(cur.length>=(o.max||3))return toast(`En fazla ${o.max||3} öğe eklenebilir`);
    if(cur.some(x=>x.toLocaleLowerCase('tr')===v.toLocaleLowerCase('tr')))return toast('Bu zaten var');
    S.taslak[k]='';cur.push(v);degistir({[k]:cur});
  });
}

/* ── Tek başıma ── */
function soloSecenek(g){
  let opts={...varsayilanlar(g)};
  const ciz=()=>{
    yaz(`<header class="baslik"><button type="button" class="ikonbtn" data-act="geri" aria-label="Geri">←</button><h1>${esc(g.name)}</h1><span></span></header>
      <section class="kart kart--genis">${secenekHtml(g,opts,true)||'<p class="ipucu">Hazırsan başlayalım!</p>'}<button type="button" class="btn btn--ana btn--buyuk" data-act="basla">Başla</button></section>`);
    kok.onclick=e=>{const a=e.target.closest('[data-act]')?.dataset.act;if(a==='geri')oyunSayfasi(g.id);else if(a==='basla')soloBaslat(g,opts)};
    secenekOlay(kok,g,()=>opts,p=>{opts={...opts,...p};ciz()});
  };
  ciz();
}
async function soloBaslat(g,opts){
  const hub=createMemoryHub();
  const db=hub.connect('ben');
  const room=await Room.create(db,g,S.profil,{...opts,mode:'solo'});
  await room.startGame();
  baglaOda(room,true);
}

/* ── Online ── */
async function onlineDb(){
  if(!onlineVar)throw new OdaHatasi('Online için Firebase ayarı gerekir.');
  if(!S.fb)S.fb=await baglan(FIREBASE);
  return S.fb;
}
async function odaKur(g){
  try{
    toast('Oda kuruluyor…',1200);
    const db=await onlineDb();
    const room=await Room.create(db,g,S.profil,{...varsayilanlar(g),mode:'online'});
    baglaOda(room,false);
  }catch(e){hata(e)}
}
async function kodlaKatil(kod){
  kod=kodTemiz(kod);
  if(kod.length!==5)return toast('Kod 5 karakterden oluşur');
  try{
    toast('Odaya bağlanılıyor…',1200);
    const db=await onlineDb();
    const room=await Room.join(db,GAMES,kod,S.profil);
    baglaOda(room,false);
  }catch(e){hata(e)}
}
const hata=e=>{console.error(e);toast(e instanceof OdaHatasi?e.message:'Bağlanılamadı. İnternetini ve Firebase ayarını kontrol et.',3500)};

/* ── Oda bağlama: lobi ↔ oyun geçişini yönetir ── */
function baglaOda(room,solo){
  ayril();
  S.room=room;S.solo=solo;
  history.pushState({oda:1},'');
  room.onClose(()=>{if(S.room===room){S.room=null;S.off?.();toast('Oda kapandı');ana()}});
  S.off=room.subscribe(snap=>guncelle(snap));
}
function ayril(){
  S.off?.();S.off=null;
  S.gorunum?.destroy?.();S.gorunum=null;S.gorunumId=null;
  if(S.room){const r=S.room;S.room=null;r.leave()}
}
async function cik(){
  const room=S.room;if(!room)return ana();
  const tamam=await onay(room.state?'Oyundan çıkılsın mı?':'Odadan çıkılsın mı?',{evet:'Çık',tehlike:true});
  if(tamam&&S.room===room)ana();
}
function guncelle(snap){
  const room=snap.room;if(room!==S.room)return;
  if(snap.state){
    if(S.gorunumId!=='oyun'){oyunEkrani(room,snap)}
    else{
      S.gorunum?.update?.(snap);
      const sk=document.getElementById('skor');
      if(sk)sk.innerHTML=skorSeridi(snap.players,snap.state.skor,snap.state.sira);
    }
  }else{
    if(S.gorunumId!=='lobi')lobiEkrani(room,snap);else lobiGuncelle(room,snap);
  }
}

/* ── Lobi ── */
const davetMetni=(g,kod)=>`Aile Oyunları: ${g.name} odasına gel! Kod: ${kod}\n${location.origin}${location.pathname}?oda=${kod}`;
function lobiEkrani(room,snap){
  S.gorunum?.destroy?.();S.gorunumId='lobi';S.gorunum=null;
  const g=room.game;
  yaz(`<header class="baslik"><button type="button" class="ikonbtn" data-act="cik" aria-label="Odadan çık">←</button><h1>${esc(g.name)}</h1><span></span></header>
    <section class="kart kart--genis lobi"><div class="etiket">Oda kodu</div><div class="kod" aria-label="Oda kodu">${esc(room.code)}</div>
    <div class="yigin"><a class="btn btn--ana" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(davetMetni(g,room.code))}">WhatsApp'ta davet et</a>
    <button type="button" class="btn btn--ikincil" data-act="kopyala">Kodu kopyala</button></div></section>
    <section class="kart kart--genis"><div class="etiket">Oyuncular <span id="lsayi"></span></div><ul class="oyuncular" id="loyuncu" aria-live="polite"></ul></section>
    <section class="kart kart--genis" id="lsec"></section>
    <div class="alt" id="lalt"></div>`);
  kok.onclick=async e=>{
    const a=e.target.closest('[data-act]')?.dataset.act;
    if(a==='cik')cik();
    else if(a==='kopyala'){toast(await kopyala(room.code)?'Kod kopyalandı':`Kod: ${room.code}`)}
    else if(a==='basla'){const ok=await room.startGame();if(!ok)toast('Yeterli oyuncu yok')}
  };
  secenekOlay(kok,g,()=>room.meta?.opts||{},p=>room.setOpts(p));
  lobiGuncelle(room,snap);
}
function lobiGuncelle(room,snap){
  const g=room.game,host=snap.isHost,aktif=snap.players.filter(p=>!p.spectator);
  const l=document.getElementById('loyuncu');if(!l)return;
  l.innerHTML=snap.players.map(p=>`<li class="${p.online===false?'cevrimdisi':''}"><span class="av av--kucuk">${esc(p.avatar||'🙂')}</span><span class="oyuncu__ad">${esc(p.name)}${p.age==='cocuk'?' <small>(çocuk)</small>':''}</span>${p.uid===snap.meta.hostUid?'<span class="rozet">oda sahibi</span>':''}${p.uid===room.uid?'<span class="rozet rozet--ben">sen</span>':''}${p.spectator?'<span class="rozet">izleyici</span>':''}</li>`).join('');
  document.getElementById('lsayi').textContent=`(${aktif.length}/${g.players.max})`;
  const sec=document.getElementById('lsec');
  const aktifEleman=document.activeElement;const odak=aktifEleman&&aktifEleman.id?.startsWith('lst-')?aktifEleman.id:null;
  sec.innerHTML=secenekHtml(g,snap.meta.opts||{},host)||'<p class="ipucu">Bu oyunda ayar yok.</p>';
  if(odak){const el=document.getElementById(odak);if(el){el.focus();const n=el.value.length;try{el.setSelectionRange(n,n)}catch(_){}}}
  const eksik=Math.max(0,g.players.min-aktif.length);
  document.getElementById('lalt').innerHTML=host
    ?`<button type="button" class="btn btn--ana btn--buyuk" data-act="basla"${eksik?' disabled':''}>${eksik?`${eksik} oyuncu daha gerekli`:'Oyunu başlat'}</button>`
    :`<p class="ipucu ortala">Oda sahibinin oyunu başlatması bekleniyor…</p>`;
}

/* ── Oyun ekranı ── */
function oyunEkrani(room,snap){
  S.gorunum?.destroy?.();
  S.gorunumId='oyun';
  const g=room.game;
  yaz(`<div class="oyun" data-oyun="${esc(g.id)}"><header class="ustbar"><button type="button" class="ikonbtn" data-act="cik" aria-label="Oyundan çık">←</button><h2>${esc(g.name)}</h2><div class="skorseridi" id="skor"></div></header><main id="oyunalani" class="oyunalani"></main></div>`,'ekran--oyun');
  kok.onclick=e=>{if(e.target.closest('[data-act="cik"]'))cik()};
  const api={
    uid:room.uid,solo:S.solo,room,
    dispatch:(t,d)=>room.dispatch(t,d),
    now:()=>room.db.now(),
    isHost:()=>room.isHost(),
    tekrar:()=>room.startGame(),lobi:()=>room.toLobby(),cik,
    profil:S.profil
  };
  S.gorunum=g.view.mount(document.getElementById('oyunalani'),api);
  S.gorunum?.update?.(snap);
  document.getElementById('skor').innerHTML=skorSeridi(snap.players,snap.state.skor,snap.state.sira);
}

/* ── Aile soruları ── */
function aileEkrani(){
  const ciz=()=>{
    const l=aileSorulari();
    yaz(`<header class="baslik"><button type="button" class="ikonbtn" data-act="geri" aria-label="Geri">←</button><h1>Aile soruları</h1><span></span></header>
      <section class="kart kart--genis"><p class="ipucu">Yazdığın sorular Bilgi Yarışması'na eklenir. Oda sahibinin soruları herkese gösterilir. İlk kutuya <b>doğru cevabı</b> yaz; şıklar yarışmada karıştırılır.</p>
      <form id="aile" class="form"><label class="etiket" for="as">Soru</label><input class="alan" id="as" maxlength="120" autocomplete="off" placeholder="Dedem hangi köyde doğdu?">
      <label class="etiket" for="a0">Doğru cevap</label><input class="alan" id="a0" maxlength="40" autocomplete="off">
      <label class="etiket" for="a1">Yanlış cevaplar</label><input class="alan" id="a1" maxlength="40" autocomplete="off" aria-label="Yanlış cevap 1"><input class="alan" id="a2" maxlength="40" autocomplete="off" aria-label="Yanlış cevap 2"><input class="alan" id="a3" maxlength="40" autocomplete="off" aria-label="Yanlış cevap 3">
      <button type="submit" class="btn btn--ana">Soruyu ekle</button></form></section>
      <section class="kart kart--genis"><div class="etiket">Sorular (${l.length})</div>${l.length?`<ul class="sorular">${l.map((q,i)=>`<li><div><strong>${esc(q.t)}</strong><small>Doğru: ${esc(q.o[0])}</small></div><button type="button" class="ikonbtn" data-sil="${i}" aria-label="Soruyu sil">🗑</button></li>`).join('')}</ul>`:'<p class="ipucu">Henüz soru yok.</p>'}</section>`);
    kok.onclick=async e=>{
      const a=e.target.closest('[data-act]')?.dataset.act,s=e.target.closest('[data-sil]');
      if(a==='geri')ana();
      else if(s){if(await onay('Bu soru silinsin mi?',{evet:'Sil',tehlike:true})){const x=aileSorulari();x.splice(Number(s.dataset.sil),1);aileSorulariYaz(x);ciz()}}
    };
    document.getElementById('aile').onsubmit=e=>{
      e.preventDefault();
      const v=['as','a0','a1','a2','a3'].map(i=>document.getElementById(i).value.trim());
      if(v.some(x=>!x))return toast('Bütün kutuları doldur');
      if(new Set(v.slice(1).map(x=>x.toLocaleLowerCase('tr'))).size<4)return toast('Cevaplar birbirinden farklı olmalı');
      aileSorulariYaz([...aileSorulari(),{t:v[0],o:v.slice(1)}]);toast('Soru eklendi');ciz();
    };
  };
  ciz();
}

/* ── Başlangıç ── */
async function yonlendir(){
  const kod=kodTemiz(new URLSearchParams(location.search).get('oda')||'');
  if(S.profil&&kod.length===5&&onlineVar){history.replaceState({},'',location.pathname);await kodlaKatil(kod)}
  else ana();
}
export function baslat(){
  modAyarla();
  window.addEventListener('popstate',async()=>{
    if(S.room){
      history.pushState({oda:1},'');
      cik();
    }
  });
  if(!S.profil)profilEkrani(true);else yonlendir();
}
