/* La Creatura: Velo di Elfetto Generativo (generativo/forma-ampia.js, non modificato) guidato dalle misure live di motore.js.
   Ponte L (motore) -> F (skin): on, Ls, pitchT (0..1 sull'estensione dello strumento), cents, noteId, vib, vibAmt.
   Livello di accuratezza del menù -> skin.livello 0..2 (25/15/8 cent). pal: solo {kids:false,rm}; bg/accent/gold restano quelli di Velo. */
(function(){
const v=PALCO.voci.forma.find(x=>x.id==='ampia');const sk=v&&v.skin;if(!sk){console.warn('Velo non trovato');return;}
sk.reset&&sk.reset();let liv=0;try{liv=+(localStorage.nvLivello||0)}catch(_){};sk.livello=liv;
window.V4_LIV=i=>sk.livello=i;
let nid=0,cur=null,nb=0,last=performance.now();
window.V4_DRAW=(g,W,H,L,LVi,KIDS,RM)=>{const now=performance.now(),dt=Math.min(.1,(now-last)/1000);last=now;sk.livello=LVi;
 if(L.cur!==cur){cur=L.cur;if(cur){nid++;sk.onOnset&&sk.onOnset();}}
 if(L.brk.length>nb){nb=L.brk.length;sk.onCrack&&sk.onCrack();}else if(L.brk.length<nb)nb=L.brk.length;
 const lo=V4.lo,hi=V4.hi,p=isNaN(L.midi)?null:Math.max(0,Math.min(1,(L.midi-lo)/(hi-lo)));
 sk.update({on:L.on,Ls:L.L,pitchT:p,cents:L.cents,noteId:nid,vib:L.vib,vibAmt:Math.max(0,Math.min(1,(L.vibC||0)/50)),crack:false},dt);
 g.clearRect(0,0,W,H);sk.draw(g,W,H,{kids:false,rm:RM});};
})();
