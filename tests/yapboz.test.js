import test from 'node:test';
import assert from 'node:assert/strict';
import game,{BOYUTLAR} from '../js/games/yapboz.js';
import {rng} from '../js/core/util.js';

const oy=(...u)=>u.map(([uid,online=true])=>({uid,name:uid,avatar:'🦊',age:'yetiskin',online}));
const ctx=(players,now=1000,opts={})=>({players,now,rand:rng(8),opts,hostUid:players[0]?.uid});

test('init: boyut, karışık tepsi, boş yuvalar, sahne seçimi',()=>{
  for(const [k,[c,r]] of Object.entries(BOYUTLAR)){
    const s=game.init(ctx(oy(['a']),0,{parca:k}));
    assert.equal(s.n,c*r);assert.equal(s.kolon,c);assert.equal(s.satir,r);
    assert.deepEqual([...s.karisik].sort((a,b)=>a-b),[...Array(c*r).keys()]);
    assert.ok(s.yer.every(x=>x===''));
  }
  assert.equal(game.init(ctx(oy(['a']),0,{sahne:'uzay'})).sahne,'uzay');
  assert.ok(['koy','deniz','uzay','bahce'].includes(game.init(ctx(oy(['a']),0,{sahne:'rastgele'})).sahne));
  assert.equal(game.init(ctx(oy(['a']),0,{})).ipucu,true);
  assert.equal(game.init(ctx(oy(['a']),0,{ipucu:false})).ipucu,false);
});

test('parça koyma: puan, tekrar koruması, geçersiz girişler',()=>{
  const p=oy(['a'],['b']);let s=game.init(ctx(p,0,{parca:'2x3'}));
  s=game.reduce(s,{type:'koy',uid:'a',i:2},ctx(p,10));
  assert.equal(s.yer[2],'a');assert.equal(s.skor.a,1);
  assert.equal(game.reduce(s,{type:'koy',uid:'b',i:2},ctx(p)),s,'aynı parça iki kez');
  for(const a of [{type:'koy',uid:'x',i:0},{type:'koy',uid:'a',i:6},{type:'koy',uid:'a',i:-1},{type:'koy',uid:'a',i:'0'},{type:'baska',uid:'a'}])
    assert.equal(game.reduce(s,a,ctx(p)),s);
});

test('son parça oyunu bitirir; puanlar paylaşılır',()=>{
  const p=oy(['a'],['b']);let s=game.init(ctx(p,100,{parca:'2x3'}));
  for(let i=0;i<6;i++)s=game.reduce(s,{type:'koy',uid:i%3===0?'b':'a',i},ctx(p,500+i));
  assert.equal(s.faz,'bitti');assert.equal(s.bitisAt,505);assert.equal(s.skor.a+s.skor.b,6);assert.equal(s.skor.b,2);
  assert.equal(game.reduce(s,{type:'koy',uid:'a',i:0},ctx(p)),s);
});

test('durum JSON ile gidip gelir',()=>{
  const s=game.init(ctx(oy(['a'],['b']),0,{}));
  assert.deepEqual(JSON.parse(JSON.stringify(s)),s);
});
