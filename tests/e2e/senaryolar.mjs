/* Oyun başına uçtan uca senaryolar: iki (bazen üç) istemci aynı odada gerçek ekranlarla oynar. */
const bekle=ms=>new Promise(r=>setTimeout(r,ms));
const tikla=(f,sel)=>f.evaluate(s=>{const e=document.querySelector(s);if(!e)throw new Error('yok: '+s);if(e.click)e.click();else e.dispatchEvent(new MouseEvent('click',{bubbles:true}))},sel);
const var_=(f,sel)=>f.evaluate(s=>!!document.querySelector(s),sel);
const metin=(f,sel)=>f.evaluate(s=>document.querySelector(s)?.innerText||'',sel);
const durum=f=>f.evaluate(()=>JSON.parse(JSON.stringify(window.durum())));
const foto=(p,ad,CIKTI)=>p.screenshot({path:`${CIKTI}/${ad}.png`});

export default {
  async hafiza({p,fr,ok,kur,CIKTI}){
    await kur({zorluk:'kolay'});
    const [a,b]=fr;
    ok(await var_(a,'.hk')&&await var_(b,'.hk'),'her iki ekranda kartlar var');
    let s=await durum(a);
    ok(s.sira==='u0','sıra ev sahibinde');
    // sırası olmayan tıklayınca bir şey olmaz
    await tikla(b,'.hk[data-i="0"]');await bekle(150);
    ok((await durum(a)).acik.length===0,'sırası olmayan kart çeviremez');
    // eşleşen çift
    const cift=()=>{const m={};s.kartlar.forEach((k,i)=>{(m[k]=m[k]||[]).push(i)});return Object.values(m)};
    const [x,y]=cift().find(c=>!s.sahip[c[0]]);
    await tikla(a,`.hk[data-i="${x}"]`);await tikla(a,`.hk[data-i="${y}"]`);await bekle(250);
    s=await durum(b);
    ok(s.sahip[x]==='u0'&&s.skor.u0===1&&s.sira==='u0','eşleşme konuğa yansıdı, sıra korunur');
    ok((await metin(b,'#hdurum')).includes('Ayşe'),'konuk "Sıra: Ayşe" görür');
    // eşleşmeyen: sıra geçer
    const [c1,c2]=cift().filter(c=>!s.sahip[c[0]]).slice(0,2).map(c=>c[0]);
    await tikla(a,`.hk[data-i="${c1}"]`);await tikla(a,`.hk[data-i="${c2}"]`);await bekle(150);
    ok((await metin(b,'#hdurum')).includes('Eşleşmedi'),'konuk eşleşmeme durumunu görür');
    await bekle(1900);
    s=await durum(b);
    ok(s.sira==='u1','sıra konuğa geçti');
    ok((await metin(b,'#hdurum')).includes('Sıra sende'),'konuğun ekranında "Sıra sende"');
    await foto(p,'hafiza-orta',CIKTI);
    // oyunu sırayla bitir
    for(let k=0;k<40;k++){
      s=await durum(a);if(s.faz==='bitti')break;
      const f=s.sira==='u0'?a:b;
      const c=cift().find(c=>!s.sahip[c[0]]);
      await tikla(f,`.hk[data-i="${c[0]}"]`);await tikla(f,`.hk[data-i="${c[1]}"]`);await bekle(120);
    }
    s=await durum(a);ok(s.faz==='bitti','oyun bitti');
    ok(s.skor.u0+s.skor.u1===s.kartlar.length/2,'toplam çift sayısı doğru');
    await bekle(200);
    ok(await var_(a,'[data-ortak="tekrar"]')&&!await var_(b,'[data-ortak="tekrar"]'),'yalnız oda sahibi tekrar başlatabilir');
    await foto(p,'hafiza-bitis',CIKTI);
    const eski=s.tur;
    await tikla(a,'[data-ortak="tekrar"]');await bekle(500);
    s=await durum(b);ok(s.faz==='oyun'&&s.tur!==eski,'tekrar oyna yeni oyun başlatır (konuk da görür)');
  },

  async adamasmaca({p,fr,ok,kur,CIKTI}){
    await kur({zorluk:'kolay',tur:1});
    const [a,b]=fr;
    ok(await var_(a,'#ac-klavye')&&await var_(b,'#ac-klavye'),'klavye iki ekranda');
    let s=await durum(a);
    ok(s.faz==='oyun'&&s.kelime.length>=3,'kelime seçildi');
    const sira=()=>durum(a).then(x=>x.sira);
    // yanlış harf: sıra geçer
    const yanlis='ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ'.split('').find(h=>!s.kelime.includes(h));
    const ilk=await sira();const f1=ilk==='u0'?a:b,f2=ilk==='u0'?b:a;
    await tikla(f1,`[data-h="${yanlis}"]`);await bekle(250);
    s=await durum(b);
    ok(s.yanlis===1&&s.sira!==ilk,'yanlış harf can götürür, sıra geçer');
    ok(await f2.evaluate(h=>document.querySelector(`[data-h="${h}"]`).disabled,yanlis),'kullanılan harf diğer ekranda da kapalı');
    await foto(p,'adamasmaca-orta',CIKTI);
    // doğru harfleri sırayla bul
    for(let k=0;k<30;k++){
      s=await durum(a);if(s.faz!=='oyun')break;
      const eksik=[...new Set(s.kelime)].find(c=>!s.tahmin.includes(c));
      const f=s.sira==='u0'?a:b;
      await tikla(f,`[data-h="${eksik}"]`);await bekle(100);
    }
    s=await durum(b);
    ok(s.faz==='bitti'&&s.sonuc==='kazandi','kelime bulundu, oyun bitti');
    await bekle(200);
    ok((await metin(b,'#ac-sonuc')).includes('Oyun bitti'),'sonuç paneli konukta görünür');
    await foto(p,'adamasmaca-bitis',CIKTI);
  },

  async isimsehir({p,fr,ok,kur,CIKTI}){
    await kur({tur:3,sure:60});
    const [a,b]=fr;
    ok(await var_(a,'#is-form')&&await var_(b,'#is-form'),'form iki ekranda');
    const girdi=async(f,onek)=>{
      const harf=await f.evaluate(()=>window.durum().harf);
      const n=await f.evaluate(()=>document.querySelectorAll('#is-form input').length);
      for(let i=0;i<n;i++){
        await f.evaluate((i,t)=>{const e=document.querySelectorAll('#is-form input')[i];e.value=t;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))},i,harf+onek+i);
      }
      return harf;
    };
    let s=await durum(a);
    for(let tur=1;tur<=3;tur++){
      s=await durum(a);
      ok(s.faz==='tur'&&s.tur===tur,tur+'. tur başladı ('+s.faz+' '+s.tur+')');
      await girdi(a,'ali');await girdi(b,'bora');await bekle(300);
      if(tur===1)await foto(p,'isimsehir-tur',CIKTI);
      await tikla(a,'#is-dur');
      for(let k=0;k<30&&s.faz==='tur';k++){await bekle(500);s=await durum(b)}
      ok(s.faz==='oy','DUR sonrası oylamaya geçildi ('+s.faz+')');
      if(tur===1){await foto(p,'isimsehir-oy',CIKTI);ok((await metin(b,'#is')).length>20,'konuk ekranı dolu')}
      for(let k=0;k<8&&s.faz==='oy';k++){
        for(const f of [a,b]){if(await var_(f,'[data-is="hazir"]'))await tikla(f,'[data-is="hazir"]').catch(()=>{})}
        await bekle(500);s=await durum(a);
      }
    }
    s=await durum(a);ok(s.faz==='bitti','oyun sonuna ulaştı ('+s.faz+')');
    ok(typeof s.skor.u0==='number'&&typeof s.skor.u1==='number','iki oyuncunun puanı var');
    await bekle(300);await foto(p,'isimsehir-bitis',CIKTI);
  },

  async bilgi({p,fr,ok,kur,CIKTI}){
    await kur({adet:5,aile:false});
    const [a,b]=fr;
    ok(await var_(a,'.bg__sik')&&await var_(b,'.bg__sik'),'şıklar iki ekranda');
    let s=await durum(a);
    const dogruNo=s.sorular[s.i].d??s.sorular[s.i].dogru;
    await tikla(a,'.bg__sik[data-c="0"]');await bekle(200);
    ok(await a.evaluate(()=>[...document.querySelectorAll('.bg__sik')].some(e=>e.disabled||e.className.includes('sec'))),'cevaplayan ekran kilitlendi');
    await tikla(b,'.bg__sik[data-c="1"]');await bekle(500);
    s=await durum(a);
    ok(Object.keys(s.cevaplar).length===2||s.faz!=='soru','iki cevap da kaydedildi');
    await foto(p,'bilgi-cevap',CIKTI);
    // sorular boyunca ilerle
    for(let k=0;k<60;k++){
      s=await durum(a);if(s.faz==='bitti')break;
      if(s.faz==='soru'){
        for(const [f,u] of [[a,'u0'],[b,'u1']])if(!s.cevaplar[u])await tikla(f,'.bg__sik[data-c="2"]').catch(()=>{});
      }
      await bekle(450);
    }
    s=await durum(b);ok(s.faz==='bitti','yarışma bitti');
    ok(s.skor.u0+s.skor.u1>=0&&Object.keys(s.skor).length===2,'puan tablosu');
    await bekle(300);await foto(p,'bilgi-bitis',CIKTI);
  },

  async kelime({p,fr,ok,kur,CIKTI}){
    await kur({tur:1,boyut:6,sure:60});
    const [a,b]=fr;
    ok(await var_(a,'.kl__tas')&&await var_(b,'.kl__tas'),'harfler iki ekranda');
    const s0=await durum(a);
    const kelimeler=await a.evaluate(async h=>{const m=await import('/js/games/kelime.sozluk.js');await m.yukle();return m.hepsiniBul(h,{yalnizYaygin:true}).slice(0,12)},s0.harfler);
    ok(kelimeler.length>=3,'harflerden kelime çıkıyor ('+kelimeler.slice(0,3)+')');
    const yaz=async(f,w)=>{
      // harfleri raftan sırayla seç
      const idx=await f.evaluate(w=>{const t=[...document.querySelectorAll('.kl__tas')].map(e=>e.textContent.toLocaleLowerCase('tr'));const kul=new Set(),r=[];for(const c of w){const i=t.findIndex((x,j)=>x===c&&!kul.has(j));if(i<0)return null;kul.add(i);r.push(i)}return r},w);
      if(!idx)return false;
      for(const i of idx)await tikla(f,`.kl__tas[data-i="${i}"]`);
      await tikla(f,'[data-kl="gonder"]');await bekle(180);return true;
    };
    ok(await yaz(a,kelimeler[0]),'ev sahibi kelime yazdı');
    ok(await yaz(b,kelimeler[1]),'konuk kelime yazdı');
    await bekle(300);
    const s=await durum(b);
    ok(Object.keys(s.bulunan).length>=2,'iki oyuncunun kelimeleri durumda');
    ok((await metin(a,'#kl')).toLocaleLowerCase('tr').includes(kelimeler[0]),'ev sahibinin ekranında kendi kelimesi var');
    await foto(p,'kelime-tur',CIKTI);
    // süre dolsun diye bekleme yerine host tick'iyle bitişi zorla
    await a.evaluate(()=>{const r=window.room;r.state={...r.state,bitis:r.db.now()-5000};r._yayinla()});
    await bekle(2500);
    const son=await durum(b);
    ok(son.faz!=='tur','süre bitince tur kapandı ('+son.faz+')');
    await foto(p,'kelime-bitis',CIKTI);
  },

  async cengel({p,fr,ok,kur,CIKTI}){
    await kur({zorluk:'kolay'},3);
    const [a,b,c]=fr;
    ok(await var_(a,'.cb__h')&&await var_(b,'.cb__h')&&await var_(c,'.cb__h'),'ızgara üç ekranda');
    let s=await durum(a);
    const hucreler=[...s.sol].map((ch,i)=>[ch,i]).filter(([ch])=>ch!=='#'&&ch!=='.');
    // konuk doğru harfi yazar → ev sahibinde de görünür
    const [ch1,i1]=hucreler[0];
    await tikla(b,`.cb__h[data-h="${i1}"]`);await tikla(b,`.cb__tus[data-k="${ch1}"]`);await bekle(250);
    ok((await metin(a,`.cb__h[data-h="${i1}"]`)).trim()===ch1,'konuğun doğru harfi ev sahibinde görünür');
    s=await durum(a);ok(s.dolu[i1]==='u1'&&s.skor.u1>=2,'kutuyu yazan kişiye puan');
    // ev sahibi yanlış harf
    const [,i2]=hucreler[1];const yanlis=hucreler[1][0]==='Z'?'Y':'Z';
    await tikla(a,`.cb__h[data-h="${i2}"]`);await tikla(a,`.cb__tus[data-k="${yanlis}"]`);await bekle(200);
    s=await durum(b);ok(s.dolu[i2]===undefined&&s.skor.u0===0&&s.son&&s.son.ok===false,'yanlış harf kilitlenmez, puan 0 altına inmez');
    await foto(p,'cengel-orta',CIKTI);
    // üçüncü oyuncu fiziksel klavyeyle yazar
    const [ch3,i3]=hucreler[2];
    await tikla(c,`.cb__h[data-h="${i3}"]`);
    await c.evaluate(h=>window.dispatchEvent(new KeyboardEvent('keydown',{key:h.toLocaleLowerCase('tr'),bubbles:true})),ch3);
    await bekle(250);
    s=await durum(a);ok(s.dolu[i3]==='u2','fiziksel klavye çalışıyor');
    // ev sahibi çıkar → konuk devralır ve oyun sürer
    await a.evaluate(()=>window.room.leave());await bekle(1800);
    const [ch4,i4]=hucreler[3];
    await tikla(b,`.cb__h[data-h="${i4}"]`);await tikla(b,`.cb__tus[data-k="${ch4}"]`);await bekle(500);
    s=await durum(b);ok(s.dolu[i4]==='u1','ev sahibi çıktıktan sonra oyun konuk tarafından sürdürülür');
    const yeniHost=await b.evaluate(()=>window.room.isHost())||await c.evaluate(()=>window.room.isHost());
    ok(yeniHost,'yeni host belirlendi');
    // kalanları sırayla doldur
    for(const [ch,i] of hucreler){
      s=await durum(b);if(s.faz==='bitti')break;
      if(s.dolu[i]!==undefined)continue;
      const f=(await b.evaluate(()=>window.room.isHost()))?b:c;
      await tikla(f,`.cb__h[data-h="${i}"]`);await tikla(f,`.cb__tus[data-k="${ch}"]`);await bekle(60);
    }
    await bekle(300);
    s=await durum(c);ok(s.faz==='bitti','bulmaca tamamlandı');
    ok((await metin(c,'#cb-sonuc')).includes('Bulmaca çözüldü'),'bitiş paneli');
    await foto(p,'cengel-bitis',CIKTI);
  },

  async yapboz({p,fr,ok,kur,CIKTI}){
    await kur({parca:'2x3',sahne:'deniz'},3);
    const [a,b,c]=fr;
    ok(await var_(a,'.yp__parca')&&await var_(b,'.yp__parca')&&await var_(c,'.yp__parca'),'parçalar üç ekranda');
    let s=await durum(a);
    const koy=async(f,i)=>{
      const secili=await f.evaluate(i=>!!document.querySelector(`.yp__parca--secili[data-p="${i}"]`),i);
      if(!secili)await tikla(f,`.yp__parca[data-p="${i}"]`);
      await tikla(f,`.yp__yuva[data-y="${i}"]`);await bekle(150);
    };
    await koy(b,3);
    ok((await durum(a)).yer[3]==='u1','konuğun parçası ev sahibinde yerleşti');
    ok(!await var_(a,'.yp__parca[data-p="3"]')&&!await var_(c,'.yp__parca[data-p="3"]'),'yerleşen parça diğer tepsilerden kalktı');
    // yanlış yuva
    await tikla(a,'.yp__parca[data-p="0"]');await tikla(a,'.yp__yuva[data-y="1"]');await bekle(150);
    ok((await durum(a)).yer[1]==='','yanlış yuvaya konmaz');
    await foto(p,'yapboz-orta',CIKTI);
    for(let i=0;i<s.n;i++){
      if((await durum(a)).yer[i])continue;
      await koy([a,b,c][i%3],i);
    }
    await bekle(300);
    s=await durum(c);ok(s.faz==='bitti','yapboz tamamlandı');
    ok(s.skor.u0+s.skor.u1+s.skor.u2===s.n,'parça sayısı kadar puan');
    ok((await metin(b,'#yp-sonuc')).includes('Yapboz tamam'),'bitiş paneli');
    await foto(p,'yapboz-bitis',CIKTI);
  },

  async boyama({p,fr,ok,kur,CIKTI}){
    await kur({sayfa:'balik'},3);
    const [a,b,c]=fr;
    ok(await var_(a,'.by__tuval svg')&&await var_(b,'.by__tuval svg'),'tuval üç ekranda');
    await tikla(b,'.by__renk[data-c="3"]');
    await tikla(b,'.by__tuval [data-r="govde"]');await bekle(200);
    const renk=f=>f.evaluate(()=>document.querySelector('.by__tuval [data-r="govde"]').getAttribute('fill'));
    const hedef=await renk(b);
    ok(hedef!=='#ffffff'&&await renk(a)===hedef&&await renk(c)===hedef,'konuğun boyaması herkeste aynı');
    await tikla(a,'.by__renk[data-c="0"]');await tikla(a,'.by__tuval [data-r="kuyruk"]');await bekle(200);
    ok(await c.evaluate(()=>document.querySelector('.by__tuval [data-r="kuyruk"]').getAttribute('fill'))===await a.evaluate(()=>document.querySelector('.by__tuval [data-r="kuyruk"]').getAttribute('fill')),'ev sahibinin boyaması da yansır');
    await foto(p,'boyama-orta',CIKTI);
    // silgi
    await tikla(c,'.by__renk[data-c="-1"]');await tikla(c,'.by__tuval [data-r="kuyruk"]');await bekle(200);
    ok(await a.evaluate(()=>document.querySelector('.by__tuval [data-r="kuyruk"]').getAttribute('fill'))==='#ffffff','silgi herkeste siler');
    // sayfa değiştir: onay penceresi çıkar
    await tikla(a,'[data-sayfa="roket"]');await bekle(200);
    ok(await var_(a,'[data-v="1"]'),'boyalı sayfadan çıkarken onay sorulur');
    await tikla(a,'[data-v="1"]');await bekle(300);
    const s=await durum(b);ok(s.sayfa==='roket'&&Object.keys(s.dolgu).length===0,'sayfa değişti, boyama sıfırlandı');
    ok(await b.evaluate(()=>!!document.querySelector('.by__tuval [data-r="pencere"]')),'konuğun tuvali yeni sayfayı gösterir');
    await foto(p,'boyama-bitis',CIKTI);
  }
};
