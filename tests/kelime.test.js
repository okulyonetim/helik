import test,{before} from 'node:test';
import assert from 'node:assert/strict';
import game,{puanOf} from '../js/games/kelime.js';
import {yukle,hepsiniBul,cikarilabilir,gecerli,tohumlar} from '../js/games/kelime.sozluk.js';
import {rng,up} from '../js/core/util.js';

const oy=(...u)=>u.map(([uid,online=true,age='yetiskin'])=>({uid,name:uid,avatar:'🦊',age,online}));
const ctx=(players,now=1000,opts={})=>({players,now,rand:rng(21),opts,hostUid:players[0]?.uid});
before(async()=>{await yukle()});
const kur=(players,opts={},now=1000)=>game.init(ctx(players,now,opts));

test('sözlük: yaygın kelimeler var, uydurma yok; ı/i ayrımı korunur; küfür filtresi çalışıyor',()=>{
  for(const w of ['kedi','kitap','okul','çocuk','balık','ıslak'])assert.ok(gecerli(w),w);
  for(const w of ['kdkd','xyz','ankara'])assert.ok(!gecerli(w),w);
  assert.ok(!gecerli('Kedi'),'büyük harfli aranmaz');
  assert.ok(tohumlar(6).length>300&&tohumlar(7).length>500&&tohumlar(8).length>500);
});

test('cikarilabilir: harf adedi sayılır',()=>{
  const raf=[...'kalemli'];
  assert.ok(cikarilabilir(raf,'kale'));assert.ok(cikarilabilir(raf,'kalemli'));
  assert.ok(!cikarilabilir(raf,'kalem'+'mm'));assert.ok(!cikarilabilir(raf,'kaleee'));
  assert.ok(!cikarilabilir([...'abc'],'abcd'));
});

test('init: raf tohum kelimenin harfleri, karışık, en az 25 kelime çıkarılabilir',()=>{
  for(const boyut of [6,7,8]){
    const s=kur(oy(['a'],['b']),{boyut});
    assert.equal(s.harfler.length,boyut);assert.equal([...s.tohum].sort().join(''),[...s.harfler].sort().join(''));
    assert.notEqual(s.harfler.join(''),s.tohum);
    assert.ok(hepsiniBul(s.harfler).length>=25);
    assert.ok(hepsiniBul(s.harfler).includes(s.tohum));
  }
  assert.equal(kur(oy(['a',true,'cocuk']),{sure:60}).sureMs,90000);
});

test('puan tablosu uzunluğa göre artar',()=>{
  assert.deepEqual([3,4,5,6,7,8].map(n=>puanOf('x'.repeat(n))),[1,2,4,7,11,16]);
});

test('kelime bulma: geçerli kelime puan verir; tekrar, geçersiz, raf dışı ve kısa kelime yok sayılır',()=>{
  const p=oy(['a'],['b']);
  let s=kur(p,{boyut:7});
  const olasi=hepsiniBul(s.harfler);
  const w=olasi.find(x=>x.length===4);
  const a=game.reduce(s,{type:'kelime',uid:'a',w:up(w)},ctx(p,2000));      /* büyük harfle gelse de kabul */
  assert.deepEqual(a.bulunan.a,[w]);assert.equal(a.turPuan.a,2);assert.equal(a.skor.a,2);assert.deepEqual(a.bulunan.b,[]);
  assert.equal(game.reduce(a,{type:'kelime',uid:'a',w},ctx(p,2100)),a,'aynı kelime iki kez sayılmaz');
  const b=game.reduce(a,{type:'kelime',uid:'b',w},ctx(p,2200));
  assert.deepEqual(b.bulunan.b,[w],'başka oyuncu aynı kelimeyi bulabilir');
  assert.equal(game.reduce(s,{type:'kelime',uid:'a',w:'zzzz'},ctx(p)),s,'raf dışı');
  assert.equal(game.reduce(s,{type:'kelime',uid:'a',w:'ab'},ctx(p)),s,'çok kısa');
  assert.equal(game.reduce(s,{type:'kelime',uid:'x',w},ctx(p)),s,'oyuncu olmayan');
  const yok=[...s.harfler].slice(0,4).join('');
  if(!gecerli(yok))assert.equal(game.reduce(s,{type:'kelime',uid:'a',w:yok},ctx(p)),s,'sözlükte yok');
  assert.equal(game.reduce(s,{type:'kelime',uid:'a',w},ctx(p,s.bitis+2000)),s,'süre bittikten sonra');
});

test('tur akışı: süre bitince ara, sonra sonraki tur; son tur bitirir; raflar tekrar etmez',()=>{
  const p=oy(['a']);
  let s=kur(p,{tur:3},0);
  const raflar=[s.tohum];
  assert.equal(game.tick(s,ctx(p,s.bitis)),null,'kabul payı içinde');
  s=game.tick(s,ctx(p,s.bitis+1600));
  assert.equal(s.faz,'ara');assert.equal(game.tick(s,ctx(p,s.araBitis-1)),null);
  s=game.tick(s,ctx(p,s.araBitis));
  assert.equal(s.faz,'tur');assert.equal(s.tur,2);assert.deepEqual(s.bulunan.a,[]);raflar.push(s.tohum);
  s=game.tick(s,ctx(p,s.bitis+1600));s=game.tick(s,ctx(p,s.araBitis));
  assert.equal(s.tur,3);raflar.push(s.tohum);
  s=game.tick(s,ctx(p,s.bitis+1600));
  assert.equal(s.faz,'bitti');assert.equal(new Set(raflar).size,3);
  assert.equal(game.tick(s,ctx(p,1e12)),null);
});

test('toplam puan turlar boyunca birikir',()=>{
  const p=oy(['a']);
  let s=kur(p,{tur:3},0);
  const w=hepsiniBul(s.harfler).find(x=>x.length===5);
  s=game.reduce(s,{type:'kelime',uid:'a',w},ctx(p,10));
  s=game.tick(s,ctx(p,s.bitis+1600));s=game.tick(s,ctx(p,s.araBitis));
  assert.equal(s.skor.a,4);assert.equal(s.turPuan.a,0);
});

test('durum JSON ile gidip gelir',()=>{
  const s=kur(oy(['a'],['b']),{});
  assert.deepEqual(JSON.parse(JSON.stringify(s)),s);
});
