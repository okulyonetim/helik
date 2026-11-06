/* Firebase Realtime Database sarmalayıcısı.
 * db-memory.js ile aynı istemci arayüzünü verir: uid, now, get, set, update, push, remove, on, onChildAdded, onDisconnect.
 * SDK yalnızca ayar varsa ve online oyun istendiğinde yüklenir; yoksa uygulama internetsiz de açılır. */

const SDK='https://www.gstatic.com/firebasejs/10.14.1';

export const ayarVar=cfg=>!!(cfg&&cfg.apiKey&&cfg.databaseURL&&cfg.projectId&&!String(cfg.apiKey).startsWith('BURAYA'));

export async function baglan(cfg){
  const [{initializeApp},{getAuth,signInAnonymously,onAuthStateChanged},db]=await Promise.all([
    import(`${SDK}/firebase-app.js`),
    import(`${SDK}/firebase-auth.js`),
    import(`${SDK}/firebase-database.js`)
  ]);
  const {getDatabase,ref,get,set,update,push,remove,onValue,onChildAdded,onDisconnect,runTransaction}=db;
  const app=initializeApp(cfg);
  const auth=getAuth(app);
  const user=await new Promise((res,rej)=>{
    const off=onAuthStateChanged(auth,u=>{if(u){off();res(u)}});
    signInAnonymously(auth).catch(rej);
  });
  const database=getDatabase(app);
  let offset=0;
  onValue(ref(database,'.info/serverTimeOffset'),s=>{offset=s.val()||0});
  const R=p=>ref(database,p);

  return{
    uid:user.uid,
    now:()=>Date.now()+offset,
    async get(path){const s=await get(R(path));return s.exists()?s.val():undefined},
    async set(path,val){await set(R(path),val===undefined?null:val)},
    async update(path,obj){await update(R(path),obj)},
    async push(path,val){const r=await push(R(path),val);return r.key},
    async remove(path){await remove(R(path))},
    on(path,cb){return onValue(R(path),s=>cb(s.exists()?s.val():undefined))},
    onChildAdded(path,cb){return onChildAdded(R(path),s=>cb(s.key,s.val()))},
    onDisconnect(path,val){const d=onDisconnect(R(path));return val==null?d.remove():d.set(val)},
    /* Yalnızca değer beklenen gibiyse yaz (host devri için) */
    async compareSet(path,beklenen,yeni){
      const r=await runTransaction(R(path),cur=>cur===beklenen?yeni:undefined);
      return r.committed;
    }
  };
}
