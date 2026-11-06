import test from 'node:test';
import assert from 'node:assert/strict';
import {createMemoryHub} from '../js/core/db-memory.js';
import {Room,OdaHatasi} from '../js/core/room.js';

/* Deneme oyunu: sayaç + zamanlı geçiş */
const sayac={
  id:'sayac',name:'Sayaç',players:{min:2,max:3},
  init:ctx=>({n:0,by:{},phase:'play',olusturan:ctx.players.map(p=>p.uid),t0:ctx.now}),
  reduce(s,a){
    if(a.type==='arttir')return{...s,n:s.n+(a.by||1),by:{...s.by,[a.uid]:(s.by[a.uid]||0)+1}};
    return s;
  },
  tick(s,ctx){if(s.phase==='play'&&ctx.now-s.t0>=5000)return{...s,phase:'bitti'};return null}
};
const GAMES={sayac};
const prof=(n,age='yetiskin')=>({name:n,avatar:'🦊',age});
const bekle=()=>new Promise(r=>setTimeout(r,5));
const bekleHer=async(n=3)=>{for(let i=0;i<n;i++)await bekle()};
let zaman=1_000_000;
const yeniHub=()=>{zaman=1_000_000;return createMemoryHub({now:()=>zaman})};
const cfg={autoTick:false,hostTimeout:30};

async function iki(){
  const hub=yeniHub();
  const a=hub.connect('ali'),b=hub.connect('bora');
  const oda=await Room.create(a,sayac,prof('Ali'),{},cfg);
  zaman+=10;
  const oda2=await Room.join(b,GAMES,oda.code,prof('Bora'),cfg);
  await bekleHer();
  return{hub,a,b,oda,oda2};
}

test('oda kurulur, katılan görünür, kod büyük küçük harf duyarsız',async()=>{
  const hub=yeniHub();
  const a=hub.connect('ali'),b=hub.connect('bora');
  const oda=await Room.create(a,sayac,prof('Ali'),{},cfg);
  assert.match(oda.code,/^[A-Z2-9]{5}$/);
  const oda2=await Room.join(b,GAMES,' '+oda.code.toLowerCase()+' ',prof('Bora'),cfg);
  await bekleHer();
  assert.deepEqual(oda.players.map(p=>p.name),['Ali','Bora']);
  assert.equal(oda.isHost(),true);assert.equal(oda2.isHost(),false);
  assert.equal(oda2.meta.game,'sayac');
});

test('olmayan oda ve dolu oda hata verir',async()=>{
  const {hub,oda}=await iki();
  await assert.rejects(()=>Room.join(hub.connect('x'),GAMES,'ZZZZZ',prof('X'),cfg),OdaHatasi);
  await Room.join(hub.connect('c3'),GAMES,oda.code,prof('C'),cfg);
  await assert.rejects(()=>Room.join(hub.connect('c4'),GAMES,oda.code,prof('D'),cfg),/dolu/);
});

test('eylem hosta gider, durum herkese yayılır',async()=>{
  const {oda,oda2}=await iki();
  assert.equal(await oda.startGame(),true);
  await bekleHer();
  assert.equal(oda2.state.n,0);
  oda2.dispatch('arttir',{by:2});
  await bekleHer(4);
  assert.equal(oda.state.n,2);
  assert.equal(oda2.state.n,2,'katılan oyuncu da durumu görür');
  assert.deepEqual(oda2.state.by,{bora:1},'eylemi gönderenin kimliği host tarafından atanır');
  oda.dispatch('arttir');
  await bekleHer(4);
  assert.equal(oda2.state.n,3);
});

test('oyuncu sayısı yetersizse oyun başlamaz; yalnız host başlatır',async()=>{
  const hub=yeniHub();
  const oda=await Room.create(hub.connect('ali'),sayac,prof('Ali'),{},cfg);
  assert.equal(await oda.startGame(),false);
  const {oda:o2,oda2}=await iki();
  assert.equal(await oda2.startGame(),false,'host olmayan başlatamaz');
  assert.equal(o2.state,null);
});

test('zamanlı geçiş (tick) host zamanıyla çalışır',async()=>{
  const {oda,oda2}=await iki();
  await oda.startGame();await bekleHer();
  oda.tick();assert.equal(oda.state.phase,'play');
  zaman+=6000;oda.tick();await bekleHer();
  assert.equal(oda2.state.phase,'bitti');
});

test('durum JSON olarak saklanır: boş dizi ve null kaybolmaz',async()=>{
  const hub=yeniHub();
  const g={...sayac,players:{min:1,max:2},init:()=>({liste:[],bos:{},yok:null,x:0})};
  const a=hub.connect('ali'),b=hub.connect('bora');
  const oda=await Room.create(a,g,prof('Ali'),{},cfg);
  const o2=await Room.join(b,{sayac:g},oda.code,prof('B'),cfg);
  await oda.startGame();await bekleHer();
  assert.deepEqual(o2.state,{liste:[],bos:{},yok:null,x:0});
});

test('host düşünce sıradaki oyuncu devralır ve oyun kaldığı yerden sürer',async()=>{
  const {a,oda,oda2,hub}=await iki();
  await oda.startGame();await bekleHer();
  oda2.dispatch('arttir');await bekleHer(4);
  assert.equal(oda2.state.n,1);
  a.disconnect();            /* Ali'nin bağlantısı koptu */
  await bekleHer(2);
  await new Promise(r=>setTimeout(r,80));
  await bekleHer(4);
  assert.equal(oda2.isHost(),true,'Bora host oldu');
  assert.equal(oda2.state.n,1,'durum korundu');
  oda2.dispatch('arttir',{by:5});await bekleHer(4);
  assert.equal(oda2.state.n,6,'yeni host eylemleri işler');
});

test('host odadan çıkınca host devri olur; son kişi çıkınca oda silinir',async()=>{
  const {oda,oda2,hub}=await iki();
  await oda.leave();await bekleHer(4);
  assert.equal(oda2.isHost(),true);
  assert.deepEqual(oda2.players.map(p=>p.name),['Bora']);
  let kapandi=false;oda2.onClose(()=>{kapandi=true});
  await oda2.leave();
  assert.equal(hub.dump(),null,'oda tamamen silindi');
});

test('oyun başladıktan sonra gelen izleyici olur ve oyuncu sayılmaz',async()=>{
  const {hub,oda}=await iki();
  await oda.startGame();await bekleHer();
  const g=hub.connect('gec');
  const o3=await Room.join(g,GAMES,oda.code,prof('Geç'),cfg);await bekleHer();
  assert.equal(o3.ben().spectator,true);
  assert.equal(oda.aktifler().length,2);
  assert.equal(o3.state.n,0,'izleyici durumu görür');
});

test('yeniden bağlanan oyuncu aynı kaydı kullanır',async()=>{
  const {hub,b,oda,oda2}=await iki();
  const ilk=oda.players.find(p=>p.uid==='bora').joinedAt;
  b.disconnect();await bekleHer(3);
  assert.equal(oda.players.find(p=>p.uid==='bora').online,false);
  const b2=hub.connect('bora');
  const o3=await Room.join(b2,GAMES,oda.code,prof('Bora'),cfg);await bekleHer(3);
  const p=oda.players.find(p=>p.uid==='bora');
  assert.equal(p.online,true);assert.equal(p.joinedAt,ilk);
});

test('lobiye dönünce durum silinir ve başka oyun başlatılabilir',async()=>{
  const {oda,oda2}=await iki();
  await oda.startGame();await bekleHer();
  oda2.dispatch('arttir');await bekleHer(4);
  await oda.toLobby();await bekleHer(3);
  assert.equal(oda2.state,null);
  assert.equal(await oda.startGame(),true);await bekleHer(3);
  assert.equal(oda2.state.n,0,'yeni oyun sıfırdan başlar');
  oda2.dispatch('arttir');await bekleHer(4);
  assert.equal(oda2.state.n,1,'ikinci oyunda eylemler yine işler (rev sıfırlanmış olsa da)');
});

test('oyun lobiye dönmeden yeniden başlatılınca konuklar yeni durumu görür (rev geriye gitmez)',async()=>{
  const {oda,oda2}=await iki();
  await oda.startGame();await bekleHer();
  for(let i=0;i<5;i++){oda2.dispatch('arttir');await bekleHer(3)}
  assert.equal(oda2.state.n,5);
  assert.equal(await oda.startGame(),true);await bekleHer(3);
  assert.equal(oda2.state.n,0,'konuk yeni oyunun durumunu aldı');
  oda2.dispatch('arttir');await bekleHer(4);
  assert.equal(oda2.state.n,1);assert.equal(oda.state.n,1);
});

test('odadan ayrılan sonradan bağlantısı kopunca hayalet oyuncu kaydı bırakmaz',async()=>{
  const hub=yeniHub();
  const a=hub.connect('ali'),b=hub.connect('bora');
  const oda=await Room.create(a,sayac,prof('Ali'),{},cfg);
  const oda2=await Room.join(b,GAMES,oda.code,prof('Bora'),cfg);
  await bekleHer();
  await oda2.leave();await bekleHer();
  b.disconnect();await bekleHer();
  assert.equal(await a.get(`rooms/${oda.code}/players/bora`),undefined,'ayrılan oyuncunun kaydı geri gelmedi');
  assert.equal(oda.players.length,1);
});

test('adı olmayan artık kayıt oyuncu listesine girmez',async()=>{
  const hub=yeniHub();
  const a=hub.connect('ali'),x=hub.connect('hayalet');
  const oda=await Room.create(a,sayac,prof('Ali'),{},cfg);
  await x.set(`rooms/${oda.code}/players/hayalet/online`,false);await bekleHer();
  assert.deepEqual(oda.players.map(p=>p.uid),['ali']);
});

test('lobi ayarlarını yalnız host değiştirir ve herkes görür',async()=>{
  const {oda,oda2}=await iki();
  await oda.setOpts({sure:30});await oda2.setOpts({sure:99});await bekleHer(3);
  assert.equal(oda2.meta.opts.sure,30);
});

test('kurucu odayı hemen başlatabilir (tek kişilik oyun)',async()=>{
  const hub=yeniHub();
  const solo={...sayac,id:'solo',players:{min:1,max:1}};
  const oda=await Room.create(hub.connect('ben'),solo,prof('Ben'),{},cfg);
  assert.equal(await oda.startGame(),true);
  assert.equal(oda.state.n,0);
  oda.dispatch('arttir');
  assert.equal(oda.state.n,1);
});
