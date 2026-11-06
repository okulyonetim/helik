/* Ortak arayüz parçaları: toast, onay penceresi, puan şeridi, sıralama tablosu. */
import {esc,siralama} from './util.js';

export function toast(msg,ms=2200){
  const t=document.createElement('div');
  t.className='toast';t.setAttribute('role','status');t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),ms);
}

/* window.confirm yerine: telefonda daha okunur, çocuklara uygun */
export function onay(mesaj,{evet='Tamam',hayir='Vazgeç',tehlike=false}={}){
  return new Promise(res=>{
    const w=document.createElement('div');
    w.className='modal';w.setAttribute('role','dialog');w.setAttribute('aria-modal','true');
    w.innerHTML=`<div class="modal__kutu"><p>${esc(mesaj)}</p><div class="modal__btn"><button type="button" class="btn btn--ikincil" data-v="0">${esc(hayir)}</button><button type="button" class="btn ${tehlike?'btn--tehlike':'btn--ana'}" data-v="1">${esc(evet)}</button></div></div>`;
    const kapat=v=>{w.remove();res(v)};
    w.addEventListener('click',e=>{const b=e.target.closest('[data-v]');if(b)kapat(b.dataset.v==='1');else if(e.target===w)kapat(false)});
    document.body.appendChild(w);
    w.querySelector('[data-v="1"]').focus();
  });
}

/* Oyun üst şeridindeki küçük puan çipleri; sıradaki oyuncu vurgulanır */
export function skorSeridi(players,scores,siradaki){
  return players.filter(p=>!p.spectator).map(p=>{
    const puan=scores?.[p.uid];
    return`<span class="skorcip${p.uid===siradaki?' skorcip--sira':''}${p.online===false?' skorcip--cevrimdisi':''}" title="${esc(p.name)}"><span class="skorcip__av">${esc(p.avatar||'🙂')}</span>${puan!==undefined?`<b>${puan}</b>`:''}</span>`;
  }).join('');
}

export function siralamaHtml(players,scores,{ek}={}){
  const liste=siralama(players.filter(p=>!p.spectator),scores);
  const enYuksek=liste[0]?.puan??0;
  const madalya=['🥇','🥈','🥉'];
  return`<ol class="siralama">${liste.map((p,i)=>`<li class="${p.puan===enYuksek&&enYuksek>0?'siralama__birinci':''}"><span class="siralama__no">${madalya[i]||i+1}</span><span class="siralama__av">${esc(p.avatar||'🙂')}</span><span class="siralama__ad">${esc(p.name)}</span>${ek?`<span class="siralama__ek">${ek(p)}</span>`:''}<b class="siralama__puan">${p.puan}</b></li>`).join('')}</ol>`;
}

/* Oyun bitiminde ortak düğmeler: host tekrar başlatır, herkes çıkabilir */
export function bitisDugmeleri(api){
  const host=api.isHost();
  return`<div class="bitis">${host?`<button type="button" class="btn btn--ana" data-ortak="tekrar">Tekrar oyna</button>${api.solo?'':`<button type="button" class="btn btn--ikincil" data-ortak="lobi">Lobiye dön</button>`}`:`<p class="ipucu">Oda sahibi yeni oyun başlatabilir.</p>`}<button type="button" class="btn btn--ikincil" data-ortak="cik">Çık</button></div>`;
}
export function bitisOlay(kok,api){
  kok.addEventListener('click',e=>{
    const b=e.target.closest('[data-ortak]');if(!b)return;
    const a=b.dataset.ortak;
    if(a==='tekrar')api.tekrar();else if(a==='lobi')api.lobi();else if(a==='cik')api.cik();
  });
}

/* Kalan süre çubuğu (oyunlar kendi zamanlayıcısını çalıştırır) */
export function sureCubugu(el,kalanMs,toplamMs){
  const oran=Math.max(0,Math.min(1,kalanMs/toplamMs));
  el.style.width=(oran*100).toFixed(1)+'%';
  el.parentElement.classList.toggle('sure--az',kalanMs<=8000);
}

/* Panoya kopyala (başarısızsa false) */
export async function kopyala(metin){
  try{await navigator.clipboard.writeText(metin);return true}catch(_){return false}
}
