/* Studio + Analisi: un quadro in movimento. Ogni proprietà visiva è una misura (vedi leggenda in fondo). */
(function(){
const Q=new URLSearchParams(location.search),KIDS=false /* v4: una sola versione */,
 RM=Q.has('rm')||matchMedia('(prefers-reduced-motion: reduce)').matches,DEMO=Q.get('demo');
document.body.classList.toggle('kids',KIDS);
const $=s=>document.querySelector(s),clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),lerp=(a,b,k)=>a+(b-a)*k;
const NN=['do','do♯','re','mi♭','mi','fa','fa♯','sol','la♭','la','si♭','si'];
const fx=h=>h.length===4?"#"+[...h.slice(1)].map(c=>c+c).join(""):h;
const CS=getComputedStyle(document.body),BG=CS.getPropertyValue('--bg').trim(),LN=fx(CS.getPropertyValue("--ln").trim()),ACC=CS.getPropertyValue('--acc').trim();
const COLD=KIDS?'#7BC6F2':'#9AA7B8',IN=KIDS?'#6CC08B':LN;
const rgb=h=>{const n=parseInt(h.slice(1),16);return[n>>16,n>>8&255,n&255]},rgba=(h,a)=>`rgba(${rgb(h).join(',')},${a})`;
const LVS=[{id:'principiante',n:'principiante',k:'facile',tol:25,a0:150,a1:500,bw:.15,fl:.40,jc:1.5},{id:'avanzato',n:'avanzato',k:'medio',tol:15,a0:90,a1:350,bw:.25,fl:.25,jc:1.0},{id:'esperto',n:'esperto',k:'difficile',tol:8,a0:60,a1:250,bw:.35,fl:.15,jc:.7}];
let LVi=(()=>{const q=Q.get('livello');if(q){const i=LVS.findIndex(l=>l.id===q);if(i>=0)return i;}try{const v=localStorage.nvLivello;if(v!=null)return +v;}catch(_){}return KIDS?0:1;})(),LV=LVS[LVi];
const V4=window.V4||{};const S={a4:+(V4.a4||442),tr:+(V4.tr??2),gain:1,pc:false,drone:false,metro:false,bpm:80};
const A={};let started=false;
/* ---------- audio ---------- */
async function ensure(){if(A.ctx)return;A.ctx=new AudioContext();A.sr=A.ctx.sampleRate;A.an=A.ctx.createAnalyser();A.an.fftSize=4096;A.an.smoothingTimeConstant=0;
 A.buf=new Float32Array(A.an.fftSize);A.fb=new Float32Array(A.an.frequencyBinCount);A.yd=new Float32Array(2048);A.g=A.ctx.createGain();A.g.connect(A.an);A.dest=A.ctx.createMediaStreamDestination();A.g.connect(A.dest);}
async function startMic(id){await ensure();await A.ctx.resume();stop();
 const st=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false,...(id?{deviceId:{exact:id}}:{})}});
 A.st=st;A.src=A.ctx.createMediaStreamSource(st);A.src.connect(A.g);setGain();listDev();}
async function startFile(url){await ensure();await A.ctx.resume();stop();const b=await A.ctx.decodeAudioData(await (await fetch(url)).arrayBuffer());
 const s=A.ctx.createBufferSource();s.buffer=b;s.connect(A.g);s.connect(A.ctx.destination);s.onended=()=>{window.__fine=true;endTake();};s.start();A.src=s;A.dur=b.duration;setGain();}
function stop(){try{A.src&&A.src.disconnect();A.src&&A.src.stop&&A.src.stop()}catch(_){};if(A.st)A.st.getTracks().forEach(t=>t.stop());A.st=null;}
function setGain(){if(A.g)A.g.gain.value=S.pc?6:1;}
async function listDev(){try{const d=(await navigator.mediaDevices.enumerateDevices()).filter(x=>x.kind==='audioinput'),sel=$('#dev'),c=sel.value;
 sel.innerHTML=d.map((x,i)=>`<option value="${x.deviceId}">${x.label||'ingresso '+(i+1)}</option>`).join('')||'<option value="">microfono</option>';if(c)sel.value=c;}catch(_){}}
/* YIN: stessa funzione dell'app (index.html), qui con buffer propri */
function yin(x,sr,fmin,fmax){const Wn=Math.min(x.length>>1,A.yd.length),d=A.yd,tmin=Math.max(2,Math.floor(sr/fmax)),tmax=Math.min(Wn-1,Math.floor(sr/fmin));
 d[0]=1;let run=0;for(let tau=1;tau<=tmax;tau++){let s=0;for(let j=0;j<Wn;j++){const v=x[j]-x[j+tau];s+=v*v;}run+=s;d[tau]=run?s*tau/run:1;}
 let tau=-1;for(let t=tmin;t<tmax;t++){if(d[t]<0.15){while(t+1<tmax&&d[t+1]<d[t])t++;tau=t;break;}}
 if(tau<0){let mi=1e9,mt=-1;for(let t=tmin;t<tmax;t++)if(d[t]<mi){mi=d[t];mt=t;}if(mi<0.45)tau=mt;else return{f:0,conf:1-mi};}
 const a=d[tau-1],b=d[tau],c=d[tau+1],den=a+c-2*b,sh=den?0.5*(a-c)/den:0;return{f:sr/(tau+clamp(sh,-1,1)),conf:1-b};}
function specFlat(){const fb=A.fb;A.an.getFloatFrequencyData(fb);const bw=A.sr/A.an.fftSize,k0=Math.max(1,Math.floor(300/bw)),k1=Math.min(fb.length-1,Math.floor(6000/bw));
 let ls=0,s=0,n=0;for(let k=k0;k<=k1;k++){const p=Math.pow(10,Math.max(-160,fb[k])/10)+1e-16;ls+=Math.log(p);s+=p;n++;}return Math.exp(ls/n)/(s/n);}
/* ---------- misure live ---------- */
const L={t:0,db:-90,L:0,on:false,midi:NaN,cents:0,note:NaN,stab:0,flat:0,vibHz:0,vibC:0,vib:false,att:null,
 take:{t0:0,dur:0,voiced:0,inTune:0,devSum:0,breaks:0,attacks:0,clean:0,longest:0,vibT:0,notes:[]},trail:[],blades:[],brk:[],cur:null,lastOn:-9,gapStart:-1};
window.__live=L;window.__lv=()=>LVi;window.__att=[];
const TH=()=>S.pc?-58:-48;
function analyse(){if(!A.an)return;const now=A.ctx.currentTime;A.an.getFloatTimeDomainData(A.buf);
 let e=0;const x=A.buf.subarray(A.buf.length-2048);for(let i=0;i<x.length;i++)e+=x[i]*x[i];const db=10*Math.log10(e/x.length+1e-12)+(S.pc?0:0);
 L.db=db;L.L=clamp((db+60)/54);const loud=db>TH();let r=loud?yin(x,A.sr,55,1400):{f:0,conf:0};
 if(loud&&!(L.loud0>0))L.loud0=now;if(!loud)L.loud0=0;
 const voiced=loud&&r.f>0&&r.conf>0.8;L.flat=lerp(L.flat,loud?specFlat():0,.3);
 const T=L.take,dt=L.t?Math.min(.1,now-L.t):0;L.t=now;if(started)T.dur+=dt;
 if(voiced){const m=69+12*Math.log2(r.f/S.a4);
  // nuova nota: dopo silenzio, o salto > 0,7 semitoni stabile
  let c=L.cur;if(!c||Math.abs(m-c.m)>0.7){
   if(c&&L.on&&Math.abs(m-c.m)>0.7){ // rottura = salto e ritorno entro 250 ms
    if(c.jump==null){c.jump=now;c.jm=m;c.js=Math.abs(m-c.m);return;}c.js=Math.max(c.js,Math.abs(m-c.m)); if(now-c.jump<0.35&&Math.abs(m-c.jm)<0.7)return;}
   if(c&&c.jump!=null&&now-c.jump<LV.bw&&Math.abs(m-c.m)<=0.7){}
   if(c)closeNote(c,now);
   c=L.cur={m:Math.round(m),t0:L.loud0>0?L.loud0:now,peak:db,pt:now,att:null,cents:[],vb:[],brk:false};T.attacks++;
   L.blades.push({t:now,y:Math.random(),k:0,done:false});
  }else if(c.jump!=null){if(now-c.jump<LV.bw&&c.js>=LV.jc){T.breaks++;L.brk.push({t:now,x:Math.random()});c.brk=true;}c.jump=null;}
  finishVis(m,r,now,dt);
 }else{if(L.on&&L.cur)L.cur.off=L.cur.off||now;if(L.cur&&L.cur.off&&now-L.cur.off>0.18){closeNote(L.cur,now);L.cur=null;}L.on=false;
  if(L.cur&&L.cur.off&&loud&&L.flat>LV.fl&&!L.cur.brk){T.breaks++;L.brk.push({t:now,x:Math.random()});L.cur.brk=true;}}
 L.trail.push({t:now,c:L.on?L.cents:NaN,L:L.L,s:L.stab});while(L.trail.length&&now-L.trail[0].t>8)L.trail.shift();}
function finishVis(m,r,now,dt){const c=L.cur;c.off=0;L.on=true;L.midi=m;const ce=(m-c.m)*100;
 L.cents=Math.abs(ce-L.cents)>40?ce:lerp(L.cents,ce,.5);L.note=c.m;const T=L.take;
 if(c.att==null){if(L.db>c.peak+0.5){c.peak=L.db;c.pt=now;}if(now-c.pt>0.06||now-c.t0>0.4){c.att=Math.max(10,(c.pt-c.t0)*1000);L.att=c.att;
   const b=L.blades[L.blades.length-1];if(b){b.k=clamp((LV.a1-c.att)/(LV.a1-LV.a0))*(c.brk?.3:1);b.att=c.att;b.done=true;window.__att.push(+b.k.toFixed(2));}if(b&&b.k>=.6&&!c.brk)T.clean++;}}
 if(now-c.t0>0.1){c.cents.push(ce);c.vb.push([now,ce]);if(c.vb.length>140)c.vb.shift();
  if(started){T.voiced+=dt;if(Math.abs(ce)<=LV.tol)T.inTune+=dt;T.devSum+=ce*dt;}}
 const w=c.cents.slice(-25),mu=w.reduce((a,b)=>a+b,0)/(w.length||1);L.stab=Math.sqrt(w.reduce((a,b)=>a+(b-mu)**2,0)/(w.length||1));
 vib(c,now);if(L.vib&&started)T.vibT+=dt;}
function vib(c,now){const v=c.vb.filter(q=>now-q[0]<1.2);L.vib=false;if(v.length<30)return;const mu=v.reduce((a,q)=>a+q[1],0)/v.length;
 let z=0,amp=0;for(let i=1;i<v.length;i++){if((v[i-1][1]-mu)*(v[i][1]-mu)<0)z++;amp=Math.max(amp,Math.abs(v[i][1]-mu));}
 const span=v[v.length-1][0]-v[0][0],hz=z/2/span;L.vibHz=lerp(L.vibHz,hz,.2);L.vibC=lerp(L.vibC,amp,.2);L.vib=hz>4&&hz<8&&amp>6&&amp<80;}
function closeNote(c,now){const d=(c.off||now)-c.t0;if(started){L.take.notes.push(d);if(d>L.take.longest)L.take.longest=d;}}
setInterval(analyse,20);
/* ---------- bordone e metronomo ---------- */
let droneO=null,metroT=null;
function drone(on){if(droneO){droneO.g.gain.setTargetAtTime(0,A.ctx.currentTime,.1);const o=droneO;setTimeout(()=>o.o.stop(),400);droneO=null;}
 if(!on||!A.ctx)return;const m=isNaN(L.note)?70:L.note,o=A.ctx.createOscillator(),g=A.ctx.createGain();o.type='triangle';o.frequency.value=S.a4*2**((m-12-69)/12);
 g.gain.value=0;g.gain.setTargetAtTime(.06,A.ctx.currentTime,.2);o.connect(g);g.connect(A.ctx.destination);o.start();droneO={o,g,m};}
function metro(on){clearInterval(metroT);if(!on||!A.ctx)return;const tick=()=>{const o=A.ctx.createOscillator(),g=A.ctx.createGain(),t=A.ctx.currentTime;o.frequency.value=1800;
 g.gain.setValueAtTime(.12,t);g.gain.exponentialRampToValueAtTime(.001,t+.04);o.connect(g);g.connect(A.ctx.destination);o.start(t);o.stop(t+.05);L.beat=performance.now();};tick();metroT=setInterval(tick,60000/S.bpm);}
/* ---------- presa ---------- */
let REC=null;function recStart(){try{if(!window.MediaRecorder||!A.dest)return;const tr=[...cv.captureStream(30).getVideoTracks(),...A.dest.stream.getAudioTracks()];const ty=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4','video/webm;codecs=vp9,opus','video/webm'].find(t=>MediaRecorder.isTypeSupported(t))||'';const ch=[];REC=new MediaRecorder(new MediaStream(tr),ty?{mimeType:ty,videoBitsPerSecond:6e6}:{});REC.ondataavailable=e=>e.data&&e.data.size&&ch.push(e.data);REC.onstop=()=>{const b=new Blob(ch,{type:REC.mimeType||'video/webm'}),a=document.createElement('a');window.__lastVideo={size:b.size,type:b.type};a.href=URL.createObjectURL(b);a.download='sinestesia-'+(V4.modo||'sole')+'-'+Date.now()+(b.type.includes('mp4')?'.mp4':'.webm');document.body.appendChild(a);a.click();setTimeout(()=>a.remove(),4000);REC=null;};REC.start(1000);}catch(e){console.warn(e)}}
function recStop(){if(REC&&REC.state!=='inactive')REC.stop();}
function newTake(){recStart();L.take={t0:performance.now(),dur:0,voiced:0,inTune:0,devSum:0,breaks:0,attacks:0,clean:0,longest:0,vibT:0,notes:[]};L.brk=[];started=true;$('#rec').classList.add('on');}
function endTake(){if(!started)return;started=false;recStop();$('#rec').classList.remove('on');const T=L.take,p=T.voiced?T.inTune/T.voiced:0,mm=s=>Math.floor(s/60)+':'+String(Math.round(s%60)).padStart(2,'0');
 $('#cardin').innerHTML=KIDS?`<h2>Bravissima!</h2><p>Livello <b>${LV.k}</b></p><p>Note giuste <b>${Math.round(p*100)}%</b></p><p>Fiato più lungo <b>${T.longest.toFixed(1)} s</b></p><p>Partenze pulite <b>${T.clean}/${T.attacks}</b></p><p>Oops <b>${T.breaks}</b></p>`
 :`<h2>Fine presa · ${mm(T.dur)}</h2><p>Livello <b>${LV.n}</b></p><p>Intonazione (±${LV.tol} c) <b>${Math.round(p*100)}%</b> · media ${Math.round(T.voiced?T.devSum/T.voiced:0)} c</p><p>Nota più lunga <b>${T.longest.toFixed(1)} s</b></p><p>Attacchi puliti <b>${T.clean}/${T.attacks}</b></p><p>Vibrato <b>${T.vibT.toFixed(1)} s</b> · Rotture <b>${T.breaks}</b></p><p style="opacity:.6">tocca per chiudere</p>`;
 $('#card').classList.add('on');window.__card=T;}
$('#card').onclick=()=>$('#card').classList.remove('on');
/* ---------- comandi ---------- */
const tog=(el,k)=>{S[k]=!S[k];el.classList.toggle('on',S[k]);return S[k];};
$('#go').onclick=async()=>{try{await startMic($('#dev').value);$('#go').textContent='in ascolto';$('#go').classList.add('on');}catch(e){$('#leg').textContent='microfono non disponibile: '+e.name;}};
$('#dev').onchange=()=>startMic($('#dev').value).catch(()=>{});
$('#pc').onclick=e=>{tog(e.target,'pc');setGain();};
$('#a4').textContent='la '+S.a4;$('#a4').onclick=e=>{S.a4=S.a4===442?440:442;e.target.textContent='la '+S.a4;try{localStorage.v4a4=S.a4}catch(_){}};
$('#tr').innerHTML='<option value="0">suono reale</option>'+(S.tr?`<option value="${S.tr}">${V4.insN||'scritto'}</option>`:'');$('#tr').value=S.tr;$('#tr').onchange=e=>S.tr=+e.target.value;
$('#drone').onclick=e=>drone(tog(e.target,'drone'));$('#metro').onclick=e=>metro(tog(e.target,'metro'));
const lvb=$('#lv'),lvTxt=()=>lvb.textContent=(KIDS?LV.k:LV.n);lvTxt();lvb.onclick=()=>{LVi=(LVi+1)%3;LV=LVS[LVi];try{localStorage.nvLivello=LVi}catch(_){}lvTxt();window.V4_LIV&&V4_LIV(LVi);};
$('#rec').onclick=()=>started?endTake():newTake();
if(KIDS){$('#drone').textContent='nota amica';$('#metro').textContent='tic tac';$('#go').textContent='ascolta';$('#rec').textContent='registra';$('#pc').textContent='microfono pc';}
$('#leg').textContent=KIDS?'La palla è il tuo suono: più forte, più grande. Al centro = nota giusta.':
 'campo = suono (posizione: cent dalla linea · ampiezza: volume · bordo sfocato: instabilità · grana: soffio) · nuvole: ultimi 8 s · strisce di nuvole: attacchi (più lunghe e nitide = più rapidi) · anelli: vibrato · punti rossi: rotture · piano basso: % intonata della presa · filo in alto: durata';
if(DEMO){addEventListener('load',async()=>{await startFile(DEMO);window.__go=performance.now();newTake();$('#go').classList.add('on');$('#go').textContent='demo';});}
else listDev();
/* ---------- il quadro ---------- */
const cv=$('#q'),g=cv.getContext('2d');let W,H,F={x:.5,r:.05,blur:.3};
function size(){const d=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;cv.width=W*d;cv.height=H*d;g.setTransform(d,0,0,d,0,0);}size();addEventListener('resize',size);
const t0=performance.now();
function cloud(x,y,w,h,col,a,soft){g.save();g.translate(x,y);g.scale(w/h,1);const r=h*(1+soft*1.0),rg=g.createRadialGradient(0,0,0,0,0,r);
 rg.addColorStop(0,`rgba(${col},${a})`);rg.addColorStop(clamp(.7-soft*.3,.3,.95),`rgba(${col},${a*.6})`);rg.addColorStop(1,`rgba(${col},0)`);g.fillStyle=rg;g.fillRect(-r,-r,2*r,2*r);g.restore();}
function draw(){if(window.V4_DRAW){V4_DRAW(g,W,H,L,LVi,KIDS,RM);requestAnimationFrame(draw);return;}const t=(performance.now()-t0)/1000,br=RM?0:Math.sin(t*0.6),T=L.take,cx=W*.5;g.clearRect(0,0,W,H);g.fillStyle=BG;g.fillRect(0,0,W,H);
 // piano basso: % intonata della presa (altezza), colore = deviazione media
 const p=T.voiced?T.inTune/T.voiced:0,dm=T.voiced?T.devSum/T.voiced:0,ph=H*(.08+.42*p);
 g.globalCompositeOperation='multiply';
 let gr=g.createLinearGradient(0,H-ph-60,0,H);gr.addColorStop(0,rgba(dm<-5?COLD:dm>5?ACC:IN,0));gr.addColorStop(.25,rgba(dm<-5?COLD:dm>5?ACC:IN,.10));gr.addColorStop(1,rgba(dm<-5?COLD:dm>5?ACC:IN,.18));
 g.fillStyle=gr;g.fillRect(0,H-ph-60,W,ph+60);
 // linea della nota giusta (accordatore)
 g.globalCompositeOperation='source-over';g.strokeStyle=rgba(LN,.85);g.lineWidth=1;g.beginPath();g.moveTo(cx+.5,0);g.lineTo(cx+.5,H);g.stroke();
 g.strokeStyle=rgba(LN,.25);[-LV.tol,LV.tol].forEach(c=>{const x=cx+c/50*W*.36;g.beginPath();g.moveTo(x+.5,H*.12);g.lineTo(x+.5,H*.88);g.stroke();});
 // filo in alto: durata (0–3 min)
 g.fillStyle=LN;g.fillRect(0,0,W*clamp(T.dur/180),2);
 // metronomo: battito = leggero lampo del filo centrale
 if(S.metro&&L.beat){const k=clamp(1-(performance.now()-L.beat)/180);if(k>0){g.strokeStyle=rgba(ACC,k);g.lineWidth=3;g.beginPath();g.moveTo(cx,0);g.lineTo(cx,H);g.stroke();}}
 g.globalCompositeOperation='multiply';
 // lame: attacchi. inclinazione/nitidezza = rapidità, svaniscono in 5 s
 L.blades=L.blades.filter(b=>t-(b.tt??(b.tt=t))<5);
 const SUN=KIDS?['255,170,90','255,130,170','220,120,230','255,210,90']:['242,140,70','232,96,130','150,80,160','240,190,90'];
 g.globalCompositeOperation='multiply';
 g.globalCompositeOperation='source-over';
 for(const b of L.blades){const a=1-(t-b.tt)/5;if(!b.done)continue;const k=b.k,y=H*(.12+.72*b.y),x0=W*.02,
   len=W*(.12+.58*k),th=H*(.006+.012*(1-k)),cr=Math.round(lerp(150,236,k)),cg=Math.round(lerp(148,178,k)),cb=Math.round(lerp(150,48,k)),c=`${cr},${cg},${cb}`;
  if(k>.05){const lg=g.createLinearGradient(x0,0,x0+len,0);lg.addColorStop(0,`rgba(${c},0)`);lg.addColorStop(.08,`rgba(${c},${.95*a*k})`);lg.addColorStop(.85,`rgba(${c},${.8*a*k})`);lg.addColorStop(1,`rgba(${c},0)`);
   g.fillStyle=lg;g.beginPath();g.moveTo(x0,y);g.lineTo(x0+len*.08,y-th);g.lineTo(x0+len,y-th*.25);g.lineTo(x0+len,y+th*.25);g.lineTo(x0+len*.08,y+th);g.fill();
   if(k>.6){g.fillStyle=`rgba(255,248,220,${.7*a*(k-.6)/.4})`;g.fillRect(x0+len*.08,y-.75,len*.8,1.5);}}
  if(k<.95){let sd=Math.floor(b.y*1e6)+7;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647,da=a*(1-k),Ld=W*.62,D='70,70,74';
   // corpo sfilacciato: bordo superiore e inferiore strappati
   g.fillStyle=`rgba(${D},${.75*da})`;g.beginPath();g.moveTo(x0,y);const n=40,tk=H*.011;
   for(let q=0;q<=n;q++){const u=q/n,fade=1-u*.6;g.lineTo(x0+u*Ld,y-tk*fade*(.4+rnd()*.9));}
   for(let q=n;q>=0;q--){const u=q/n,fade=1-u*.6;g.lineTo(x0+u*Ld*(q===n?.9:1),y+tk*fade*(.4+rnd()*.9));}g.fill();
   // fibre rotte che si staccano
   g.strokeStyle=`rgba(${D},${.6*da})`;g.lineWidth=1;for(let f=0;f<12;f++){const sx=x0+rnd()*Ld*.9,l=Ld*(.05+.2*rnd()),dy=(rnd()-.5)*tk*4;
    g.beginPath();g.moveTo(sx,y+dy*.2);g.quadraticCurveTo(sx+l*.5,y+dy*.6,sx+l,y+dy+(rnd()-.5)*4);g.stroke();}
   // buchi nello strappo
   for(let f=0;f<6;f++){g.fillStyle=rgba(BG,.8*da);g.fillRect(x0+Ld*(.15+rnd()*.8),y-tk,2+rnd()*5,tk*2);}g.globalCompositeOperation='source-over';}}

 // scia: cent nel tempo (sale verso l'alto), spessore = volume, colore = intonazione
 const now=A.ctx?A.ctx.currentTime:0;
 for(let i=0;i<L.trail.length;i+=3){const q=L.trail[i];if(isNaN(q.c))continue;const age=(now-q.t)/8,y=H*.62-age*H*.6,x=cx+clamp(q.c,-50,50)/50*W*.36;
  const k=clamp(y/H),c=k<.25?SUN[2]:k<.42?SUN[1]:k<.55?SUN[0]:SUN[3],wv=RM?0:Math.sin(t*.25+i*.7)*W*.008;
  cloud(x+wv,y,W*(.05+.10*q.L)*(KIDS?1.2:1),H*(.006+.022*q.L)*(KIDS?1.3:1),c,(KIDS?.22:.16)+.3*q.L*(1-age*.7),clamp((q.s||0)/25));}
 // campo principale: il suono adesso
 const on=L.on,tx=on?cx+clamp(L.cents,-50,50)/50*W*.36:cx,tr=on?Math.min(W,H)*(.06+.30*L.L)*(KIDS?1.2:1):Math.min(W,H)*(.035+.01*br);
 const fdt=Math.min(.05,F.lt?t-F.lt:0);F.lt=t;F.v=F.v||0;{const w=1/.3,d=tx-F.x;F.v+=(w*w*d-2*w*F.v)*fdt;F.x+=F.v*fdt;}F.r=lerp(F.r,tr,1-Math.exp(-fdt/.6));F.blur=lerp(F.blur,on?clamp(L.stab/25,.05,1):.6,1-Math.exp(-fdt/.5));
 const fy=H*.62+(RM?0:Math.sin(t*.25)*H*.006),col=!on?LN:Math.abs(L.cents)<=LV.tol?IN:L.cents<0?COLD:ACC,a0=on?.85:.25;
 const rg=g.createRadialGradient(F.x,fy,0,F.x,fy,F.r*(1+F.blur));rg.addColorStop(0,rgba(col,a0));rg.addColorStop(clamp(1-F.blur*.9,.05,.95),rgba(col,a0*.9));rg.addColorStop(1,rgba(col,0));
 g.fillStyle=rg;g.beginPath();g.arc(F.x,fy,F.r*(1+F.blur),0,7);g.fill();
 // grana: soffio/rumore (piattezza spettrale)
 const gn=Math.floor(clamp(L.flat*4)*(KIDS?120:260));g.fillStyle=rgba(LN,.5);for(let i=0;i<gn;i++){const an=Math.random()*7,rr=Math.sqrt(Math.random())*F.r*1.3;g.fillRect(F.x+Math.cos(an)*rr,fy+Math.sin(an)*rr,1.2,1.2);}
 // anelli: vibrato. numero = Hz, ondulazione = ampiezza in cent
 if(on&&L.vib){g.strokeStyle=rgba(col,.55);g.lineWidth=1.2;const n=Math.round(L.vibHz);for(let i=1;i<=n;i++){const R=F.r*(1+F.blur)+i*14;g.beginPath();
   for(let k=0;k<=96;k++){const an=k/96*6.2832,rr=R+Math.sin(an*n+t*L.vibHz*6.28)*L.vibC*.25;g.lineTo(F.x+Math.cos(an)*rr,fy+Math.sin(an)*rr);}g.stroke();}}
 // rotture: punti rossi nella colonna destra
 g.globalCompositeOperation='source-over';
 L.brk.forEach((b,i)=>{g.fillStyle=rgba(KIDS?ACC:'#e8343f',.85);const y=H*.2+((i*0.618)%1)*H*.6,x=W*.9+b.x*W*.06;g.beginPath();g.arc(x,y,KIDS?9:5,0,7);g.fill();});
 // cifre minime
 const nt=$('#nota');if(on){const wn=L.note+S.tr,nm=NN[((wn%12)+12)%12],c=Math.round(L.cents);
  nt.firstChild.textContent=nm;nt.querySelector('small').textContent=KIDS?(Math.abs(c)<=LV.tol?'giusta!':c<0?'un po’ bassa':'un po’ alta'):(c>=0?'+':'−')+Math.abs(c)+' cent'+(L.vib?` · vibrato ${L.vibHz.toFixed(1)} Hz`:'');}
 else if(!L.cur){nt.querySelector('small').textContent=KIDS?'suona una nota':'in ascolto';}
 const mm=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
 $('#tempo').textContent=(started?'● presa ':'')+mm(T.dur)+' · intonata '+Math.round(p*100)+'% · attacchi '+T.clean+'/'+T.attacks+' · rotture '+T.breaks+' · '+(KIDS?LV.k:LV.n);
 requestAnimationFrame(draw);}
draw();window.__pronto=true;
})();
