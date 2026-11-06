import {esc} from '../core/util.js';
import {siralamaHtml,bitisDugmeleri,bitisOlay,toast} from '../core/ui.js';
import {yukle,bulma,ipuclari,harfMi,harfSayisi} from './cengel.mantik.js';

const SATIRLAR=['ERTYUIOPĞÜ','ASDFGHJKLŞİ','ZCVBNMÖÇ'];
const ALFABE=new Set('ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ');
const RENKLER=['#2563eb','#db2777','#16a34a','#d97706','#7c3aed','#0891b2','#dc2626','#4d7c0f'];
const sure=ms=>{const s=Math.max(0,Math.floor(ms/1000));return`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};

export default{
  mount(root,api){
    root.innerHTML=`<div class="cb" id="cb"><div class="cb__ust"><span class="pill" id="cb-sure">0:00</span><span class="pill" id="cb-say"></span><button type="button" class="btn btn--ikincil" id="cb-ipucu">💡 İpucu</button></div>
      <div class="cb__bilgi" id="cb-bilgi" aria-live="polite">Bir kutuya dokun</div>
      <div class="cb__kutu"><div class="cb__izgara" id="cb-izgara"></div></div>
      <div class="cb__klavye" id="cb-klavye">${SATIRLAR.map(s=>`<div class="cb__sira">${[...s].map(h=>`<button type="button" class="cb__tus" data-k="${h}">${h}</button>`).join('')}</div>`).join('')}</div>
      <div id="cb-sonuc"></div></div>`;
    const kok=root.querySelector('#cb'),q=s=>kok.querySelector(s);
    let suan=null,snapSon=null,oyunNo=null,bulmaci=null,ip=[],sec={i:-1,yon:'a'},sayac=null,sonN=0,bekliyor=null;
    let hucreIp=new Map(); // hücre → {a:ipucu, d:ipucu}

    const hataGoster=()=>{q('#cb-bilgi').textContent='Bulmaca yüklenemedi, çıkıp tekrar dene'};

    function kur(s){
      bulmaci=bulma(s.z,s.no);
      if(!bulmaci)return false;
      ip=ipuclari(bulmaci);
      hucreIp=new Map();
      ip.forEach((x,k)=>x.hucreler.forEach(h=>{const m=hucreIp.get(h)||{};m[x.yon]=k;hucreIp.set(h,m)}));
      const iz=q('#cb-izgara');
      iz.style.setProperty('--c',s.c);iz.style.setProperty('--r',s.r);
      let html='';
      for(let i=0;i<s.sol.length;i++){
        const ch=s.sol[i];
        if(ch==='#'){
          const a=ip.findIndex(x=>x.ipucuHucre===i&&x.yon==='a'),d=ip.findIndex(x=>x.ipucuHucre===i&&x.yon==='d');
          const parca=(k,yon)=>k<0?'':`<button type="button" class="cb__ip cb__ip--${yon}" data-ip="${k}"><span>${esc(ip[k].metin)}</span></button>`;
          html+=`<div class="cb__i${a>=0&&d>=0?' cb__i--cift':''}" data-i="${i}">${parca(a,'a')}${parca(d,'d')}</div>`;
        }else if(ch==='.')html+=`<div class="cb__k"></div>`;
        else html+=`<button type="button" class="cb__h" data-h="${i}" aria-label="Kutu ${Math.floor(i/s.c)+1}. satır ${i%s.c+1}. sütun"><span class="cb__ch"></span></button>`;
      }
      iz.innerHTML=html;q('#cb-sonuc').innerHTML='';sec={i:-1,yon:'a'};bekliyor=null;sonN=s.son?.n||0;
      return true;
    }
    const hucre=i=>q(`.cb__h[data-h="${i}"]`);
    const bosMu=i=>suan.dolu[i]===undefined;
    function aktifIpucu(){
      const m=hucreIp.get(sec.i);if(!m)return null;
      const k=m[sec.yon]!==undefined?m[sec.yon]:m[sec.yon==='a'?'d':'a'];
      return k===undefined?null:ip[k];
    }
    function sec_(i,yon){
      const m=hucreIp.get(i);if(!m)return;
      if(yon&&m[yon]===undefined)yon=null;
      sec={i,yon:yon||(m[sec.yon]!==undefined?sec.yon:(m.a!==undefined?'a':'d'))};
      bilgiCiz();boyaCiz();
    }
    function ilkBos(w,sonra=-1){
      const h=w.hucreler,basla=Math.max(0,h.indexOf(sonra)+1);
      for(let k=0;k<h.length;k++){const i=h[(basla+k)%h.length];if(bosMu(i))return i}
      return -1;
    }
    function sonrakiIpucu(w){
      // tamamlanmamış sıradaki kelime
      const k0=ip.indexOf(w);
      for(let d=1;d<=ip.length;d++){const x=ip[(k0+d)%ip.length];if(x.hucreler.some(bosMu))return x}
      return null;
    }
    function ilerle(){
      // seçili kutu doldu: aynı kelimede boş kutuya, yoksa sıradaki kelimeye geç
      const w=aktifIpucu();if(!w)return;
      let i=ilkBos(w,sec.i);
      if(i<0){const x=sonrakiIpucu(w);if(!x)return;i=ilkBos(x);sec={i,yon:x.yon};}
      else sec={i,yon:w.yon};
    }
    function bilgiCiz(){
      const w=aktifIpucu(),s=suan;
      if(!w||!s){q('#cb-bilgi').textContent=s?.faz==='bitti'?'Bulmaca tamam!':'Bir kutuya dokun';return}
      q('#cb-bilgi').innerHTML=`<span class="cb__ok">${w.yon==='a'?'→':'↓'}</span><b>${esc(w.metin)}</b><span class="cb__n">${w.n} harf</span>`;
    }
    function boyaCiz(){
      const s=suan;if(!s)return;
      const w=s.faz==='oyun'?aktifIpucu():null;
      const set=new Set(w?w.hucreler:[]);
      kok.querySelectorAll('.cb__h').forEach(el=>{
        const i=Number(el.dataset.h);
        el.classList.toggle('cb__h--kelime',set.has(i));
        el.classList.toggle('cb__h--sec',s.faz==='oyun'&&i===sec.i);
      });
      kok.querySelectorAll('.cb__ip').forEach(el=>el.classList.toggle('cb__ip--aktif',!!w&&ip[Number(el.dataset.ip)]===w));
    }
    function ciz(snap){
      const s=snap.state;suan=s;
      let dolu=0;
      kok.querySelectorAll('.cb__h').forEach(el=>{
        const i=Number(el.dataset.h),u=s.dolu[i];
        const ch=el.firstChild;
        if(u!==undefined){
          dolu++;
          if(ch.textContent!==s.sol[i])ch.textContent=s.sol[i];
          if(!el.classList.contains('cb__h--dolu')){el.classList.add('cb__h--dolu');el.disabled=true}
          const k=s.kat.indexOf(u);
          el.style.setProperty('--pc',u===''||s.kat.length<2?'':RENKLER[(k<0?0:k)%RENKLER.length]);
          el.classList.toggle('cb__h--ipucu',u==='');
        }
      });
      q('#cb-say').textContent=`${dolu}/${harfSayisi(s.sol)}`;
      if(s.son&&s.son.n!==sonN){
        sonN=s.son.n;
        const el=hucre(s.son.i);
        if(el&&!s.son.ok){
          el.classList.remove('cb__titre');void el.offsetWidth;el.classList.add('cb__titre');
          el.firstChild.textContent=s.son.ch;el.classList.add('cb__h--yanlis');
          const i=s.son.i;
          setTimeout(()=>{el.classList.remove('cb__h--yanlis');if(suan&&suan.dolu[i]===undefined)el.firstChild.textContent=''},650);
        }
      }
      if(s.faz==='oyun'&&sec.i>=0&&!bosMu(sec.i))ilerle();
      bilgiCiz();boyaCiz();zaman();
      if(s.faz==='bitti')bitir(snap);else q('#cb-sonuc').innerHTML='';
      q('#cb-klavye').hidden=s.faz==='bitti';
      q('#cb-ipucu').hidden=s.faz==='bitti';
    }
    function bitir(snap){
      const s=snap.state;clearInterval(sayac);sayac=null;
      const solo=s.kat.length<2;
      q('#cb-sonuc').innerHTML=`<div class="bitis__ikon">🎉</div><h2 class="bitis__baslik">Bulmaca çözüldü!</h2><p class="ortala">Süre: <b>${sure(s.bitisAt-s.basla)}</b>${s.ipucu?` · ${s.ipucu} ipucu`:''}</p>${solo?'':siralamaHtml(snap.players,s.skor,{})}${bitisDugmeleri(api)}`;
    }
    function zaman(){
      const s=suan;if(!s)return;
      q('#cb-sure').textContent='⏱ '+sure((s.faz==='bitti'?s.bitisAt:api.now())-s.basla);
    }
    function yaz(ch){
      const s=suan;if(!s||s.faz!=='oyun')return;
      if(sec.i<0||!bosMu(sec.i)){toast('Önce bir kutu seç',1200);return}
      api.dispatch('yaz',{i:sec.i,ch});
    }

    kok.addEventListener('click',e=>{
      const s=suan;if(!s||s.faz!=='oyun')return;
      const tus=e.target.closest('[data-k]');if(tus){yaz(tus.dataset.k);return}
      const h=e.target.closest('.cb__h');
      if(h){
        const i=Number(h.dataset.h),m=hucreIp.get(i);
        if(i===sec.i&&m&&m.a!==undefined&&m.d!==undefined){sec={i,yon:sec.yon==='a'?'d':'a'};bilgiCiz();boyaCiz()}
        else sec_(i);
        return;
      }
      const p=e.target.closest('.cb__ip');
      if(p){
        const w=ip[Number(p.dataset.ip)];
        const i=ilkBos(w);
        if(i>=0){sec={i,yon:w.yon};bilgiCiz();boyaCiz()}
        else toast('Bu kelime zaten çözüldü',1200);
      }
    });
    q('#cb-ipucu').addEventListener('click',()=>{
      const s=suan;if(!s||s.faz!=='oyun')return;
      if(sec.i<0||!bosMu(sec.i)){toast('Önce açmak istediğin kutuyu seç',1500);return}
      api.dispatch('ipucu',{i:sec.i});
    });
    function tus(e){
      const s=suan;if(!s||s.faz!=='oyun'||e.ctrlKey||e.metaKey||e.altKey)return;
      const t=e.target;if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'))return;
      let k=e.key;
      if(k&&k.length===1){
        const h=k.toLocaleUpperCase('tr');
        if(ALFABE.has(h)){e.preventDefault();yaz(h)}
        else if(k===' '&&sec.i>=0){e.preventDefault();const m=hucreIp.get(sec.i);if(m&&m.a!==undefined&&m.d!==undefined){sec.yon=sec.yon==='a'?'d':'a';bilgiCiz();boyaCiz()}}
        return;
      }
      const d={ArrowLeft:[0,-1],ArrowRight:[0,1],ArrowUp:[-1,0],ArrowDown:[1,0]}[k];
      if(d&&sec.i>=0){
        e.preventDefault();
        let r=Math.floor(sec.i/s.c)+d[0],c=sec.i%s.c+d[1];
        while(r>=0&&r<s.r&&c>=0&&c<s.c){
          const i=r*s.c+c;
          if(harfMi(s.sol[i])){sec_(i,d[0]?'d':'a');return}
          r+=d[0];c+=d[1];
        }
      }
    }
    addEventListener('keydown',tus);
    bitisOlay(kok,api);

    function baslat(snap){
      const s=snap.state;if(!s)return;
      snapSon=snap;suan=s;
      if(s.oyun!==oyunNo){
        if(!kur(s)){q('#cb-bilgi').textContent='Bulmaca yükleniyor…';return false}
        oyunNo=s.oyun;clearInterval(sayac);sayac=setInterval(zaman,500);
        // ilk kutuyu seç
        const ilk=ip.find(x=>x.hucreler.some(i=>s.dolu[i]===undefined));
        if(ilk&&s.faz==='oyun'){const i=ilkBos(ilk);sec={i,yon:ilk.yon}}
      }
      ciz(snap);return true;
    }
    return{
      update(snap){
        if(!snap.state)return;
        if(!bulma(snap.state.z,snap.state.no)){
          // veri henüz yüklenmedi (oyuna sonradan katılan oyuncu): yükle ve tekrar dene
          if(!bekliyor){q('#cb-bilgi').textContent='Bulmaca yükleniyor…';bekliyor=yukle().then(()=>{bekliyor=null;baslat(snapSon)}).catch(()=>{bekliyor=null;hataGoster()})}
          snapSon=snap;return;
        }
        baslat(snap);
      },
      destroy(){clearInterval(sayac);removeEventListener('keydown',tus);root.innerHTML=''}
    };
  }
};
