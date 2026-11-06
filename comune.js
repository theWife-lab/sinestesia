/* v4 · stato condiviso fra le pagine (localStorage, niente fetch). Strumenti copiati da ../index.html (INSTR). */
const V4_INSTR=[{id:'tromba',n:'Tromba in Si♭',g:'Ottoni',lo:52,hi:86,tr:2},
 {id:'flicorno',n:'Flicorno in Si♭',g:'Ottoni',lo:52,hi:82,tr:2},
 {id:'corno',n:'Corno in Fa',g:'Ottoni',lo:35,hi:77,tr:7},
 {id:'trombone',n:'Trombone',g:'Ottoni',lo:34,hi:77,tr:0},
 {id:'eufonio',n:'Eufonio',g:'Ottoni',lo:34,hi:75,tr:0},
 {id:'tuba',n:'Tuba',g:'Ottoni',lo:24,hi:65,tr:0},
 {id:'flauto',n:'Flauto',g:'Legni',lo:60,hi:98,tr:0},
 {id:'clarinetto',n:'Clarinetto in Si♭',g:'Legni',lo:50,hi:94,tr:2},
 {id:'saxa',n:'Sax contralto in Mi♭',g:'Legni',lo:49,hi:81,tr:9},
 {id:'saxt',n:'Sax tenore in Si♭',g:'Legni',lo:44,hi:76,tr:14},
 {id:'oboe',n:'Oboe',g:'Legni',lo:58,hi:93,tr:0},
 {id:'fagotto',n:'Fagotto',g:'Legni',lo:34,hi:76,tr:0},
 {id:'voce-soprano',n:'Voce · soprano',g:'Voce',lo:60,hi:84,tr:0},
 {id:'voce-contralto',n:'Voce · contralto',g:'Voce',lo:53,hi:77,tr:0},
 {id:'voce-tenore',n:'Voce · tenore',g:'Voce',lo:48,hi:72,tr:0},
 {id:'voce-basso',n:'Voce · basso',g:'Voce',lo:40,hi:64,tr:0},
 {id:'violino',n:'Violino',g:'Archi',lo:55,hi:100,tr:0},
 {id:'viola',n:'Viola',g:'Archi',lo:48,hi:88,tr:0},
 {id:'violoncello',n:'Violoncello',g:'Archi',lo:36,hi:81,tr:0},
 {id:'contrabbasso',n:'Contrabbasso',g:'Archi',lo:28,hi:67,tr:12},
 {id:'altro',n:'Altro (estensione libera)',g:'Altro',lo:48,hi:84,tr:0}];
(function(){const Q=new URLSearchParams(location.search);let ls={};try{ls=localStorage}catch(_){}
 const id=Q.get('ins')||ls.v4ins||'tromba',I=V4_INSTR.find(x=>x.id===id)||V4_INSTR[0];
 window.V4=Object.assign(window.V4||{},{ins:I.id,insN:I.n,tr:I.tr,lo:I.lo,hi:I.hi,a4:+(ls.v4a4||442)});
 window.V4_setIns=i=>{try{localStorage.v4ins=i}catch(_){}};
 addEventListener('DOMContentLoaded',()=>{const m=document.getElementById('menu'),b=document.getElementById('apri');
  if(m&&b){b.onclick=()=>{const o=m.classList.toggle('on');b.setAttribute('aria-expanded',o);};}});
})();
