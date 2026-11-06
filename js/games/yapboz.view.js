import {esc} from '../core/util.js';
import {siralamaHtml,bitisDugmeleri,bitisOlay,toast} from '../core/ui.js';
import {sahneUrl} from './veri/sahneler.js';

const sure=ms=>{const s=Math.max(0,Math.floor(ms/1000));return`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
const konum=(i,k,s)=>{const c=i%k,r=Math.floor(i/k);return`${k>1?c/(k-1)*100:0}% ${s>1?r/(s-1)*100:0}%`};

export default{
  mount(root,api){
    root.innerHTML=`<div class="yp" id="yp"><div class="yp__ust"><span class="pill" id="yp-sure">0:00</span><span class="pill" id="yp-say"></span><button type="button" class="btn btn--ikincil" id="yp-ipucu">💡 İpucu</button></div>
      <div class="yp__tahta" id="yp-tahta"><div class="yp__sis" id="yp-sis"></div><div class="yp__yuvalar" id="yp-yuvalar"></div></div>
      <p class="ipucu ortala" id="yp-durum">Bir parça seç</p><div class="yp__tepsi" id="yp-tepsi"></div><div id="yp-sonuc"></div></div>`;
    const kok=root.querySelector('#yp'),q=s=>kok.querySelector(s);
    let suan=null,snapSon=null,oyunNo=null,secili=null,sayac=null,drag=null,tikEngel=false;

    function kur(s){
      kok.style.setProperty('--img',`url("${sahneUrl(s.sahne,s.kolon*100,s.satir*100)}")`);
      kok.style.setProperty('--k',s.kolon);kok.style.setProperty('--s',s.satir);
      q('#yp-tahta').style.aspectRatio=`${s.kolon} / ${s.satir}`;
      q('#yp-sis').style.opacity=s.ipucu?'.82':'1';
      q('#yp-yuvalar').innerHTML=Array.from({length:s.n},(_,i)=>`<button type="button" class="yp__yuva" data-y="${i}" aria-label="Boş yer ${i+1}"><span class="yp__sahip"></span></button>`).join('');
      q('#yp-sonuc').innerHTML='';secili=null;
    }
    const yuva=i=>q(`.yp__yuva[data-y="${i}"]`);
    function dene(parca,yer){
      const s=suan;if(!s||s.faz!=='oyun'||s.yer[parca])return;
      if(parca===yer){api.dispatch('koy',{i:parca});secili=null;return}
      const y=yuva(yer);if(y){y.classList.remove('yp__titre');void y.offsetWidth;y.classList.add('yp__titre')}
      toast('Orası değil, başka yeri dene',1400);
    }
    function ciz(snap){
      const s=snap.state;suan=s;
      const yerlesen=s.yer.filter(Boolean).length;
      if(secili!==null&&s.yer[secili])secili=null;
      q('#yp-say').textContent=`${yerlesen}/${s.n}`;
      const coklu=s.kat.length>1;
      s.yer.forEach((u,i)=>{
        const y=yuva(i),dolu=!!u;
        y.classList.toggle('yp__yuva--dolu',dolu);
        if(dolu){y.style.backgroundImage='var(--img)';y.style.backgroundSize=`${s.kolon*100}% ${s.satir*100}%`;y.style.backgroundPosition=konum(i,s.kolon,s.satir);y.disabled=true}
        else{y.style.backgroundImage='';y.disabled=false}
        const av=dolu&&coklu?(snap.players.find(p=>p.uid===u)?.avatar||''):'';
        const sh=y.firstChild;if(sh.textContent!==av)sh.textContent=av;
      });
      q('#yp-tepsi').innerHTML=s.karisik.filter(i=>!s.yer[i]).map(i=>`<button type="button" class="yp__parca${secili===i?' yp__parca--secili':''}" data-p="${i}" style="background-size:${s.kolon*100}% ${s.satir*100}%;background-position:${konum(i,s.kolon,s.satir)}" aria-label="Parça ${i+1}"></button>`).join('');
      q('#yp-durum').textContent=s.faz==='bitti'?'':secili!==null?'Şimdi tahtada yerine dokun':'Bir parça seç';
      zaman();
      if(s.faz==='bitti')bitir(snap);else q('#yp-sonuc').innerHTML='';
    }
    function bitir(snap){
      const s=snap.state;clearInterval(sayac);sayac=null;
      const solo=s.kat.length<2;
      q('#yp-sonuc').innerHTML=`<div class="bitis__ikon">🎉</div><h2 class="bitis__baslik">Yapboz tamam!</h2><p class="ortala">Süre: <b>${sure(s.bitisAt-s.basla)}</b></p>${solo?'':siralamaHtml(snap.players,s.skor,{ek:()=>'parça'})}${bitisDugmeleri(api)}`;
      q('#yp-tepsi').innerHTML='';
    }
    function zaman(){
      const s=suan;if(!s)return;
      q('#yp-sure').textContent='⏱ '+sure((s.faz==='bitti'?s.bitisAt:api.now())-s.basla);
    }

    kok.addEventListener('click',e=>{
      if(tikEngel){tikEngel=false;return}
      const p=e.target.closest('.yp__parca');
      if(p){const i=Number(p.dataset.p);secili=secili===i?null:i;ciz(snapSon);return}
      const y=e.target.closest('.yp__yuva');
      if(y&&!y.disabled){if(secili===null){toast('Önce alttan bir parça seç',1400);return}dene(secili,Number(y.dataset.y))}
    });
    q('#yp-ipucu').addEventListener('click',()=>{
      if(secili===null){toast('Önce alttan bir parça seç',1400);return}
      const y=yuva(secili);if(!y)return;
      y.classList.add('yp__nabiz');setTimeout(()=>y.classList.remove('yp__nabiz'),1800);
    });
    /* fare ile sürükle-bırak (dokunmatikte seç-dokun yöntemi kullanılır) */
    kok.addEventListener('pointerdown',e=>{
      if(e.pointerType!=='mouse')return;
      const p=e.target.closest('.yp__parca');if(!p)return;
      drag={i:Number(p.dataset.p),x:e.clientX,y:e.clientY,hayalet:null,el:p};
    });
    addEventListener('pointermove',onMove);
    addEventListener('pointerup',onUp);
    function onMove(e){
      if(!drag)return;
      if(!drag.hayalet&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8){
        const h=drag.el.cloneNode();h.classList.add('yp__hayalet');h.style.width=drag.el.offsetWidth+'px';h.style.height=drag.el.offsetHeight+'px';
        h.style.setProperty('--img',kok.style.getPropertyValue('--img'));document.body.appendChild(h);drag.hayalet=h;drag.el.style.opacity='.35';
      }
      if(drag.hayalet){drag.hayalet.style.left=e.clientX-drag.hayalet.offsetWidth/2+'px';drag.hayalet.style.top=e.clientY-drag.hayalet.offsetHeight/2+'px'}
    }
    function onUp(e){
      if(!drag)return;
      const d=drag;drag=null;
      if(d.hayalet){
        d.hayalet.remove();d.el.style.opacity='';tikEngel=true;setTimeout(()=>{tikEngel=false},50);
        const hedef=document.elementFromPoint(e.clientX,e.clientY)?.closest('.yp__yuva');
        if(hedef&&!hedef.disabled)dene(d.i,Number(hedef.dataset.y));
      }
    }
    bitisOlay(kok,api);

    return{
      update(snap){
        const s=snap.state;if(!s)return;
        snapSon=snap;suan=s;
        if(s.oyun!==oyunNo){oyunNo=s.oyun;kur(s);clearInterval(sayac);sayac=setInterval(zaman,500)}
        ciz(snap);
      },
      destroy(){clearInterval(sayac);removeEventListener('pointermove',onMove);removeEventListener('pointerup',onUp);document.querySelectorAll('.yp__hayalet').forEach(x=>x.remove());root.innerHTML=''}
    };
  }
};
