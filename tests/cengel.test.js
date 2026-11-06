import test from 'node:test';
import assert from 'node:assert/strict';
import game from '../js/games/cengel.js';
import {yukle,bulma,bulmaSayisi,dogrula,kelimeler,ipuclari,harfSayisi,SEVIYELER,cozumDizisi} from '../js/games/cengel.mantik.js';
import {BANKA} from '../scripts/cengel-sozcukler.mjs';
import {rng} from '../js/core/util.js';

await yukle();
const oy=(...u)=>u.map(uid=>({uid,name:uid,avatar:'🦊',age:'yetiskin',online:true}));
const ctx=(players,opts={},now=1000)=>({players,now,rand:rng(7),opts,hostUid:players[0]?.uid});

test('bank: tekrar yok, harfler geçerli, ipucu kısa',()=>{
  const gor=new Set(),ALF=new Set('ABCÇDEFGĞHIİJKLMNOÖPRSŞTUÜVYZ');
  for(const {w,c,z} of BANKA){
    assert.ok(!gor.has(w),'tekrar: '+w);gor.add(w);
    assert.ok([...w].every(h=>ALF.has(h)),'harf: '+w);
    assert.ok(c.length>=3&&c.length<=34,'ipucu: '+w);
    assert.ok([1,2,3].includes(z));
  }
});

test('bütün bulmacalar geçerli: ızgara, ipuçları ve kelimeler birbirini tutar',()=>{
  for(const z of SEVIYELER){
    assert.ok(bulmaSayisi(z)>=10,z+' az bulmaca');
    for(let n=0;n<bulmaSayisi(z);n++){
      const b=bulma(z,n),hata=dogrula(b);
      assert.deepEqual(hata,[],`${z}#${n}: ${hata.join('; ')}`);
      assert.ok(b.k.length>=6,`${z}#${n} az kelime`);
      // her cevap söz bankasında olmalı
      for(const x of ipuclari(b)){
        const kelime=x.hucreler.map(h=>cozumDizisi(b)[h]).join('');
        const e=BANKA.find(y=>y.w===kelime);
        assert.ok(e,`${z}#${n}: bankada yok ${kelime}`);
        assert.equal(e.c,x.metin,`${z}#${n}: ipucu uyuşmuyor ${kelime}`);
      }
    }
  }
});

function oyun(z='kolay'){
  const p=oy('a','b');
  const s=game.init(ctx(p,{zorluk:z}));
  return {s,p};
}
const harfHucreleri=s=>[...s.sol].map((c,i)=>[c,i]).filter(([c])=>c!=='#'&&c!=='.').map(([,i])=>i);

test('init: JSON uyumlu, doğru boyut',()=>{
  const {s}=oyun('orta');
  assert.equal(s.sol.length,s.r*s.c);assert.deepEqual(JSON.parse(JSON.stringify(s)),s);
  assert.equal(s.z,'orta');assert.equal(s.faz,'oyun');assert.equal(s.skor.a,0);
});

test('yaz: doğru harf +2 kilitlenir, yanlış −1 ve değişmez, geçersizler yok sayılır',()=>{
  let {s}=oyun();
  const [i0]=harfHucreleri(s);
  const yanlis=s.sol[i0]==='Z'?'Y':'Z';
  let t=game.reduce(s,{type:'yaz',uid:'a',i:i0,ch:yanlis},ctx([]));
  assert.equal(t.dolu[i0],undefined);assert.equal(t.skor.a,0);assert.equal(t.son.ok,false);assert.equal(t.son.ch,yanlis);
  s=game.reduce(s,{type:'yaz',uid:'a',i:i0,ch:s.sol[i0]},ctx([]));
  assert.equal(s.dolu[i0],'a');assert.ok(s.skor.a>=2);
  const once=s;
  for(const a of [{type:'yaz',uid:'b',i:i0,ch:'A'},{type:'yaz',uid:'x',i:harfHucreleri(s)[1],ch:'A'},{type:'yaz',uid:'a',i:-1,ch:'A'},{type:'yaz',uid:'a',i:99999,ch:'A'},{type:'yaz',uid:'a',i:s.sol.indexOf('#'),ch:'A'},{type:'yaz',uid:'a',i:harfHucreleri(s)[1],ch:'AB'},{type:'yaz',uid:'a',i:harfHucreleri(s)[1],ch:5},{type:'oyna',uid:'a'}])
    assert.equal(game.reduce(s,a,ctx([])),once);
  // küçük harf de kabul (Türkçe büyütme)
  const j=harfHucreleri(s).find(i=>s.sol[i]==='İ'||s.sol[i]==='I');
  if(j!==undefined){const k=game.reduce(s,{type:'yaz',uid:'b',i:j,ch:s.sol[j].toLocaleLowerCase('tr')},ctx([]));assert.equal(k.dolu[j],'b')}
});

test('yanlışta puan 0 altına inmez',()=>{
  let {s}=oyun();const i=harfHucreleri(s)[0],y=s.sol[i]==='Z'?'Y':'Z';
  for(let k=0;k<3;k++)s=game.reduce(s,{type:'yaz',uid:'a',i,ch:y},ctx([]));
  assert.equal(s.skor.a,0);assert.equal(s.son.n,3);
});

test('kelime bonusu ve bitiş: hepsini doğru doldurunca oyun biter',()=>{
  let {s}=oyun();
  const hepsi=harfHucreleri(s);
  for(const i of hepsi)s=game.reduce(s,{type:'yaz',uid:i%2?'a':'b',i,ch:s.sol[i]},ctx([],{},5000));
  assert.equal(s.faz,'bitti');assert.equal(s.bitisAt,5000);
  const toplam=s.skor.a+s.skor.b;
  const w=kelimeler(s.sol,s.c);
  const beklenen=hepsi.length*2+w.reduce((a,x)=>a+x.hucreler.length,0);
  assert.equal(toplam,beklenen,'her kelime tamamlanınca uzunluğu kadar bonus');
  assert.equal(harfSayisi(s.sol),hepsi.length);
  const sonra=game.reduce(s,{type:'yaz',uid:'a',i:hepsi[0],ch:'A'},ctx([]));assert.equal(sonra,s);
});

test('ipucu: kutuyu açar, puan vermez, sayacı artırır; son kutu ipucuyla da bitirir',()=>{
  let {s}=oyun();const h=harfHucreleri(s);
  s=game.reduce(s,{type:'ipucu',uid:'a',i:h[0]},ctx([]));
  assert.equal(s.dolu[h[0]],'');assert.equal(s.skor.a,0);assert.equal(s.ipucu,1);
  assert.equal(game.reduce(s,{type:'ipucu',uid:'a',i:h[0]},ctx([])),s);
  for(const i of h.slice(1))s=game.reduce(s,{type:'ipucu',uid:'b',i},ctx([],{},9000));
  assert.equal(s.faz,'bitti');assert.equal(s.skor.b,0);
});

test('çözüm bütünlüğü: oyun içinde kelimeler ızgarayla aynı',()=>{
  const {s}=oyun('zor');const b=bulma(s.z,s.no);
  assert.equal(kelimeler(s.sol,s.c).length,b.k.length);
});
