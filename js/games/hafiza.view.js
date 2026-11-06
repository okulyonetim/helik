import {esc} from '../core/util.js';
import {siralamaHtml,bitisDugmeleri,bitisOlay} from '../core/ui.js';

export default{
  mount(root,api){
    root.innerHTML=`<div class="hf"><p class="hf__durum" id="hdurum" aria-live="polite"></p><div class="hf__izgara" id="hizgara"></div><div id="hsonuc"></div></div>`;
    const izgara=root.querySelector('#hizgara'),durum=root.querySelector('#hdurum'),sonuc=root.querySelector('#hsonuc');
    let tur=null,dugmeler=[];
    izgara.addEventListener('click',e=>{
      const b=e.target.closest('.hk');if(!b)return;
      api.dispatch('cevir',{i:Number(b.dataset.i)});
    });
    bitisOlay(sonuc,api);
    const kur=s=>{
      tur=s.tur;
      izgara.style.setProperty('--kol',s.kolon);
      izgara.innerHTML=s.kartlar.map((k,i)=>`<button type="button" class="hk" data-i="${i}"><span class="hk__ic"><span class="hk__on" aria-hidden="true">?</span><span class="hk__arka">${k}</span></span><span class="hk__sahip" aria-hidden="true"></span></button>`).join('');
      dugmeler=[...izgara.children];
      sonuc.innerHTML='';
    };
    return{
      update(snap){
        const s=snap.state;if(!s)return;
        if(s.tur!==tur)kur(s);
        const benim=s.sira===api.uid&&s.faz==='oyun';
        const kisi=snap.players.find(p=>p.uid===s.sira);
        s.kartlar.forEach((k,i)=>{
          const b=dugmeler[i],sahip=s.sahip[i],acik=!!sahip||s.acik.includes(i);
          b.classList.toggle('acik',acik);
          b.classList.toggle('bulundu',!!sahip);
          b.disabled=acik||!benim||!!s.gizleAt;
          b.setAttribute('aria-label',acik?`Kart ${k}`:`Kart ${i+1}, kapalı`);
          const sh=b.querySelector('.hk__sahip');
          const av=sahip&&snap.players.length>1?(snap.players.find(p=>p.uid===sahip)?.avatar||''):'';
          if(sh.textContent!==av)sh.textContent=av;
        });
        if(s.faz==='bitti'){
          durum.textContent='Bütün çiftler bulundu!';
          const solo=snap.players.filter(p=>!p.spectator).length<2;
          const en=Math.max(...Object.values(s.skor));
          const kazan=snap.players.filter(p=>s.skor[p.uid]===en&&!p.spectator);
          const baslik=solo?`${s.hamle[api.uid]||0} hamlede bitirdin!`:kazan.length>1?'Berabere!':`${esc(kazan[0]?.name||'')} kazandı!`;
          sonuc.innerHTML=`<div class="bitis__ikon">🎉</div><h2 class="bitis__baslik">${baslik}</h2>${solo?'':siralamaHtml(snap.players,s.skor,{ek:p=>`${s.hamle[p.uid]||0} hamle`})}${bitisDugmeleri(api)}`;
        }else{
          durum.textContent=s.gizleAt?'Eşleşmedi…':benim?(s.acik.length===1?'Bir kart daha aç':'Sıra sende! Bir kart aç'):`Sıra: ${kisi?kisi.avatar+' '+kisi.name:'…'}`;
          durum.classList.toggle('hf__durum--ben',benim);
          if(sonuc.innerHTML)sonuc.innerHTML='';
        }
      },
      destroy(){root.innerHTML=''}
    };
  }
};
