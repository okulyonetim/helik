import test from 'node:test';
import assert from 'node:assert/strict';
import game from '../js/games/isimsehir.js';
import {puanla,degerlendir,bilinenMi} from '../js/games/isimsehir.puan.js';
import {rng} from '../js/core/util.js';

const oy=(...u)=>u.map(([uid,online=true,age='yetiskin'])=>({uid,name:uid.toUpperCase(),avatar:'🦊',age,online}));
const ctx=(players,now=1000,opts={})=>({players,now,rand:rng(11),opts,hostUid:players[0]?.uid});
const kur=(players,opts={},now=1000)=>{const c=ctx(players,now,opts);return{c,s:game.init(c)}};
const tumKat=s=>Object.fromEntries(s.kategoriler.map(k=>[k.id,'']));

test('init: en az 3 kategori, kendi kategoriler, çocuk varsa +30 sn, solo botlar',()=>{
  const {s}=kur(oy(['a'],['b']),{kategoriler:['isim'],ozel:['dizi']});
  assert.ok(s.kategoriler.length>=3);
  assert.ok(s.kategoriler.some(k=>k.ozel&&k.ad==='dizi'));
  assert.equal(s.faz,'tur');assert.equal(s.tur,1);assert.equal(s.sureMs,60000);assert.deepEqual(s.botlar,[]);
  const c=kur(oy(['a',true,'cocuk'],['b']),{sure:45}).s;assert.equal(c.sureMs,75000);
  const solo=kur(oy(['a']),{mode:'solo'}).s;
  assert.equal(solo.botlar.length,3);assert.equal(solo.kat.length,4);assert.equal(solo.botPlan.length,3);
  assert.equal(kur(oy(['a']),{mode:'online'}).s.botlar.length,0);
});

test('puanlama: tek cevap 10, aynı cevap 5, harf uymayan ve boş 0, kendi kategoride sözlük gerekmez',()=>{
  const {s}=kur(oy(['a'],['b'],['c']),{kategoriler:['isim','sehir','hayvan']});
  const h=s.harf;
  const cevap=(...x)=>Object.fromEntries(s.kategoriler.map((k,i)=>[k.id,x[i]??'']));
  const T=ad=>h+ad;                        /* harfle başlayan uydurma kelime */
  const t={...s,faz:'oy',cevaplar:{
    a:cevap(T('xx'),T('yy'),'Zzz'),
    b:cevap(T('xx'),T('qq'),''),
    c:cevap(T('ww'),T('yy'),h)
  }};
  const {pts,det}=puanla(t);
  const k=s.kategoriler.map(x=>x.id);
  assert.equal(det['a|'+k[0]].p,5);assert.equal(det['b|'+k[0]].p,5);assert.equal(det['c|'+k[0]].p,10);
  assert.equal(det['b|'+k[1]].p,10);assert.equal(det['a|'+k[1]].p,5);
  assert.equal(det['a|'+k[2]].durum,h==='Z'?'gecerli':'harf');
  assert.equal(det['b|'+k[2]].durum,'bos');
  assert.equal(det['c|'+k[2]].durum,'kisa');
  assert.equal(pts.a+pts.b+pts.c,[...Object.values(det)].reduce((x,d)=>x+d.p,0));
});

test('oylama: çoğunluk reddederse cevap geçersiz; kendi cevabına oy verilmez; sözlükteki cevap reddedilemez',()=>{
  const {s}=kur(oy(['a'],['b'],['c']),{kategoriler:['isim','sehir','hayvan']});
  const k0=s.kategoriler[0];
  const t0={...s,faz:'oy',harf:'K',cevaplar:{a:{[k0.id]:'Kxyz'},b:{},c:{}},oy:{}};
  assert.equal(degerlendir(t0,'a',k0).durum,'gecerli');
  /* 3 oyuncu: a'nın cevabı için diğer 2 kişi var → 2 ret gerekir */
  const bir={...t0,oy:{['a|'+k0.id]:['b']}};
  assert.equal(degerlendir(bir,'a',k0).durum,'gecerli');
  const iki={...t0,oy:{['a|'+k0.id]:['b','c']}};
  assert.equal(degerlendir(iki,'a',k0).durum,'red');
  assert.equal(degerlendir({...t0,oy:{['a|'+k0.id]:['a','a']}},'a',k0).durum,'gecerli','kendi oyu sayılmaz');
  /* sözlük */
  assert.ok(bilinenMi('isim','K','kemal'));
  const bilinen={...t0,cevaplar:{a:{[k0.id]:k0.id==='isim'?'Kemal':'Kxyz'},b:{},c:{}},oy:{['a|'+k0.id]:['b','c']}};
  if(k0.id==='isim')assert.equal(degerlendir(bilinen,'a',k0).durum,'ok');
  /* özel kategori sözlükten etkilenmez */
  assert.equal(degerlendir({...t0,cevaplar:{a:{x0:'Kemal'}}},'a',{id:'x0',ad:'dizi',ozel:true}).durum,'gecerli');
});

test('cevap/dur/oy eylemleri: doğrulama ve tekrar koruması',()=>{
  const p=oy(['a'],['b']);
  let {s}=kur(p,{kategoriler:['isim','sehir','hayvan']});
  const dolu=Object.fromEntries(s.kategoriler.map(k=>[k.id,s.harf+'ab']));
  assert.equal(game.reduce(s,{type:'dur',uid:'a',a:{}},ctx(p,2000)),s,'boş kutuyla DUR olmaz');
  assert.equal(game.reduce(s,{type:'cevap',uid:'x',a:dolu},ctx(p)),s,'oyuncu olmayan');
  let t=game.reduce(s,{type:'dur',uid:'a',a:dolu},ctx(p,2000));
  assert.equal(t.durBy,'a');assert.equal(t.endsAt,2000+5000);assert.ok(t.cevaplar.a);
  assert.equal(game.reduce(t,{type:'dur',uid:'b',a:dolu},ctx(p,2100)),t,'ikinci DUR yok sayılır');
  t=game.reduce(t,{type:'cevap',uid:'b',a:{...dolu,[s.kategoriler[0].id]:'  x '.repeat(40)}},ctx(p,3000));
  assert.ok(t.cevaplar.b[s.kategoriler[0].id].length<=30);
  assert.equal(game.reduce(t,{type:'cevap',uid:'b',a:{}},ctx(p,3100)),t,'ikinci gönderim yok sayılır');
});

test('tur akışı: herkes gönderince, ya da süre+pay dolunca oylamaya geçer; tamam dedikçe sonraki tur',()=>{
  const p=oy(['a'],['b']);
  let {s}=kur(p,{kategoriler:['isim','sehir','hayvan'],tur:3},1000);
  assert.equal(game.tick(s,ctx(p,2000)),null,'süre dolmadı');
  const dolu=Object.fromEntries(s.kategoriler.map(k=>[k.id,s.harf+'ab']));
  s=game.reduce(s,{type:'cevap',uid:'a',a:dolu},ctx(p,s.endsAt));
  assert.equal(game.tick(s,ctx(p,s.endsAt)),null,'b henüz göndermedi');
  const sonra=game.tick(s,ctx(p,s.endsAt+2600));
  assert.equal(sonra.faz,'oy');assert.deepEqual(sonra.cevaplar.b,{},'göndermeyenin cevabı boş');
  /* oylama: b tamam */
  let o=game.reduce(sonra,{type:'hazir',uid:'a'},ctx(p));
  assert.equal(game.tick(o,ctx(p,sonra.oyBitis-1)),null);
  o=game.reduce(o,{type:'hazir',uid:'b'},ctx(p));
  const n=game.tick(o,ctx(p,sonra.oyBitis-10));
  assert.equal(n.faz,'tur');assert.equal(n.tur,2);assert.notEqual(n.harf,s.harf);assert.ok(n.skor.a>0);
  assert.deepEqual(n.cevaplar,{});
});

test('son tur sonrası oyun biter; harfler tekrar etmez',()=>{
  const p=oy(['a']);
  let {s}=kur(p,{kategoriler:['isim','sehir','hayvan'],tur:3},0);
  const harfler=[s.harf];
  for(let i=1;i<=3;i++){
    const dolu=Object.fromEntries(s.kategoriler.map(k=>[k.id,s.harf+'ab']));
    s=game.reduce(s,{type:'cevap',uid:'a',a:dolu},ctx(p,s.endsAt));
    s=game.tick(s,ctx(p,s.endsAt));
    assert.equal(s.faz,'oy');
    s=game.reduce(s,{type:'hazir',uid:'a'},ctx(p));
    s=game.tick(s,ctx(p,s.oyBitis-1));
    if(i<3){assert.equal(s.faz,'tur');harfler.push(s.harf)}
  }
  assert.equal(s.faz,'bitti');assert.equal(new Set(harfler).size,3);
  assert.ok(s.skor.a>=30);
});

test('solo: botlar DUR der ve cevap yazar; cevaplar zamana bağlıdır',()=>{
  const p=oy(['a']);
  let {s}=kur(p,{mode:'solo',tur:3,sure:90},0);
  const ilk=s.botPlan.find(b=>b.durAt!=null);
  if(ilk){
    assert.equal(game.tick(s,ctx(p,ilk.durAt-1)),null);
    const d=game.tick(s,ctx(p,ilk.durAt));
    assert.ok(d.durBy.startsWith('bot'));assert.equal(d.endsAt,ilk.durAt+5000);
    s=d;
  }
  s=game.reduce(s,{type:'cevap',uid:'a',a:{}},ctx(p,s.endsAt));
  const oyl=game.tick(s,ctx(p,s.endsAt));
  assert.equal(oyl.faz,'oy');
  for(const b of oyl.botPlan){
    for(const k in oyl.cevaplar[b.id])assert.ok(b.ans[k].t<=oyl.endsAt-oyl.basla);
  }
  /* bot cevabı sözlükten gelir → geçerli (ok) */
  const {det}=puanla(oyl);
  for(const b of oyl.botPlan)for(const k in oyl.cevaplar[b.id])assert.equal(det[b.id+'|'+k].durum,'ok');
});

test('çevrimdışı oyuncuyu beklemez; herkes çevrimdışıysa tur ilerlemez',()=>{
  const p=oy(['a'],['b',false]);
  let {s}=kur(p,{kategoriler:['isim','sehir','hayvan']},0);
  const dolu=Object.fromEntries(s.kategoriler.map(k=>[k.id,s.harf+'ab']));
  s=game.reduce(s,{type:'cevap',uid:'a',a:dolu},ctx(p,s.endsAt));
  assert.equal(game.tick(s,ctx(p,s.endsAt)).faz,'oy');
  const hepsiYok=oy(['a',false],['b',false]);
  let t=game.tick(s,ctx(hepsiYok,s.endsAt+2600));
  assert.equal(t.faz,'oy');   /* süre dolduğu için oylamaya geçer */
  assert.equal(game.tick(t,ctx(hepsiYok,t.oyBitis+1)),null,'kimse yokken tur yanmaz');
});

test('durum JSON ile gidip gelir',()=>{
  const {s}=kur(oy(['a'],['b']),{mode:'solo'});
  assert.deepEqual(JSON.parse(JSON.stringify(s)),s);
});
