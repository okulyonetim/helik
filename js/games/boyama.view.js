import {esc} from '../core/util.js';
import {onay,toast} from '../core/ui.js';
import {PALET,SAYFA_LISTESI,sayfaSvg} from './veri/boyama-sayfalari.js';

export default{
  mount(root,api){
    root.innerHTML=`<div class="by"><div class="by__sayfalar cipler" id="by-sayfalar" role="group" aria-label="Sayfa seç"></div>
      <div class="by__tuval" id="by-tuval"></div>
      <div class="by__palet" id="by-palet" role="radiogroup" aria-label="Renkler">${PALET.map((c,i)=>`<button type="button" class="by__renk" role="radio" aria-checked="false" data-c="${i}" style="background:${c}" aria-label="Renk ${i+1}"></button>`).join('')}<button type="button" class="by__renk by__renk--silgi" role="radio" aria-checked="false" data-c="-1" aria-label="Silgi">⌫</button></div>
      <div class="by__araclar"><button type="button" class="btn btn--ikincil" data-by="temizle">Temizle</button><button type="button" class="btn btn--ana" data-by="kaydet">Resmi kaydet</button></div></div>`;
    const kok=root.querySelector('.by'),tuval=kok.querySelector('#by-tuval'),palet=kok.querySelector('#by-palet'),sayfalar=kok.querySelector('#by-sayfalar');
    let renk=1,suan=null,imza='',sayfaNo='';

    const renkSec=c=>{renk=c;palet.querySelectorAll('.by__renk').forEach(b=>b.setAttribute('aria-checked',String(Number(b.dataset.c)===c)))};
    renkSec(1);
    sayfalar.innerHTML=SAYFA_LISTESI.map(x=>`<button type="button" class="cip" data-sayfa="${x.id}" aria-pressed="false">${esc(x.ad)}</button>`).join('');

    tuval.addEventListener('click',e=>{
      const r=e.target.closest('[data-r]');
      if(r&&suan)api.dispatch('boya',{r:r.dataset.r,c:renk});
    });
    palet.addEventListener('click',e=>{const b=e.target.closest('[data-c]');if(b)renkSec(Number(b.dataset.c))});
    sayfalar.addEventListener('click',async e=>{
      const b=e.target.closest('[data-sayfa]');if(!b||!suan||b.dataset.sayfa===suan.sayfa)return;
      if(Object.keys(suan.dolgu).length&&!await onay('Sayfa değişirse bu boyama silinir. Devam edilsin mi?',{evet:'Değiştir'}))return;
      api.dispatch('sayfa',{s:b.dataset.sayfa});
    });
    kok.addEventListener('click',async e=>{
      const d=e.target.closest('[data-by]');if(!d||!suan)return;
      if(d.dataset.by==='temizle'){
        if(!Object.keys(suan.dolgu).length)return toast('Zaten boş');
        if(await onay('Bütün boyama silinsin mi?',{evet:'Temizle',tehlike:true}))api.dispatch('temizle');
      }else if(d.dataset.by==='kaydet')kaydet();
    });
    async function kaydet(){
      try{
        const svg=sayfaSvg(suan.sayfa,suan.dolgu,{etkilesim:false});
        const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
        const img=new Image();img.src=url;await img.decode();
        const cv=document.createElement('canvas');cv.width=cv.height=1000;
        const g=cv.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,1000,1000);g.drawImage(img,0,0,1000,1000);
        URL.revokeObjectURL(url);
        const blob=await new Promise(r=>cv.toBlob(r,'image/png'));
        const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`boyama-${suan.sayfa}.png`;
        document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);
        toast('Resim kaydedildi');
      }catch(_){toast('Resim kaydedilemedi')}
    }

    return{
      update(snap){
        const s=snap.state;if(!s)return;
        suan=s;
        const yeni=s.sayfa+':'+s.surum;
        if(yeni!==imza){imza=yeni;tuval.innerHTML=sayfaSvg(s.sayfa,s.dolgu)}
        if(s.sayfa!==sayfaNo){sayfaNo=s.sayfa;sayfalar.querySelectorAll('[data-sayfa]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.sayfa===s.sayfa)))}
      },
      destroy(){root.innerHTML=''}
    };
  }
};
