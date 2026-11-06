import test from 'node:test';
import assert from 'node:assert/strict';
import game,{siradaki,kelimeHavuzu,kelimeGecerli} from '../js/games/adamasmaca.js';
import {rng,up} from '../js/core/util.js';

const oy=(...u)=>u.map(([uid,online=true,age='yetiskin'])=>({uid,name:uid,avatar:'🦊',age,online}));
const ctx=(players,now=1000,opts={})=>({players,now,rand:rng(3),opts,hostUid:players[0]?.uid});
const kur=(players,opts={},now=1000)=>{const c=ctx(players,now,opts);return{c,s:game.init(c)}};
const harfBas=(s,h)=>game.reduce(s,{type:'tahmin',uid:s.sira,h},ctx(oy([s.sira]),1000));

test('havuz: kategori ve uzunluk filtresi, hepsi büyük harf Türk alfabesi',()=>{
  for(const k of ['hayvan','yiyecek','sehir','esya','meslek','ulke','karisik']){
    for(const z of ['kolay','orta','zor']){
      const h=kelimeHavuzu(k,z);
      assert.ok(h.length>=5,k+z);
      assert.ok(h.every(x=>x.w===up(x.w)&&x.w.length>=3));
    }
  }
  assert.ok(kelimeHavuzu('hayvan','kolay').every(x=>x.w.length<=5));
  assert.equal(kelimeGecerli('  ığdır '),'IĞDIR');
  assert.equal(kelimeGecerli('a'),null);assert.equal(kelimeGecerli('ab1'),null);assert.equal(kelimeGecerli('x'.repeat(3)),null);
});

test('init: otomatik kelime, ilk oyuncu sırada, çocuk varsa 10 hak ve balon',()=>{
  const {s}=kur(oy(['a'],['b']),{kategori:'hayvan',tur:3});
  assert.equal(s.faz,'oyun');assert.ok(s.kelime.length>=3);assert.equal(s.kat,'hayvan');assert.equal(s.sira,'a');assert.equal(s.hak,8);assert.equal(s.cizim,'adam');assert.equal(s.toplam,3);
  const k=kur(oy(['a',true,'cocuk'],['b'])).s;
  assert.equal(k.hak,10);assert.equal(k.cizim,'balon');
  assert.equal(kur(oy(['a',true,'cocuk']),{cizim:'adam'}).s.cizim,'adam');
});

test('doğru harf sırayı korur ve puan verir; yanlış harf hak götürür ve sırayı geçirir',()=>{
  const p=oy(['a'],['b']);
  let {s}=kur(p,{kategori:'hayvan'});
  s={...s,kelime:'KEDİ',tahmin:[],sira:'a'};
  s=game.reduce(s,{type:'tahmin',uid:'a',h:'k'},ctx(p));
  assert.deepEqual(s.tahmin,['K']);assert.equal(s.sira,'a');assert.equal(s.skor.a,1);assert.equal(s.yanlis,0);
  s=game.reduce(s,{type:'tahmin',uid:'a',h:'Z'},ctx(p));
  assert.equal(s.yanlis,1);assert.equal(s.sira,'b');
  assert.equal(game.reduce(s,{type:'tahmin',uid:'a',h:'E'},ctx(p)),s,'sırası olmayan oynayamaz');
  assert.equal(game.reduce(s,{type:'tahmin',uid:'b',h:'K'},ctx(p)),s,'aynı harf tekrar seçilemez');
  assert.equal(game.reduce(s,{type:'tahmin',uid:'b',h:'1'},ctx(p)),s);
});

test('türkçe harf: i ve ı ayrı harflerdir',()=>{
  const p=oy(['a']);let {s}=kur(p);
  s={...s,kelime:'KEDİ',tahmin:[]};
  const a=game.reduce(s,{type:'tahmin',uid:'a',h:'i'},ctx(p));   /* İ aranır */
  assert.deepEqual(a.tahmin,['İ']);assert.equal(a.yanlis,0);
  const b=game.reduce(s,{type:'tahmin',uid:'a',h:'ı'},ctx(p));   /* I yok */
  assert.deepEqual(b.tahmin,['I']);assert.equal(b.yanlis,1);
});

test('kelime tamamlanınca bonus; son tur oyunu bitirir, arada tick sonraki kelimeyi getirir',()=>{
  const p=oy(['a']);let {s}=kur(p,{tur:3});
  s={...s,kelime:'AT'.repeat(1)+'A',tahmin:[]};              /* ATA: A,T */
  s=game.reduce(s,{type:'tahmin',uid:'a',h:'A'},ctx(p,2000));
  assert.equal(s.skor.a,2);assert.equal(s.faz,'oyun');
  s=game.reduce(s,{type:'tahmin',uid:'a',h:'T'},ctx(p,2000));
  assert.equal(s.faz,'arada');assert.equal(s.sonuc,'kazandi');assert.equal(s.skor.a,2+1+3);
  assert.equal(game.tick(s,ctx(p,2100)),null);
  const n=game.tick(s,ctx(p,s.devamAt));
  assert.equal(n.tur,2);assert.equal(n.faz,'oyun');assert.deepEqual(n.tahmin,[]);assert.equal(n.yanlis,0);assert.notEqual(n.kelime,s.kelime);
  const son={...n,tur:3,kelime:'AB',tahmin:['A']};
  const bitti=game.reduce(son,{type:'tahmin',uid:'a',h:'B'},ctx(p,3000));
  assert.equal(bitti.faz,'bitti');
});

test('haklar bitince tur kaybedilir; kelimeyi bil: doğru bonus, yanlış 2 hak',()=>{
  const p=oy(['a']);let {s}=kur(p,{tur:1});
  s={...s,kelime:'ARI',tahmin:[],yanlis:s.hak-1};
  const k=game.reduce(s,{type:'tahmin',uid:'a',h:'Z'},ctx(p));
  assert.equal(k.faz,'bitti');assert.equal(k.sonuc,'kaybetti');
  let t={...s,yanlis:0};
  const yanl=game.reduce(t,{type:'bil',uid:'a',w:'kaz'},ctx(p));
  assert.equal(yanl.yanlis,2);assert.equal(yanl.faz,'oyun');
  const dogru=game.reduce(t,{type:'bil',uid:'a',w:'arı'},ctx(p));
  assert.equal(dogru.sonuc,'kazandi');assert.equal(dogru.skor.a,3+3);
  const son=game.reduce({...t,yanlis:t.hak-1},{type:'bil',uid:'a',w:'xxx'},ctx(p));
  assert.equal(son.sonuc,'kaybetti');
});

test('oyuncu modu: sırayla biri yazar, yazan tahmin etmez, kelime doğrulanır',()=>{
  const p=oy(['a'],['b'],['c']);
  let {s}=kur(p,{mod:'oyuncu',tur:3});
  assert.equal(s.faz,'kelime');assert.equal(s.koyan,'a');assert.equal(s.sira,'b');
  assert.equal(game.reduce(s,{type:'kelime',uid:'b',w:'balık'},ctx(p)),s,'yazan dışı gönderemez');
  assert.equal(game.reduce(s,{type:'kelime',uid:'a',w:'x1'},ctx(p)),s,'geçersiz kelime');
  s=game.reduce(s,{type:'kelime',uid:'a',w:' balık ',ipucu:'denizde yaşar'},ctx(p));
  assert.equal(s.faz,'oyun');assert.equal(s.kelime,'BALIK');assert.equal(s.ipucu,'denizde yaşar');
  assert.equal(game.reduce(s,{type:'tahmin',uid:'a',h:'B'},ctx(p)),s,'yazan tahmin edemez');
  assert.equal(siradaki(s,ctx(p),'c'),'b');   /* a atlanır */
  /* sonraki turda yazan değişir */
  const bitir={...s,tahmin:[...'BALI'],sira:'b'};
  const k=game.reduce(bitir,{type:'tahmin',uid:'b',h:'K'},ctx(p,5000));
  const n=game.tick(k,ctx(p,k.devamAt));
  assert.equal(n.faz,'kelime');assert.equal(n.koyan,'b');
});

test('oyuncu modunda yazan çevrimdışıysa otomatik kelime seçilir; tek oyuncuda mod yok sayılır',()=>{
  const p=oy(['a'],['b']);
  let {s}=kur(p,{mod:'oyuncu'});
  const t=game.tick(s,ctx(oy(['a',false],['b'])));
  assert.equal(t.faz,'oyun');assert.ok(t.kelime);assert.equal(t.sira,'b');
  assert.equal(game.tick(s,ctx(p)),null);
  assert.equal(kur(oy(['a']),{mod:'oyuncu'}).s.faz,'oyun');
});

test('çevrimdışı oyuncunun sırası atlanır',()=>{
  const p=oy(['a'],['b'],['c']);const {s}=kur(p);
  const t=game.tick({...s,sira:'a'},ctx(oy(['a',false],['b'],['c'])));
  assert.equal(t.sira,'b');
  assert.equal(game.tick({...s,sira:'a'},ctx(oy(['a'],['b'],['c']))),null);
});

test('durum JSON ile gidip gelir',()=>{
  const {s}=kur(oy(['a'],['b']));
  assert.deepEqual(JSON.parse(JSON.stringify(s)),s);
});
