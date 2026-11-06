/* Bellek içi veritabanı: Firebase Realtime Database'in kullandığımız kısmının birebir davranışını taklit eder.
 * - Testlerde birden çok istemciyi aynı veri üzerinde çalıştırmak için,
 * - Firebase ayarı yokken tek başına oyun (solo) için kullanılır.
 * hub.connect(uid) → istemci arayüzü (Firebase sarmalayıcısıyla aynı yüzey). */

const parts=p=>String(p).split('/').filter(Boolean);
const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));

export function createMemoryHub({now=()=>Date.now()}={}){
  let root=null; /* null = boş */
  let counter=0;
  const valueL=new Set();  /* {path,cb,last} */
  const childL=new Set();  /* {path,cb,seen:Set} */
  const clients=new Set();

  const read=path=>{let n=root;for(const k of parts(path)){if(n==null||typeof n!=='object')return undefined;n=n[k]}return n===null?undefined:n};
  function write(path,val){
    const ks=parts(path);
    if(!ks.length){root=val===undefined||val===null?null:clone(val);return}
    if(root==null||typeof root!=='object')root={};
    let n=root;
    for(let i=0;i<ks.length-1;i++){
      if(n[ks[i]]==null||typeof n[ks[i]]!=='object')n[ks[i]]={};
      n=n[ks[i]];
    }
    const last=ks[ks.length-1];
    if(val===undefined||val===null)delete n[last];else n[last]=clone(val);
    prune(ks);
  }
  /* Firebase boş düğümleri siler */
  function prune(ks){
    for(let d=ks.length-1;d>=0;d--){
      let n=root;for(let i=0;i<d;i++)n=n?.[ks[i]];
      const c=n?.[ks[d]];
      if(c&&typeof c==='object'&&!Object.keys(c).length)delete n[ks[d]];
    }
    if(root&&typeof root==='object'&&!Object.keys(root).length)root=null;
  }
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

  function fire(){
    for(const l of [...valueL]){
      const v=read(l.path);
      if(!l.init||!same(v,l.last)){l.init=true;l.last=clone(v);queueMicrotask(()=>{if(valueL.has(l))l.cb(clone(v))})}
    }
    for(const l of [...childL]){
      const node=read(l.path);
      if(node&&typeof node==='object'){
        for(const k of Object.keys(node).sort()){
          if(!l.seen.has(k)){l.seen.add(k);const v=clone(node[k]);queueMicrotask(()=>{if(childL.has(l))l.cb(k,v)})}
        }
        for(const k of [...l.seen])if(!(k in node))l.seen.delete(k);
      }else l.seen.clear();
    }
  }

  function connect(uid){
    const dc=new Set(); /* bağlantı kopunca çalışacak işler */
    const unsubs=new Set();
    const client={
      uid,
      now,
      async get(path){return clone(read(path))},
      async set(path,val){write(path,val);fire()},
      async update(path,obj){
        for(const [k,v] of Object.entries(obj))write(`${path}/${k}`,v);
        fire();
      },
      async push(path,val){
        const key=`${String(now()).padStart(13,'0')}${String(++counter).padStart(6,'0')}`;
        write(`${path}/${key}`,val);fire();return key;
      },
      async remove(path){write(path,null);fire()},
      on(path,cb){const l={path,cb,last:undefined,init:false};valueL.add(l);fire();const off=()=>{valueL.delete(l);unsubs.delete(off)};unsubs.add(off);return off},
      onChildAdded(path,cb){const l={path,cb,seen:new Set()};childL.add(l);fire();const off=()=>{childL.delete(l);unsubs.delete(off)};unsubs.add(off);return off},
      /* Yalnızca değer beklenen gibiyse yaz (host devri) */
      async compareSet(path,beklenen,yeni){
        if(!same(read(path),beklenen))return false;
        write(path,yeni);fire();return true;
      },
      /* Bağlantı kopunca path'e val yazılsın (null = silinsin). Dönen fonksiyon kaydı iptal eder. */
      onDisconnect(path,val){const j={path,val};dc.add(j);return()=>{dc.delete(j)}},
      /* Test için: bağlantı kopması */
      disconnect(){
        for(const l of [...unsubs])l();
        for(const j of dc)write(j.path,j.val);
        dc.clear();fire();clients.delete(client);
      }
    };
    clients.add(client);
    return client;
  }
  return{connect,dump:()=>clone(root),clients};
}
