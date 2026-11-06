import test from 'node:test';
import assert from 'node:assert/strict';
import game,{soruSec,seviyeBul,puanHesapla} from '../js/games/bilgi.js';
import {SORULAR} from '../js/games/veri/sorular.js';
import {rng} from '../js/core/util.js';

const oy=(...u)=>u.map(([uid,online=true,age='yetiskin'])=>({uid,name:uid,avatar:'🦊',age,online}));
const ctx=(players,now=1000,opts={})=>({players,now,rand:rng(5),opts,hostUid:players[0]?.uid});
const kur=(players,opts={},now=1000)=>{const c=ctx(players,now,opts);return{c,s:game.init(c)}};

test('soru havuzu: her soruda 4 farklı şık, doğru cevap ilk sırada',()=>{
  assert.ok(SORULAR.length>=80);
  for(const q of SORULAR){
    assert.equal(q.length,7,q[2]);
    assert.equal(new Set(q.slice(3)).size,4,q[2]);
    assert.ok(['c','y','h'].includes(q[1]));
  }
});

test('seviye: otomatik yaşa göre; çocuklar için yetişkin sorusu çıkmaz',()=>{
  assert.equal(seviyeBul({},oy(['a',true,'cocuk'])),'cocuk');
  assert.equal(seviyeBul({},oy(['a'],['b',true,'cocuk'])),'karisik');
  assert.equal(seviyeBul({seviye:'yetiskin'},oy(['a',true,'cocuk'])),'yetiskin');
  const cocuk=new Set(SORULAR.filter(q=>q[1]==='y').map(q=>q[2]));
  const s=soruSec('cocuk',10,rng(1));
  assert.equal(s.length,10);
  assert.ok(s.every(q=>!cocuk.has(q.t)));
  const y=new Set(SORULAR.filter(q=>q[1]==='c').map(q=>q[2]));
  assert.ok(soruSec('yetiskin',10,rng(2)).every(q=>!y.has(q.t)));
  const kar=soruSec('karisik',15,rng(3));
  assert.equal(new Set(kar.map(q=>q.t)).size,15,'aynı soru tekrar etmez');
});

test('aile soruları araya karışır',()=>{
  const aile=[{t:'Dedem nerede doğdu?',o:['Sivas','Van','Rize','Edirne']},{t:'Kedimizin adı?',o:['Pamuk','Boncuk','Tekir','Minnoş']}];
  const s=soruSec('karisik',10,rng(9),aile);
  assert.equal(s.length,10);
  assert.ok(s.filter(q=>q.aile).length>=1);
  const hazir=kur(oy(['a']),{aile:true}).s;   /* yerel depo yok → aile sorusu eklenmez */
  assert.equal(hazir.toplam,10);
});

test('init: şıklar karışır, d doğru şıkkı gösterir; çocuk varsa süre uzar',()=>{
  const {s}=kur(oy(['a'],['b']),{adet:5});
  assert.equal(s.toplam,5);assert.equal(s.faz,'soru');
  for(const q of s.sorular){
    assert.equal(q.o.length,4);assert.ok(q.d>=0&&q.d<4);
    const orijinal=SORULAR.find(x=>x[2]===q.t);
    if(orijinal)assert.equal(q.o[q.d],orijinal[3]);
  }
  assert.equal(s.sureMs,15000);
  assert.equal(kur(oy(['a',true,'cocuk']),{}).s.sureMs,25000);
});

test('puan: doğru 100 + hız bonusu (en fazla 150); yanlış 0',()=>{
  const p=oy(['a'],['b']);
  let {s}=kur(p,{adet:5},1000);
  const q=s.sorular[0],yanlis=(q.d+1)%4;
  assert.equal(puanHesapla(s,s.basla),150);
  assert.equal(puanHesapla(s,s.bitis),100);
  s=game.reduce(s,{type:'sec',uid:'a',c:q.d},ctx(p,1000));            /* anında */
  s=game.reduce(s,{type:'sec',uid:'b',c:yanlis},ctx(p,2000));
  assert.equal(game.reduce(s,{type:'sec',uid:'a',c:yanlis},ctx(p,3000)),s,'cevap değiştirilemez');
  const a=game.tick(s,ctx(p,2100));
  assert.equal(a.faz,'cevap');assert.equal(a.skor.a,150);assert.equal(a.skor.b,0);assert.equal(a.dogru.a,1);assert.equal(a.puanlar.b,0);
});

test('geçersiz eylemler yok sayılır',()=>{
  const p=oy(['a']);const {s}=kur(p,{adet:5});
  for(const a of [{type:'sec',uid:'x',c:0},{type:'sec',uid:'a',c:4},{type:'sec',uid:'a',c:-1},{type:'sec',uid:'a',c:'1'},{type:'baska',uid:'a'}])
    assert.equal(game.reduce(s,a,ctx(p)),s);
});

test('süre dolunca ya da herkes cevaplayınca açıklanır; açıklama sonrası sonraki soru; son soruda biter',()=>{
  const p=oy(['a'],['b']);
  let {s}=kur(p,{adet:5},0);
  assert.equal(game.tick(s,ctx(p,5000)),null);
  let a=game.tick(s,ctx(p,s.bitis));
  assert.equal(a.faz,'cevap');assert.equal(a.skor.a,0,'kimse cevaplamadı');
  assert.equal(game.tick(a,ctx(p,a.acikBitis-1)),null);
  let n=game.tick(a,ctx(p,a.acikBitis));
  assert.equal(n.faz,'soru');assert.equal(n.i,1);assert.deepEqual(n.cevaplar,{});assert.ok(n.bitis>a.acikBitis);
  /* son soru */
  let son={...n,i:4};
  son=game.tick(son,ctx(p,son.bitis));
  const bitti=game.tick(son,ctx(p,son.acikBitis));
  assert.equal(bitti.faz,'bitti');
  assert.equal(game.tick(bitti,ctx(p,1e9)),null);
});

test('çevrimdışı oyuncuyu beklemez; herkes çevrimdışıysa erken bitmez',()=>{
  const p=oy(['a'],['b',false]);
  let {s}=kur(p,{adet:5},0);
  s=game.reduce(s,{type:'sec',uid:'a',c:0},ctx(p,100));
  assert.equal(game.tick(s,ctx(p,200)).faz,'cevap');
  const yok=oy(['a',false],['b',false]);
  const {s:t}=kur(p,{adet:5},0);
  assert.equal(game.tick(t,ctx(yok,200)),null);
});

test('durum JSON ile gidip gelir',()=>{
  const {s}=kur(oy(['a'],['b']));
  assert.deepEqual(JSON.parse(JSON.stringify(s)),s);
});
