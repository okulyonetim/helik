/* Deneme çerçevesi: paylaşılan bellek veritabanı üzerinde gerçek Room + gerçek oyun ekranı (tests/e2e/calistir.mjs kullanır) */
import {Room} from '../../js/core/room.js';
import {GAMES} from '../../js/games/index.js';
import {skorSeridi} from '../../js/core/ui.js';

const i=Number(new URLSearchParams(location.search).get('u')||0);
const H=parent.H;
const ISIM=['Ayşe','Mehmet','Zeynep'],AV=['🦊','🐼','🦁'];
const profil={name:ISIM[i],avatar:AV[i],age:i===2?'cocuk':'yetiskin'};
let room=null,view=null;

function altCiz(snap){
  const g=room.game,root=document.getElementById('oyunalani');
  if(snap.state){
    if(!view){
      document.getElementById('baslik').textContent=g.name;
      const api={uid:room.uid,solo:false,room,dispatch:(t,d)=>room.dispatch(t,d),now:()=>room.db.now(),isHost:()=>room.isHost(),
        tekrar:()=>room.startGame(),lobi:()=>room.toLobby(),cik:()=>room.leave(),profil};
      view=g.view.mount(root,api);
    }
    view.update(snap);
    document.getElementById('skor').innerHTML=skorSeridi(snap.players,snap.state.skor,snap.state.sira);
  }else if(view){view.destroy();view=null}
}
function dinle(){room.subscribe(altCiz)}

window.hazirla=async(gameId,opts={})=>{
  room=await Room.create(H.hub.connect('u'+i),GAMES[gameId],profil,opts,{hostTimeout:600});
  H.kod=room.code;dinle();window.room=room;return room.code;
};
window.katil=async()=>{
  room=await Room.join(H.hub.connect('u'+i),GAMES,H.kod,profil,{hostTimeout:600});
  dinle();window.room=room;return room.code;
};
window.baslatOyun=()=>room.startGame();
window.durum=()=>room.state;
window.hazir=true;
