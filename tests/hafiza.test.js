import test from 'node:test';
import assert from 'node:assert/strict';
import game,{sonraki} from '../js/games/hafiza.js';
import {rng} from '../js/core/util.js';

const oyuncular=(...u)=>u.map(([uid,online=true,age='yetiskin'])=>({uid,name:uid,avatar:'🦊',age,online}));
const ctx=(players,now=1000,opts={})=>({players,now,rand:rng(7),opts,hostUid:players[0]?.uid});
const eslerini=s=>{const m={};s.kartlar.forEach((k,i)=>(m[k]??=[]).push(i));return Object.values(m)};

test('init: zorluğa göre çift sayısı ve karışık kartlar',()=>{
  const p=oyuncular(['a'],['b']);
  for(const [z,c] of [['kolay',12],['orta',16],['zor',24]]){
    const s=game.init(ctx(p,0,{zorluk:z}));
    assert.equal(s.kartlar.length,c);
    assert.ok(eslerini(s).every(x=>x.length===2));
    assert.equal(s.sira,'a');assert.equal(s.kalan,c/2);
  }
});

test('eşleşme: puan, sıra aynı kişide, hamle sayılır',()=>{
  const p=oyuncular(['a'],['b']);let s=game.init(ctx(p));
  const [x,y]=eslerini(s)[0];
  s=game.reduce(s,{type:'cevir',uid:'a',i:x},ctx(p));
  assert.deepEqual(s.acik,[x]);
  s=game.reduce(s,{type:'cevir',uid:'a',i:y},ctx(p));
  assert.equal(s.skor.a,1);assert.deepEqual(s.acik,[]);assert.equal(s.sahip[x],'a');assert.equal(s.sira,'a');assert.equal(s.hamle.a,1);
});

test('kaçırma: kartlar bir süre açık kalır, sonra kapanır ve sıra geçer',()=>{
  const p=oyuncular(['a'],['b']);let s=game.init(ctx(p,1000));
  const g=eslerini(s);const x=g[0][0],y=g[1][0];
  s=game.reduce(s,{type:'cevir',uid:'a',i:x},ctx(p,1000));
  s=game.reduce(s,{type:'cevir',uid:'a',i:y},ctx(p,1000));
  assert.equal(s.acik.length,2);assert.ok(s.gizleAt>1000);
  /* bu sırada kart çevrilemez */
  const ayni=game.reduce(s,{type:'cevir',uid:'a',i:g[2][0]},ctx(p,1100));
  assert.equal(ayni,s);
  assert.equal(game.tick(s,ctx(p,1200)),null);
  const t=game.tick(s,ctx(p,s.gizleAt));
  assert.deepEqual(t.acik,[]);assert.equal(t.sira,'b');assert.equal(t.gizleAt,0);
});

test('sırası olmayan oyuncu, açık kart ve eşleşmiş kart çevrilemez',()=>{
  const p=oyuncular(['a'],['b']);let s=game.init(ctx(p));
  assert.equal(game.reduce(s,{type:'cevir',uid:'b',i:0},ctx(p)),s);
  s=game.reduce(s,{type:'cevir',uid:'a',i:0},ctx(p));
  assert.equal(game.reduce(s,{type:'cevir',uid:'a',i:0},ctx(p)),s);
  assert.equal(game.reduce(s,{type:'cevir',uid:'a',i:999},ctx(p)),s);
  assert.equal(game.reduce(s,{type:'cevir',uid:'a',i:-1},ctx(p)),s);
  assert.equal(game.reduce(s,{type:'cevir',uid:'a',i:'1'},ctx(p)),s);
});

test('bütün çiftler bulununca oyun biter',()=>{
  const p=oyuncular(['a']);let s=game.init(ctx(p,0,{zorluk:'kolay'}));
  for(const [x,y] of eslerini(s)){
    s=game.reduce(s,{type:'cevir',uid:'a',i:x},ctx(p));
    s=game.reduce(s,{type:'cevir',uid:'a',i:y},ctx(p));
  }
  assert.equal(s.faz,'bitti');assert.equal(s.skor.a,6);assert.equal(s.kalan,0);
  assert.equal(game.tick(s,ctx(p,99999)),null);
});

test('çevrimdışı oyuncunun sırası atlanır; çocuk varsa kartlar daha uzun açık kalır',()=>{
  const p=oyuncular(['a'],['b'],['c']);
  assert.equal(sonraki('a',ctx(oyuncular(['a'],['b',false],['c']))),'c');
  assert.equal(sonraki('c',ctx(oyuncular(['a'],['b'],['c']))),'a');
  assert.equal(sonraki('a',ctx(oyuncular(['a'],['b',false]))),'a');
  let s=game.init(ctx(p));
  const t=game.tick(s,ctx(oyuncular(['a',false],['b'],['c'])));
  assert.equal(t.sira,'b');
  const yetis=game.init(ctx(oyuncular(['a'])));const cocuk=game.init(ctx(oyuncular(['a',true,'cocuk'])));
  assert.ok(cocuk.gizleMs>yetis.gizleMs);
});

test('durum JSON ile gidip gelir',()=>{
  const s=game.init(ctx(oyuncular(['a'],['b'])));
  assert.deepEqual(JSON.parse(JSON.stringify(s)),s);
});
