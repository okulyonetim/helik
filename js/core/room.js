/* Oda: oyuncular, host ve oyun durumu.
 *
 * Model (sunucu kodu yok): odanın "host"u oyunun tek yetkilisidir.
 *   - Oyuncular eylem (action) gönderir → rooms/KOD/actions
 *   - Host eylemi oyunun saf reducer'ından geçirir, yeni durumu yayınlar → rooms/KOD/state
 *   - Herkes durumu dinleyip ekrana çizer.
 * Host düşerse (online=false) sıradaki oyuncu host olur; durum veritabanında durduğu için oyun kaldığı yerden sürer.
 *
 * Oyun sözleşmesi (js/games/*.js):
 *   { id, name, players:{min,max},
 *     init(ctx)→state, reduce(state,action,ctx)→state, tick?(state,ctx)→state|null }
 *   ctx = { players:[{uid,name,avatar,age,online}], now, rand, opts, hostUid }
 *   action = { type, uid, ...veri }
 * Durum JSON uyumlu olmalıdır; Realtime Database boş dizi/null'ı sildiği için string olarak saklanır. */

import {yeniKod,kodTemiz} from './util.js';

export const HOST_ZAMANASIMI=7000;
const yol=code=>`rooms/${code}`;

export class OdaHatasi extends Error{}

export class Room{
  constructor(db,code,game,{tickMs=400,hostTimeout=HOST_ZAMANASIMI,rand=Math.random,autoTick=true}={}){
    this.db=db;this.code=code;this.game=game;this.uid=db.uid;
    this.meta=null;this.players=[];this.state=null;this.rev=0;
    this.rand=rand;this.tickMs=tickMs;this.hostTimeout=hostTimeout;this.autoTick=autoTick;
    this.subs=new Set();this.closeCbs=new Set();
    this._offs=[];this._host=false;this._hostTimer=null;this._tickTimer=null;this._actOff=null;
    this.closed=false;this._ready=false;
  }

  /* ── Oluşturma / katılma ── */
  static async create(db,game,profile,opts={},cfg={}){
    let code,tries=0;
    do{
      code=yeniKod(cfg.rand||Math.random);
      if(++tries>20)throw new OdaHatasi('Oda kodu üretilemedi');
    }while(await db.get(`${yol(code)}/meta`));
    const meta={game:game.id,hostUid:db.uid,status:'lobby',opts,createdAt:db.now(),v:1};
    await db.set(`${yol(code)}/meta`,meta);
    const room=new Room(db,code,game,cfg);
    room.meta=meta;
    await room._join(profile,false);
    room._start();
    return room;
  }

  static async join(db,games,code,profile,cfg={}){
    code=kodTemiz(code);
    const meta=await db.get(`${yol(code)}/meta`);
    if(!meta)throw new OdaHatasi('Oda bulunamadı. Kodu kontrol et.');
    const game=games[meta.game];
    if(!game)throw new OdaHatasi('Bu oyun bu sürümde yok.');
    const players=await db.get(`${yol(code)}/players`)||{};
    const varMi=!!players[db.uid];
    const sayi=Object.keys(players).filter(k=>!players[k].spectator).length;
    if(!varMi&&sayi>=game.players.max&&meta.status==='lobby')throw new OdaHatasi('Oda dolu.');
    const room=new Room(db,code,game,cfg);
    room.meta=meta;
    await room._join(profile,!varMi&&meta.status!=='lobby');
    room._start();
    return room;
  }

  static async var(db,code){return!!(await db.get(`${yol(kodTemiz(code))}/meta`))}

  async _join(profile,spectator){
    const mevcut=await this.db.get(`${yol(this.code)}/players/${this.uid}`);
    const kayit={name:profile.name,avatar:profile.avatar,age:profile.age,joinedAt:mevcut?.joinedAt??this.db.now(),online:true};
    if(mevcut?.spectator||spectator)kayit.spectator=true;
    await this.db.set(`${yol(this.code)}/players/${this.uid}`,kayit);
    if(!this.players.some(p=>p.uid===this.uid))this.players=[...this.players,{uid:this.uid,...kayit}];
    this._dcIptal?.();
    this._dcIptal=this.db.onDisconnect(`${yol(this.code)}/players/${this.uid}/online`,false);
  }

  _start(){
    const p=yol(this.code);
    this._offs.push(this.db.on(`${p}/meta`,m=>this._onMeta(m)));
    this._offs.push(this.db.on(`${p}/players`,o=>this._onPlayers(o)));
    this._offs.push(this.db.on(`${p}/state`,s=>this._onState(s)));
  }

  /* ── Dinleyiciler ── */
  subscribe(cb){this.subs.add(cb);if(this._ready)cb(this.snapshot());return()=>this.subs.delete(cb)}
  onClose(cb){this.closeCbs.add(cb)}
  snapshot(){return{state:this.state,players:this.players,meta:this.meta,isHost:this.isHost(),room:this}}
  _emit(){this._ready=true;for(const cb of [...this.subs])cb(this.snapshot())}

  _onMeta(m){
    if(this.closed)return;
    if(!m){if(this.meta){this._kapandi()}return}
    this.meta=m;
    this._hostKontrol();
    this._emit();
  }
  _onPlayers(o){
    if(this.closed)return;
    /* adı olmayan kayıt (ayrıldıktan sonra kalan artık) oyuncu sayılmaz */
    this.players=Object.entries(o||{}).filter(([,p])=>p&&typeof p.name==='string').map(([uid,p])=>({uid,...p})).sort((a,b)=>(a.joinedAt-b.joinedAt)||(a.uid<b.uid?-1:1));
    this._hostKontrol();
    this._emit();
  }
  _onState(s){
    if(this.closed)return;
    if(!this._host){
      if(!s){this.state=null;this.rev=0}
      else if(!this.state||s.rev>=this.rev){this.state=JSON.parse(s.json);this.rev=s.rev}
    }
    this._emit();
  }
  _kapandi(){this.closed=true;this._dcIptal?.();this._dcIptal=null;this._temizle();for(const cb of [...this.closeCbs])cb()}

  /* ── Host ── */
  isHost(){return!!this.meta&&this.meta.hostUid===this.uid}
  ben(){return this.players.find(p=>p.uid===this.uid)}
  aktifler(){return this.players.filter(p=>!p.spectator)}

  _hostKontrol(){
    if(!this.meta)return;
    const hostMu=this.isHost();
    if(hostMu&&!this._host)this._hostOl();
    else if(!hostMu&&this._host)this._hostBirak();
    /* host düştü mü? */
    const h=this.players.find(p=>p.uid===this.meta.hostUid);
    const gitti=!h||h.online===false;
    if(gitti&&!hostMu){
      if(!this._hostTimer)this._hostTimer=setTimeout(()=>{this._hostTimer=null;this._devral()},this.hostTimeout);
    }else if(this._hostTimer){clearTimeout(this._hostTimer);this._hostTimer=null}
  }
  async _devral(){
    if(this.closed||!this.meta||this.isHost())return;
    const eski=this.meta.hostUid,h=this.players.find(p=>p.uid===eski);
    if(h&&h.online!==false)return;
    const aday=this.players.find(p=>p.uid!==eski&&p.online!==false&&!p.spectator)||this.players.find(p=>p.uid!==eski&&p.online!==false);
    if(aday&&aday.uid===this.uid)await this.db.compareSet(`${yol(this.code)}/meta/hostUid`,eski,this.uid);
    /* hâlâ düşükse tekrar dene (sıradaki aday devralır) */
    if(!this.closed&&!this.isHost()&&!this._hostTimer)this._hostTimer=setTimeout(()=>{this._hostTimer=null;this._devral()},this.hostTimeout);
  }
  async _hostOl(){
    this._host=true;
    const s=await this.db.get(`${yol(this.code)}/state`);
    if(!this._host)return;
    if(s){this.state=JSON.parse(s.json);this.rev=s.rev}
    this._actOff=this.db.onChildAdded(`${yol(this.code)}/actions`,(key,val)=>this._gelen(key,val));
    if(this.autoTick&&this.tickMs>0)this._tickTimer=setInterval(()=>this.tick(),this.tickMs);
    this._emit();
  }
  _hostBirak(){
    this._host=false;
    this._actOff?.();this._actOff=null;
    clearInterval(this._tickTimer);this._tickTimer=null;
  }
  _gelen(key,val){
    this.db.remove(`${yol(this.code)}/actions/${key}`);
    if(!this._host)return;
    let a;try{a={...JSON.parse(val.json),uid:val.uid}}catch(_){return}
    this._uygula(a);
  }
  ctx(){
    const m=this.meta||{};
    return{players:this.aktifler().map(p=>({uid:p.uid,name:p.name,avatar:p.avatar,age:p.age,online:p.online!==false})),now:this.db.now(),rand:this.rand,opts:m.opts||{},hostUid:m.hostUid};
  }
  _uygula(a){
    if(!this.state)return;
    let next;
    try{next=this.game.reduce(this.state,a,this.ctx())}catch(e){console.error('reduce hatası',a.type,e);return}
    if(next&&next!==this.state){this.state=next;this._yayinla()}
  }
  tick(){
    if(!this._host||!this.state||!this.game.tick)return;
    let next;
    try{next=this.game.tick(this.state,this.ctx())}catch(e){console.error('tick hatası',e);return}
    if(next&&next!==this.state){this.state=next;this._yayinla()}
  }
  _yayinla(){
    this.rev++;
    this.db.set(`${yol(this.code)}/state`,{rev:this.rev,json:JSON.stringify(this.state)});
    this._emit();
  }

  /* ── Oyuncu eylemleri ── */
  dispatch(type,veri={}){
    const a={type,...veri};
    if(this._host){this._uygula({...a,uid:this.uid});return}
    this.db.push(`${yol(this.code)}/actions`,{uid:this.uid,json:JSON.stringify(a)});
  }

  /* Host: lobi ayarları */
  async setOpts(patch){
    if(!this.isHost())return;
    const opts={...(this.meta.opts||{}),...patch};
    await this.db.set(`${yol(this.code)}/meta/opts`,opts);
  }
  /* Host: oyunu başlat */
  async startGame(){
    if(!this.isHost())return false;
    if(!this._host)await this._hostOl();
    try{await this.game.yukle?.()}catch(_){return false}
    const n=this.aktifler().length;
    if(n<this.game.players.min)return false;
    this.state=this.game.init(this.ctx());
    /* rev geriye gitmez: yeniden başlatmada konuklar yeni durumu "eski" sanıp yok saymasın */
    await this.db.update(yol(this.code),{'meta/status':'playing'});
    this._yayinla();
    return true;
  }
  /* Host: lobiye dön */
  async toLobby(){
    if(!this.isHost())return;
    this.state=null;
    await this.db.update(yol(this.code),{'meta/status':'lobby',state:null});
    this._emit();
  }
  async setPlayer(patch){
    await this.db.update(`${yol(this.code)}/players/${this.uid}`,patch);
  }

  /* ── Çıkış ── */
  async leave(){
    if(this.closed)return;
    const p=yol(this.code);
    const digerleri=this.players.filter(x=>x.uid!==this.uid&&x.online!==false);
    this._dcIptal?.();this._dcIptal=null;
    this._temizle();
    this.closed=true;
    try{
      if(this.isHost()&&digerleri.length){
        const yeni=digerleri.find(x=>!x.spectator)||digerleri[0];
        await this.db.set(`${p}/meta/hostUid`,yeni.uid);
      }
      if(!digerleri.length){await this.db.remove(p)}
      else await this.db.remove(`${p}/players/${this.uid}`);
    }catch(_){}
  }
  _temizle(){
    this._hostBirak();
    clearTimeout(this._hostTimer);this._hostTimer=null;
    for(const o of this._offs)o();
    this._offs=[];
  }
}
