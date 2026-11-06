import test from 'node:test';
import assert from 'node:assert/strict';
import game from '../js/games/boyama.js';
import {SAYFALAR,PALET,bolgeIdleri,sayfaSvg} from '../js/games/veri/boyama-sayfalari.js';
import {rng} from '../js/core/util.js';

const oy=(...u)=>u.map(([uid])=>({uid,name:uid,avatar:'🦊',age:'yetiskin',online:true}));
const ctx=(players,opts={})=>({players,now:1000,rand:rng(4),opts,hostUid:players[0]?.uid});

test('sayfalar: her sayfada benzersiz bölge kimlikleri, geçerli SVG',()=>{
  for(const [id,s] of Object.entries(SAYFALAR)){
    const ids=s.bolgeler.map(b=>b[0]);
    assert.equal(new Set(ids).size,ids.length,id+' tekrar eden kimlik');
    assert.ok(bolgeIdleri(id).length>=10,id);
    const svg=sayfaSvg(id,{[bolgeIdleri(id)[0]]:2});
    assert.ok(svg.startsWith('<svg')&&svg.endsWith('</svg>'));
    assert.ok(svg.includes(PALET[2]));
    assert.equal((svg.match(/data-r=/g)||[]).length,bolgeIdleri(id).length);
  }
});

test('boyama: renk atama, silgi, temizle, sayfa değiştirme',()=>{
  const p=oy(['a'],['b']);let s=game.init(ctx(p,{sayfa:'ev'}));
  assert.equal(s.sayfa,'ev');
  const r=bolgeIdleri('ev')[1];
  s=game.reduce(s,{type:'boya',uid:'a',r,c:3});
  assert.equal(s.dolgu[r],3);
  const ayni=game.reduce(s,{type:'boya',uid:'b',r,c:3});assert.equal(ayni,s,'aynı renk değişiklik yapmaz');
  s=game.reduce(s,{type:'boya',uid:'b',r,c:5});assert.equal(s.dolgu[r],5);
  s=game.reduce(s,{type:'boya',uid:'a',r,c:-1});assert.equal(s.dolgu[r],undefined);
  for(const a of [{type:'boya',uid:'a',r:'yok',c:1},{type:'boya',uid:'a',r,c:99},{type:'boya',uid:'a',r,c:'1'},{type:'boya',uid:'x',r,c:1},{type:'boya',uid:'a',r:'_cam1',c:1}])
    assert.equal(game.reduce(s,a),s);
  s=game.reduce(s,{type:'boya',uid:'a',r,c:1});
  s=game.reduce(s,{type:'sayfa',uid:'b',s:'roket'});
  assert.equal(s.sayfa,'roket');assert.deepEqual(s.dolgu,{});
  assert.equal(game.reduce(s,{type:'sayfa',uid:'b',s:'yokki'}),s);
  s=game.reduce(s,{type:'boya',uid:'a',r:bolgeIdleri('roket')[0],c:0});
  s=game.reduce(s,{type:'temizle',uid:'a'});assert.deepEqual(s.dolgu,{});
});

test('init: rastgele sayfa ve JSON uyumu',()=>{
  const s=game.init(ctx(oy(['a']),{sayfa:'rastgele'}));
  assert.ok(SAYFALAR[s.sayfa]);
  assert.deepEqual(JSON.parse(JSON.stringify(s)),s);
});
