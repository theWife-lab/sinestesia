/* palco_v2/generativo/forma-ampia.js — Elfetto Generativo. Forma "Velo" (id: ampia) v8: veli 3D avvolti, palette propria indaco notte ↔ lime acido.
   Meccanismo studiato (non copiato): UN nastro largo e sottile che si avvolge su se stesso in 3D, punte che si
   assottigliano e svaniscono in dissolvenza morbida, fronte/retro distinguibili, luce morbida di volume; due colori che seguono la
   luce (ombra = colore profondo, luce = colore chiaro) e scorrono lungo il foglio; SFUMATURA: gradienti lisci tra i due colori,
   nessuna grana (solo dither invisibile anti-banding; grana opzionale con ?grana=1). Mesh triangolata calcolata in JS (curva 3D + larghezza + torsione), WebGL2 1x.
   mappa: altezza (scalata sull'estensione della presa) = torsione/avvitamento (sale = un verso, scende = l'altro) e quota;
   volume = larghezza del foglio e velocità; legato = il foglio si allunga e si avvolge di più; attacco = contrazione
   80 ms poi onda che percorre il nastro (follow-through); vibrato = ondulazione del bordo; intonazione = bilanciamento
   dei due colori e levigatezza; rottura = piega brusca che si distende; silenzio = si arrotola lento e si assottiglia. */
(function(){
if(!window.PALCO){const R={forma:[],colori:[],sfondo:[]};window.PALCO={voci:R,register(c,id,o){c=String(c).toLowerCase();if(!R[c])return;o=Object.assign({id,cat:c},o);const i=R[c].findIndex(v=>v.id===id);if(i>=0)R[c][i]=o;else R[c].push(o);},onRegister(){}};}
const TAU=Math.PI*2,cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),lerp=(a,b,k)=>a+(b-a)*k;
const P0={bg:'#ECECEA',ink:'#111111',accent:'#E8452C',gold:'#C9A14A',cold:'#6E7FA8',soft:'#F2C9B8'};
function hx(c){const n=parseInt((c||'#000000').slice(1,7),16);return[(n>>16)/255,(n>>8&255)/255,(n&255)/255];}
function spring(s,k,t,dt,st,dm){const a=st*(t-s[k])-dm*s[k+'v'];s[k+'v']+=a*dt;s[k]+=s[k+'v']*dt;}
const _q=(typeof location!=='undefined'?new URLSearchParams(location.search):new URLSearchParams()),NU=+(_q.get('nu')||300),NV=+(_q.get('nv')||56),NVERT=NU*NV,NL=+(_q.get('nl')||3),NVT=NVERT*NL; // v10: mesh densa (micro-pieghe), 3 veli // NL veli sovrapposti
// Palette propria di Velo (ignora la palette dell'app): indaco notte ↔ lime acido, gamma da quasi nero a quasi bianco
const VP={K:'#0B1C48',D:'#1F55A6',M:'#22B3BA',L:'#C9F03A',W:'#F7FBEA'},VPk={K:'#1F3C8A',D:'#3A72E0',M:'#3FD6C8',L:'#DDFF4D',W:'#FFFFF2'};
const VS=`#version 300 es
in vec3 P;in vec3 N;in vec3 UV;out vec3 vN;out vec2 vUV;out float vL;void main(){vN=N;vUV=UV.xy;vL=UV.z;gl_Position=vec4(P,1.);}`;
const FS=`#version 300 es
precision highp float;in vec3 vN;in vec2 vUV;in float vL;out vec4 o;
uniform vec3 cD,cL,cB,cK,cW,cM;uniform float pass;uniform float R1;uniform float bal,kids,shine,fade,head,pul,grain,vul;
float h(vec2 p){vec3 q=fract(vec3(p.xyx)*.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
void main(){float cv=max(length(vN)-1.,0.);vec3 n=normalize(vN);float side=gl_FrontFacing?1.:-1.;if(n.z<0.)n=-n;
 vec3 L=normalize(vec3(-.45,.65,.6));
 float dif=clamp(dot(n,L),0.,1.)*.8+.2;float vol=1.-pow(abs(vUV.y-.5)*2.,2.);                 // luce morbida avvolgente
 float face=clamp(n.z*.5+.5,0.,1.);
 float tone=pow(dif,2.)*1.3+.12*face+.1*vol-.18+(side>0.?.04:-.1);
 float e=1.;   // lastra chiusa: nessun bordo che svanisce di lato, solo le punte
 float hd=smoothstep(.3,.92,vUV.x)*head;float bk=vL<.5?1.:1.-smoothstep(.45,.85,vUV.x)*(.4+.6*head);   // veli posteriori lontani dalla testa   // testa (fronte del moto, u→1): densa; corpo e coda leggeri
 float a=smoothstep(0.,.13,e)*smoothstep(0.,.3,vUV.x)*smoothstep(1.,mix(.8,.93,head),vUV.x)*fade;   // corpo opaco, solo punte e filo del bordo si sciolgono
 float k=clamp(tone+(1.-smoothstep(.1,.9,a))*.55,0.,1.2);   // i bordi che svaniscono restano chiari
 float ht=smoothstep(.12,.88,k*.85+.16+vL*.22+(vUV.x-.5)*.55+(side>0.?.06:-.06)+bal+.12*sin(vUV.x*5.+vUV.y*2.));  // ombra → colore 1, luce → colore 2 (come il meccanismo del riferimento)
 ht=vL<.5?ht:(vL<1.5?.62+.38*ht:.5+.5*ht);                    // veli secondari: tinte pure (acqua→lime / acqua), mai grigio                          // i veli secondari restano nella zona acqua→lime (niente grigio nella sovrapposizione)
 vec3 hue=ht<.5?mix(cD,cM,ht*2.):mix(cM,cL,ht*2.-1.); // percorso di tinta indaco→acqua→lime (niente grigio)                                   // due colori lungo il foglio
 float tip=smoothstep(.28,.0,min(vUV.x,1.-vUV.x));k=max(k,mix(k,.55,tip));                // punte arricciate: niente 'occhio' scuro
 vec3 c=mix(mix(cK,hue,.2+.5*min(vL,1.)),hue,smoothstep(.05,.62,k));     // ombra profonda dello stesso colore
 c=mix(c,mix(hue,cW,vL<.5?.6:.25),smoothstep(.7,1.15,k)*smoothstep(.35,.85,ht));          // solo la luce (lato lime) va verso il bianco: l'ombra blu resta satura, mai grigia          // luce quasi bianca
 float ridge=smoothstep(.7,2.4,cv)*(.5+.5*smoothstep(.0,.25,1.-abs(n.z)));   // creste sottili da curvatura
 c=mix(c,mix(cM,cW,.72),ridge*shine*(vL<.5?1.:.5));
 float g=h(gl_FragCoord.xy),g2=h(gl_FragCoord.xy+71.3);
 if(grain>.5){if(g>a*2.2)discard;}else if(a<.004)discard;float aa=grain>.5?smoothstep(0.,.35,a):smoothstep(0.,.55,a)*smoothstep(0.,.25,a);                                       // dissolvenza granulosa a bordi e punte
 float sh=(.5+.7*hd)*smoothstep(.05,.25,tone)*(1.-smoothstep(.45,.72,tone))*smoothstep(.35,.8,a)*(1.-.7*min(vL,1.));                      // grana finissima solo in ombra
 c=mix(c,mix(hue,cM,.6)*1.15+.04,step(g2,sh*sh*(.13+.1*hd))*.65*grain);c+=(g-.5)/255.;   // grana chiara sull'ombra profonda
 float fz=fwidth(n.z)+1e-4;c=mix(c,mix(cM,cW,.78),smoothstep(7.,1.5,abs(n.z)/fz)*shine*smoothstep(.4,.9,a)*(vL<.5?1.:.6)); // cresta nitida (1-2px) dove il foglio si gira di profilo
 c=mix(c,mix(mix(cM,cL,.4),cW,.35),(1.-smoothstep(.2,.9,a))*.45);c=mix(c,mix(cM,cW,.5),smoothstep(.55,.0,abs(n.z))*.32*smoothstep(.2,.8,a));if(side<0.)c=mix(c,mix(cM,cL,.45)*1.05,.1);   // bordo di taglio = fascia luminosa piena (rim morbida); faccia interna traslucida tipo caramella   // i bordi che si sciolgono virano ad acqua-lime chiaro: mai grigio
 if(kids>.5)c=clamp((c-.5)*1.25+.52,0.,1.);
 aa*=1.-.45*(1.-hd)*smoothstep(.3,.06,abs(n.z))*(vL<.5?1.:0.);aa=min(.97,aa*(vL<.5?1.4:.32*bk)*mix(.68,1.,max(hd,.3*(1.-head)))); c=mix(c,mix(cM,cL,.6),(1.-hd)*.22*head); {float nu=exp(-pow((vUV.x-.9)/.045,2.))*(.85+.15*head)*(.8+.2*pul);c=mix(c,mix(cM,cW,.55+.2*pul),nu*(.42+.4*vul)*(vL<.5?1.:.4));aa=min(.97,aa+nu*(.35+.3*vul)*(vL<.5?1.:.2));} if(side<0.)aa*=.5;   // la faccia dietro traspare appena: niente media grigia tra le due facce
 {float y=dot(c,vec3(.3,.55,.15));c=clamp(mix(vec3(y),c,1.25+.3*hd),0.,1.);}   // corpo/coda più chiari e trasparenti, testa satura
 if(pass<.5){float wz=aa*aa*clamp(3e3*pow(1.-gl_FragCoord.z*.97,14.),.01,1.5e3)*(vL<.5?12.:1.);o=vec4(c*aa*wz,aa*wz);}else o=vec4(0.,0.,0.,aa);}   // velo secondario più sottile e trasparente`;
function mkGL(){try{const cv=(typeof OffscreenCanvas!=='undefined')?new OffscreenCanvas(2,2):document.createElement('canvas'),gl=cv.getContext('webgl2',{premultipliedAlpha:true,preserveDrawingBuffer:false,antialias:false,depth:true});if(!gl)return null;
 const sh=(t,src)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(s);return s;};
 const pr=gl.createProgram();gl.attachShader(pr,sh(gl.VERTEX_SHADER,VS));gl.attachShader(pr,sh(gl.FRAGMENT_SHADER,FS));gl.linkProgram(pr);if(!gl.getProgramParameter(pr,gl.LINK_STATUS))throw gl.getProgramInfoLog(pr);
 gl.useProgram(pr);const B={};for(const [k,n] of [['P',3],['N',3],['UV',3]]){const b=gl.createBuffer(),l=gl.getAttribLocation(pr,k);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,n,gl.FLOAT,false,0,0);B[k]=b;}
 const uv=new Float32Array(NVT*3);for(let l=0;l<NL;l++)for(let i=0;i<NU;i++)for(let j=0;j<NV;j++){const o=(l*NVERT+i*NV+j)*3;uv[o]=i/(NU-1);uv[o+1]=.5+.5*Math.cos(j/NV*TAU);uv[o+2]=l;}
 gl.bindBuffer(gl.ARRAY_BUFFER,B.UV);gl.bufferData(gl.ARRAY_BUFFER,uv,gl.STATIC_DRAW);
 const idx=new Uint32Array(NL*(NU-1)*NV*6);{let q=0;for(let l=0;l<NL;l++)for(let i=0;i<NU-1;i++)for(let j=0;j<NV;j++){const a=l*NVERT+i*NV+j,b=a+NV,a1=l*NVERT+i*NV+(j+1)%NV,b1=a1+NV;idx.set([a,b,a1,a1,b,b1],q);q+=6;}}
 const ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,idx,gl.STATIC_DRAW);
 const U={};for(const k of['grain','vul','pul','cD','cL','cB','bal','kids','shine','fade','cK','cW','R1','cM','pass','head'])U[k]=gl.getUniformLocation(pr,k);
 gl.getExtension('EXT_color_buffer_float');gl.getExtension('EXT_color_buffer_half_float');
 // composito OIT
 const CV=`#version 300 es
in vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`,CF=`#version 300 es
precision highp float;uniform sampler2D A,Rv;out vec4 o;void main(){ivec2 p=ivec2(gl_FragCoord.xy);vec4 ac=texelFetch(A,p,0);float r=texelFetch(Rv,p,0).a;
 vec3 c=ac.rgb/max(ac.a,1e-5);float y=dot(c,vec3(.3,.55,.15));c=clamp(mix(vec3(y),c,1.14),0.,1.);float al=1.-r;o=vec4(c*al,al);}`;
 const cp=gl.createProgram();gl.attachShader(cp,sh(gl.VERTEX_SHADER,CV));gl.attachShader(cp,sh(gl.FRAGMENT_SHADER,CF));gl.bindAttribLocation(cp,7,'a');gl.linkProgram(cp);
 const qb=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,qb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
 const vao=gl.createVertexArray();gl.bindVertexArray(vao);gl.enableVertexAttribArray(7);gl.vertexAttribPointer(7,2,gl.FLOAT,false,0,0);gl.bindVertexArray(null);
 // il VAO di default contiene gli attributi della mesh: li ricolleghiamo in un VAO dedicato
 const mvao=gl.createVertexArray();gl.bindVertexArray(mvao);for(const [k,n] of [['P',3],['N',3],['UV',3]]){const l=gl.getAttribLocation(pr,k);gl.bindBuffer(gl.ARRAY_BUFFER,B[k]);gl.enableVertexAttribArray(l);gl.vertexAttribPointer(l,n,gl.FLOAT,false,0,0);}gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,ib);gl.bindVertexArray(null);
 const oit={cp,vao,mvao,fA:gl.createFramebuffer(),fR:gl.createFramebuffer(),tA:gl.createTexture(),tR:gl.createTexture(),w:0,h:0,uA:gl.getUniformLocation(cp,'A'),uR:gl.getUniformLocation(cp,'Rv')};
 return{cv,gl,U,B,ib,pr,oit,ni:idx.length};}catch(e){console.error('Velo: WebGL2 non disponibile, fallback 2D',e);return null;}}
// LIVELLI DI DOMA: stessi id/nomi dei livelli dell'app (studio_analisi: principiante/avanzato/esperto = facile/medio/difficile, tol 25/15/8 cent)
// su: velocità di salita; dz/sc: tolleranza di stabilità (cent); ab: tolleranza sull'intonazione media; base/lw: peso volume; hold: secondi di tenuta per la doma piena; giu: ritorno al selvatico; fr: forza del fremito
const DOMA=[{id:'principiante',k:'facile',tol:25,su:6,dz:18,sc:40,ab:60,base:.75,lw:.6,hold:.3,giu:.04,fr:.1,cv:.3,gap:.9},
 {id:'avanzato',k:'medio',tol:15,su:1.1,dz:10,sc:22,ab:38,base:.38,lw:1,hold:1.4,giu:.09,fr:.6,cv:.6,gap:.6},
 {id:'esperto',k:'difficile',tol:8,su:.7,dz:7,sc:18,ab:30,base:.25,lw:1.1,hold:2,giu:.12,fr:1,cv:.9,gap:.4}];
const _dl=_q.get('doma')||_q.get('livello');let DOMA_I=_dl?(/^[123]$/.test(_dl)?+_dl-1:Math.max(0,DOMA.findIndex(d=>d.id===_dl||d.k===_dl))):0;
const GRANA=/[?&]grana=1/.test(location.search)?1:0;const CH=new Float32Array(NU*3),CO=new Float32Array(NU*3),TN=new Float32Array(NU*6),POS=new Float32Array(NVT*3),NOR=new Float32Array(NVT*3),C=new Float32Array(NU*3),SC=new Float32Array(NVT*3),CUR=new Float32Array(NVT);
const velo={
 reset(){Object.assign(this,{tt:0,flow:0,F:{},lo:null,hi:null,pn:.5,on:0,y:.5,yv:0,W:.18,Wv:0,wrap:1.3,wrapv:0,tw:0,twv:0,twd:0,it:.5,vib:0,ld:0,age:0,pp:null,slope:0,
  waves:[],ant:0,calm:0,push:0,pushv:0,lag:.4,lagv:0,open:0,openv:0,gest:0,gt:-9,gdir:1,sil:0,tame:0,res:0,B:null,cam:null,V:[.25,0,0],T:[.4,0,0],tk:0,hdg:0,len:.6,pul:0,kinks:[],rot:0,fs:1,fsv:0,ox:0,oy:0,oxv:0,oyv:0,sm:.5});},
 onOnset(){const DQ=DOMA[this.livello|0]||DOMA[0];if(this.tt-(this.lOn==null?-9:this.lOn)<DQ.gap||!this.on2)return;this.lOn=this.tt;this.ant=.08;this.res=.35;if(this.sil>.5){this.pick&&this.B&&this.pick(1);this.gt=this.tt;this.gdir=this.slope>=0?1:-1;}this.age=0;}, // inizio frase dopo una pausa = gesto: il foglio si infila in sé,
 onCrack(){this.kinks.push({u:.3+.4*Math.random(),a:1,s:Math.random()<.5?-1:1});if(this.kinks.length>3)this.kinks.shift();},
 update(F0,dt){this.tt+=dt;this.dtL=dt;
  // v20 CONDIZIONAMENTO INGRESSI: gate con isteresi temporale + inviluppo a due stadi (attacco/rilascio diversi) → niente tremolio dal microfono
  const ro=!!F0.on;this.gOn=ro?(this.gOn||0)+dt:0;this.gOff=ro?0:(this.gOff||0)+dt;if(!this.on2&&this.gOn>.09)this.on2=1;else if(this.on2&&this.gOff>.6)this.on2=0;
  const lr=ro?cl(F0.Ls||0):0;this.e1=lerp(this.e1||0,lr,cl(dt*(lr>(this.e1||0)?4:1.5)));this.e2=lerp(this.e2||0,this.e1,cl(dt*(this.e1>(this.e2||0)?2.2:1.1)));
  if(ro&&F0.pitchT!=null)this.pT=this.pT==null?F0.pitchT:lerp(this.pT,F0.pitchT,cl(dt*3));
  if(F0.noteId!==this.nRaw){this.nRaw=F0.noteId;this.nT=0;}else this.nT=(this.nT||0)+dt;if(this.nT>.2)this.nId=this.nRaw;
  const F=Object.assign({},F0,{on:!!this.on2,Ls:this.e2,pitchT:this.pT,noteId:this.nId,cents:F0.on?F0.cents:(this.lc||0)});if(F0.on)this.lc=F0.cents;this.F=F;const on=!!F.on;this.on=lerp(this.on,on?1:0,cl(dt*(on?5:1)));
  if(on&&F.pitchT!=null){const p=F.pitchT;if(this.lo==null){this.lo=p-.05;this.hi=p+.05;}
   this.lo=p<this.lo?lerp(this.lo,p,cl(dt*4)):lerp(this.lo,p,cl(dt*.015));this.hi=p>this.hi?lerp(this.hi,p,cl(dt*4)):lerp(this.hi,p,cl(dt*.015));
   const sp=Math.max(.06,this.hi-this.lo),m=(this.lo+this.hi)/2;this.pn=cl((p-(m-sp/2))/sp);}
  if(on){if(this.pp!=null)this.slope=lerp(this.slope,cl((this.pn-this.pp)/Math.max(dt,1e-3)*.5,-1.5,1.5),cl(dt*4));this.pp=this.pn;}else{this.pp=null;this.slope=lerp(this.slope,0,cl(dt*1.5));}
  this.ld=lerp(this.ld,on?(F.Ls||0):0,cl(dt*5));this.pres=lerp(this.pres||0,on?1:0,cl(dt*(on?1.5:.8)));this.lv=lerp(this.lv||0,on?cl(F.Ls||0):0,cl(dt*2.5));  // volume leggibile: risposta continua ~140 msthis.age=on?this.age+dt:0;
  this.it=lerp(this.it,on?cl(1-Math.abs(F.cents||0)/25):.6,cl(dt*2));
  if(on){const c=F.cents||0;if(F.noteId!==this.nid){this.nid=F.noteId;this.cm=c;}this.cm=lerp(this.cm,c,cl(dt*1.5));const dv=F.vib?0:Math.abs(c-this.cm);this.dev=lerp(this.dev||0,dv,cl(dt*6));}else this.dev=lerp(this.dev||0,0,cl(dt*2));
  this.pA=on?(this.pA||0)+dt:(this.sil>.6?0:(this.pA||0));const DP=DOMA[this.livello|0]||DOMA[0];this.st=cl(1-Math.max(((this.dev||0)-DP.dz)/DP.sc,(Math.abs(this.cm||0)-DP.ab)/30));  // stabilità d'intonazione rispetto alla propria nota (non al La assoluto)
  this.vib=lerp(this.vib,on&&F.vib?(F.vibAmt||.4):0,cl(dt*4));
  // molle viscose
  this.sil=on?0:this.sil+dt;
  { const ga=(this.tt-this.gt)/2.8,e=ga<0||ga>1?0:Math.sin(Math.PI*ga);this.gest=lerp(this.gest,e,cl(dt*3));
    }   // avvitamento coreografato di ~3 s
  spring(this,'y',on?this.pn:.5,dt,5,4);
  let Wt=(on?.6+.32*this.ld:.34)*(.75+.45*this.open);if(this.ant>0){this.ant-=dt;Wt*=.7;if(this.ant<=0){this.waves.push({t:this.tt,a:.5+.6*this.ld});this.pushv+=2.5;this.kT=(this.kT||0)+(.5+.8*this.ld)*(DOMA[this.livello|0]||DOMA[0]).cv;if(this.waves.length>5)this.waves.shift();this.Wv+=.5;}}
  spring(this,'W',Wt,dt,on?14:4,on?3.5:3);
  // respiro per frasi: nota tenuta = si dispiega (lento, secondi), pausa = si ripiega
  spring(this,'open',on?cl(.25+this.age*.35,0,1):0,dt,1.1,1.9);
  spring(this,'wrap',.7+.6*(1-this.open)+.2*this.pn-.35*this.calm,dt,2.2,2.4);  // legato = più lungo/avvolto; silenzio = si arrotola
  spring(this,'tw',(on?.8+1.0*this.pn:.5)+.4*Math.abs(this.slS||0),dt,1.2,1.6);              // avvitamento
  { // v20 AVVITAMENTI: verso scelto una volta per frase (gdir), lo slope di pitch (filtrato lento) modula solo l'intensità; velocità con easing e limiti di vel/acc
   const DT=DOMA[this.livello|0]||DOMA[0];this.slS=lerp(this.slS||0,this.slope,cl(dt*.6));const sg=this.gdir||1,wT=sg*(.12+.35*Math.min(1,Math.abs(this.slS))+.6*this.gest)*(.5+.5*DT.cv)*(on?1:.5);
   const am=.5,wm=.55*(.6+.4*DT.cv);const dw=cl(wT-(this.tww||0),-am*dt,am*dt);this.twa=lerp(this.twa||0,dw/dt,cl(dt*3));this.tww=cl((this.tww||0)+this.twa*dt,-wm,wm);this.twd+=this.tww*dt;
   const H=this.twH||(this.twH=new Float32Array(96).fill(this.twd));this.twI=((this.twI||0)+1)%96;H[this.twI]=this.twd;this.pulS=lerp(this.pulS||0,this.pul||0,cl(dt*1.2));}
  for(const k of this.kinks)k.a*=Math.exp(-dt*2.2);
  const rm=this.rmF?.15:1;this.flow+=dt*rm*(.18+.55*this.ld);this.rot+=dt*rm*(.08+.15*this.ld);
  this.sm=lerp(this.sm,this.it,cl(dt*2));this.calm=lerp(this.calm||0,cl((1-this.ld*1.4)*(1-Math.abs(this.slope)*1.5)*(on?1:.7)),cl(dt*.8)); // suono calmo = un gesto unico, avvolgimento semplice
  // volontà di muoversi: volume/attacco = spinta e compattezza della testa; nota tenuta = la testa guida e il corpo si distende (ritardo maggiore); silenzio = la testa si scioglie
  spring(this,'push',on?.45+.55*this.ld:0,dt,on?9:2.5,on?4:2.6);spring(this,'lag',.35+.9*this.open,dt,2,2.4);if(this.ant>0)this.pushv-=dt*6;
  this.brain(dt,on);
 },

 // ── il 'cervello': agente con intenzione (seek + wander deciso), il velo è la catena trascinata dietro di lui ──
 pick(phrase){const B=this.B||[0,0,0],r=Math.hypot(B[0],B[2]);let turn=(phrase?.45+.5*Math.random():.12+.22*Math.random())*(this.tsg=(phrase&&Math.random()<.5?-1:1)*(this.tsg||1)); // una decisione di rotta per frase; dentro la frase solo correzioni lievi nello stesso verso
  if(r>.6){const back=Math.atan2(-B[2],-B[0]);let d=back-this.hdg;d=Math.atan2(Math.sin(d),Math.cos(d));turn=cl(d,-1.2,1.2);}  // ai margini rientra con una curva ampia
  this.hdg+=turn;this.tk=phrase?3.5+2*Math.random():2.5+3*this.open+Math.random();},
 brain(dt,on){if(!this.B){this.B=[0,0,0];this.yaw=this.hdg=0;this.spd=.1;for(let i=0;i<NU;i++){CH[i*3]=CO[i*3]=-i*.6/NU;CH[i*3+1]=CO[i*3+1]=0;CH[i*3+2]=CO[i*3+2]=0;}}
  const B=this.B,V=this.V;this.tk-=dt;
  // DOMARE: suono sostenuto, pieno e intonato = domato; stonatura = si ribella; silenzio = torna lentamente selvatico
  const DP=DOMA[this.livello|0]||DOMA[0];const tT=on?cl((DP.base+DP.lw*this.ld)*Math.pow(this.st,1.5)*Math.min(1,.3+(this.pA||0)/DP.hold)*(1-.6*(this.err||0))):0;
  this.tame=lerp(this.tame,tT,cl(dt*(tT>this.tame?DP.su:on?1.2:DP.giu)));if(this.res>0)this.res-=dt;const wild=(1-this.tame)*DP.cv;if(on&&this.tk<=0)this.pick(0);
  // rotta: l'imbardata insegue la rotta scelta con velocità angolare limitata (curve ampie, niente scatti)
  {const rr=Math.hypot(B[0],B[2]);if(rr>.55){let e=Math.atan2(-B[2],-B[0])-this.hdg;e=Math.atan2(Math.sin(e),Math.cos(e));this.hdg+=cl(e,-1,1)*dt*.5*Math.min(1,(rr-.55)*4);}}  // guinzaglio morbido verso il centro
  if(this.hs==null)this.hs=this.hdg;{let e=this.hdg-this.hs;e=Math.atan2(Math.sin(e),Math.cos(e));this.hs+=e*cl(dt*.8);}  // la rotta scelta si sposta in modo smussato (filtro), mai a salti
  if((this.wall||0)>.8&&this.cam){let e=Math.atan2(this.cam[2]-B[2],this.cam[0]-B[0])-this.hdg;e=Math.atan2(Math.sin(e),Math.cos(e));this.hdg+=cl(e,-1,1)*dt*1.2*Math.min(1,((this.wall||0)-.8)*6);}  // sterza prima della parete
  let d=this.hs-this.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));const wmax=(.35+.45*(this.lv||0))*Math.min(1,(this.spd+.05)/.35);  // velocità angolare limitata e legata alla velocità → raggio minimo ampio
  const ya=(wmax*(.55+.45*DP.cv)*Math.tanh(d*1.5)-(this.yr||0))*1.4;this.ya=lerp(this.ya||0,ya,cl(dt*2));this.yr=(this.yr||0)+this.ya*dt;this.yaw+=this.yr*dt;  // rotazione con easing: accelera e decelera, senza gradini
  // velocità: loudness = spinta, con easing; attacco = arretra appena (anticipation) poi spinta in avanti sulla stessa rotta
  let st=on?.14+.42*this.ld:.05+.05*wild;if(this.res>0)st=-.12*Math.sin(Math.PI*this.res/.35);if(this.ant>0)st=.03;this.spd=lerp(this.spd,st,cl(dt*(st>this.spd?1.6:1.1)))+(this.kick||0)*dt;this.kT=(this.kT||0)*Math.exp(-dt*2.5);this.kick=lerp(this.kick||0,this.kT,cl(dt*4));
  const ty=on?(this.pn-.5)*.8:B[1];this.tyS=lerp(this.tyS==null?ty:this.tyS,ty,cl(dt*1.2));this.vy=lerp(this.vy||0,.35*Math.tanh((this.tyS-B[1])*4),cl(dt*1.5));      // pitch = altezza del bersaglio
  const eT=on?cl((1-this.st)*1.3*(DOMA[this.livello|0]||DOMA[0]).fr):0;this.err=lerp(this.err||0,eT,cl(dt*(eT>(this.err||0)?6:1.2)));  // errore d'intonazione: fremito (non tocca la rotta); si placa lentamente
  if(this.err-(this.errP||0)>.04)this.jv=(this.jv||0)+(this.err-(this.errP||0))*1.5*DP.cv;this.errP=this.err;this.jo=(this.jo||0)+(this.jv||0)*dt;this.jv=((this.jv||0)-this.jo*60*dt)*Math.exp(-dt*7);  // strattone che si assorbe            // intonazione instabile = esitazione lieve
  const tx=Math.cos(this.yaw),tz=Math.sin(this.yaw)*.8;
  V[0]=lerp(V[0],tx*this.spd,cl(dt*3));V[2]=lerp(V[2],tz*this.spd,cl(dt*3));V[1]=this.vy;
  {const q=wild*(.12+.1*(this.res>0)),T=this.tt*.4;V[0]+=q*(Math.sin(T*1.7)+.6*Math.sin(T*3.9+1))*dt*3;V[1]+=q*(Math.sin(T*2.3+2)+.5*Math.sin(T*5.1))*dt*2;V[2]+=q*(Math.cos(T*1.9)+.6*Math.sin(T*4.4+3))*dt*3;}  // selvatico: ribollire caotico ma organico, trattenuto  // silenzio: si ferma a 'pensare'
  B[0]+=V[0]*dt;B[1]+=V[1]*dt;B[2]+=V[2]*dt;const cm=this.cam||(this.cam=[0,0,0]);for(let a=0;a<3;a++)cm[a]=lerp(cm[a],B[a],cl(dt*.5));
  this.pul=(this.pres||0)<.6?(Math.sin(this.tt*1.6)*.6+.4*Math.sin(this.tt*2.9))*(1-(this.pres||0)):(this.err||0)>.15?Math.sin(this.tt*57)*Math.min(1,this.err*1.5)*(DOMA[this.livello|0]||DOMA[0]).cv*(DOMA[this.livello|0]||DOMA[0]).cv:this.vib>.02?Math.sin(this.tt*34)*Math.min(1,this.vib*2)*(DOMA[this.livello|0]||DOMA[0]).cv:.35*Math.sin(this.tt*2.6); // vibrato = pulsazione del nucleo
  const g=on?0:cl(this.sil*.7);this.len=lerp(this.len,(on?(1.5+1.1*this.open)*(.85+.3*this.ld):.7)*(.6+.4*this.tame),cl(dt*(on?.9:.6)));  // nota tenuta: si distende; silenzio: si raccoglie
  const seg=this.len/(NU-1),N=2;
  for(let n=0;n<N;n++){CH[0]=B[0];CH[1]=B[1];CH[2]=B[2];const h=dt/N;
   for(let i=1;i<NU;i++){const k=i*3;for(let a=0;a<3;a++){const v=(CH[k+a]-CO[k+a])*.985;CO[k+a]=CH[k+a];CH[k+a]+=v;}  // inerzia: follow-through
    if(g>0){const rx=CH[k]-B[0],rz=CH[k+2]-B[2],w=g*h*(1.2+i/NU*1.5);const ws=w*.35*(.4+.6*(DOMA[this.livello|0]||DOMA[0]).cv),dy=(B[1]-CH[k+1])*g*h*.8;CH[k]+=-rz*ws;CH[k+2]+=rx*ws;CH[k+1]+=dy;CO[k]+=-rz*ws;CO[k+2]+=rx*ws;CO[k+1]+=dy;}}  // v20: avvolgimento come spostamento, NON iniettato nell'inerzia (prima la verlet lo accumulava ~60× → frullata nel silenzio)  // si avvolge attorno al nucleo
   for(let i=1;i<NU-1;i++){const k=i*3;for(let a=0;a<3;a++)CH[k+a]+=(.5*(CH[k-3+a]+CH[k+3+a])-CH[k+a])*.45;}
   for(let i=NU-2;i>0;i--){const k=i*3;for(let a=0;a<3;a++)CH[k+a]+=(.5*(CH[k-3+a]+CH[k+3+a])-CH[k+a])*.45;}
   for(let i=1;i<NU;i++){const k=i*3;let x=CH[k]-CH[k-3],y=CH[k+1]-CH[k-2],z=CH[k+2]-CH[k-1];const d=Math.hypot(x,y,z)||1;CH[k]=CH[k-3]+x/d*seg;CH[k+1]=CH[k-2]+y/d*seg;CH[k+2]=CH[k-1]+z/d*seg;}}
 },
 build(w,h){const t=this.flow,tt=this.tt,A=w/h,wr=this.wrap,sm=(1.3-.5*this.sm)*(1-.45*this.calm);
  const rc=Math.cos(this.rot),rs=Math.sin(this.rot),tl=.35+.15*Math.sin(t*.3);const tc=Math.cos(tl),ts=Math.sin(tl);
  let mnx=9,mxx=-9,mny=9,mxy=-9;
  for(let l=0;l<NL;l++){const L0=l*NVERT;
  // curva centrale 3D (spirale morbida + rumore a più frequenze, niente loop)
  for(let i=0;i<NU;i++){const u=i/(NU-1),t=this.flow-(1-u)*this.lag,a=(u-.5)*Math.PI*wr*(1+.12*l)+t*.4+l*(.9+.6*this.gest);
   const c3=(NU-1-i)*3,ro=.035*l*(1-.85*u)*(1+.5*this.gest),rp=a*1.3+l*2.1;
   const cm=this.cam||[0,0,0],er=(this.err||0),hz=er*Math.pow(cl((u-.55)/.45),2),jx=hz*.018*Math.sin(tt*47+u*23+l),jy=hz*.014*Math.sin(tt*53-u*19+l*2)+(this.jo||0)*.05*u*u,jz=hz*.016*Math.sin(tt*41+u*29);const vo=1-(this.pres||0),wb=(1-this.tame)*.05*(1+vo),bo=tt*2.7,pf=vo*.3*Math.pow(Math.max(0,Math.sin(tt*1.1+u*7+l*2.3)),6)*(1-u*.6);let x=jx+pf*Math.sin(u*5+l*1.7+tt*.3)+wb*(Math.sin(u*11+bo+l)+.5*Math.sin(u*23-bo*1.6))+CH[c3]-cm[0]+ro*Math.cos(rp)+sm*.025*Math.sin(u*7.3-t*1.1+l);
   let y=jy+pf*Math.cos(u*6.3+l)+wb*(Math.sin(u*13-bo*1.2+2)+.5*Math.sin(u*19+bo*1.9))+CH[c3+1]-cm[1]+ro*Math.sin(rp)+sm*.02*Math.sin(u*9.1+t*1.3);
   let z=jz+pf*Math.sin(u*3.7+2+l)+wb*Math.sin(u*9+bo*1.4+4)+CH[c3+2]-cm[2]+ro*.8*Math.sin(rp+1.3)+sm*.02*Math.sin(u*5.3+t*.9+2);
   for(const k of this.kinks){const d=(u-k.u)/.035;const g=Math.exp(-d*d)*k.a*k.s*.07;x+=g;z-=g;}
   C[i*3]=x;C[i*3+1]=y;C[i*3+2]=z;}
  {const S=this.CS||(this.CS=new Float32Array(NL*NU*3)),o=l*NU*3,k=this.CSi?1-Math.exp(-(this.dtL||1/60)*14):1;for(let j=0;j<NU*3;j++){S[o+j]+=(C[j]-S[o+j])*k;C[j]=S[o+j];}if(l===NL-1)this.CSi=1;}  // v20b: passa-basso temporale della curva (~70 ms): niente tangenti che si ribaltano
  {let px=this.N0x||0,py=this.N0y||1,pz=this.N0z||0;for(let i=NU-1;i>=0;i--){const i0=Math.max(0,i-3),i1=Math.min(NU-1,i+3);let Tx=C[i1*3]-C[i0*3],Ty=C[i1*3+1]-C[i0*3+1],Tz=C[i1*3+2]-C[i0*3+2];const q=Math.hypot(Tx,Ty,Tz)||1;Tx/=q;Ty/=q;Tz/=q;
   const d=px*Tx+py*Ty+pz*Tz;px-=d*Tx;py-=d*Ty;pz-=d*Tz;const n=Math.hypot(px,py,pz);if(n<1e-3){px=this.PNs?this.PNs[l*NU*3+i*3]:-Tz;py=this.PNs?this.PNs[l*NU*3+i*3+1]:0;pz=this.PNs?this.PNs[l*NU*3+i*3+2]:Tx;}else{px/=n;py/=n;pz/=n;}
   {const S=this.PNs||(this.PNs=new Float32Array(NL*NU*3)),o=l*NU*3+i*3;if(S[o]||S[o+1]||S[o+2]){let qx=S[o],qy=S[o+1],qz=S[o+2];if(qx*px+qy*py+qz*pz<0){px=-px;py=-py;pz=-pz;}px=lerp(qx,px,.3);py=lerp(qy,py,.3);pz=lerp(qz,pz,.3);const e=px*Tx+py*Ty+pz*Tz;px-=e*Tx;py-=e*Ty;pz-=e*Tz;const m=Math.hypot(px,py,pz)||1;px/=m;py/=m;pz/=m;}S[o]=px;S[o+1]=py;S[o+2]=pz;}/* v20: frame senza flip */TN[i*6+3]=px;TN[i*6+4]=py;TN[i*6+5]=pz;
   if(i===NU-1&&l===0){this.T0=[Tx,Ty,Tz];this.N0x=px;this.N0y=py;this.N0z=pz;}}}
  for(let i=0;i<NU;i++){const u=i/(NU-1),t=this.flow-(1-u)*this.lag,i0=Math.max(0,i-1),i1=Math.min(NU-1,i+1);
   let Tx=C[i1*3]-C[i0*3],Ty=C[i1*3+1]-C[i0*3+1],Tz=C[i1*3+2]-C[i0*3+2];const tl2=Math.hypot(Tx,Ty,Tz)||1;Tx/=tl2;Ty/=tl2;Tz/=tl2;
   // riferimento: asse verticale → N0 ⟂ T
   let Nx=TN[i*6+3],Ny=TN[i*6+4],Nz=TN[i*6+5];{const d=Nx*Tx+Ny*Ty+Nz*Tz;Nx-=d*Tx;Ny-=d*Ty;Nz-=d*Tz;const nl=Math.hypot(Nx,Ny,Nz)||1;Nx/=nl;Ny/=nl;Nz/=nl;}
   const Bx=Ty*Nz-Tz*Ny,By=Tz*Nx-Tx*Nz,Bz=Tx*Ny-Ty*Nx;
   const ph=(this.twH?this.twH[(this.twI-Math.round((1-u)*60)+960)%96]:this.twd)+l*(.7+1.2*this.gest)+this.tw*(u-.5)*Math.PI+.4*Math.sin(u*2.3+t*.5)+(2.6+.3*(DOMA[this.livello|0]||DOMA[0]).cv*(this.pulS||0))*Math.pow(cl((u-.8)/.2),2)*(.8+.2*cl(this.push,0,1));const cp=Math.cos(ph),sp=Math.sin(ph);
   const Dx=cp*Nx+sp*Bx,Dy=cp*Ny+sp*By,Dz=cp*Nz+sp*Bz;            // direzione della larghezza
   const Sx=Ty*Dz-Tz*Dy,Sy=Tz*Dx-Tx*Dz,Sz=Tx*Dy-Ty*Dx;            // normale del foglio
   let wv=0;for(const W of this.waves){const age=tt-W.t;if(age<2){const d=(u-age*.6)/.09;wv+=W.a*Math.exp(-d*d)*(1-age/2)*.06;}}
   const nuc=Math.exp(-Math.pow((u-.9)/.05,2)),ws=[1,.45,.32,.28][l]*(1+(.55+.15*this.pul)*nuc)*(l?1-.6*u*cl(this.push,0,1):1),su=Math.sin(Math.PI*u),taper=ws*Math.pow(su,.7)*(.75+(.3+.5*cl(this.push,0,1.3))*u),wid=this.W*(.55+.45*(this.lv||0))*taper*(1+.25*Math.sin(u*4.1+t*.8))*(1+this.vib*.09*(DOMA[this.livello|0]||DOMA[0]).cv*Math.sin(u*55-tt*32));
   const th=wid*(.09+.13*(this.lv||0)+.12*(1-(this.pres||0)))*(.5+.9*Math.pow(u,1.5))*Math.pow(su,.45)*(l?.7:1);  // SPESSORE: lastra a sezione lenticolare; forte = più corposa, silenzio = compatta e densa, testa più spessa, coda sottile
   for(let j=0;j<NV;j++){const ang=j/NV*TAU,v=.5*Math.cos(ang),sn=Math.sin(ang);let cup=(v*v-.08)*wid*(1.2+2.*u)*(1.5-this.open*.8)*(1+.4*Math.sin(t*.7+u*3)); // il foglio si incurva come un petalo
    const mw=wid*(.006+.022*this.vib+.016*(1-this.sm)+.006*this.ld)*Math.sin(v*Math.PI*5+1.2*Math.sin(u*7+t*.9+l)+u*4)*su*(1+.6*this.vib*(DOMA[this.livello|0]||DOMA[0]).cv*Math.sin(u*40-tt*(6+10*this.vib)));cup+=mw+wid*(this.err||0)*.05*v*v*4*Math.sin(u*90+v*7-tt*38+l)*(.4+.6*u); // micro-pieghe: vibrato e rugosità increspano il foglio
    const ns=cup+wv+sn*th*(1-.35*v*v*4);let px=C[i*3]+Dx*v*wid+Sx*ns,py=C[i*3+1]+Dy*v*wid+Sy*ns,pz=C[i*3+2]+Dz*v*wid+Sz*ns;
    const x1=px*rc+pz*rs,z1=-px*rs+pz*rc,y2=py*tc-z1*ts,z2=py*ts+z1*tc;const f=1/(1+z2*.35);
    const k=(L0+i*NV+j)*3;SC[k]=x1*f;SC[k+1]=y2*f;SC[k+2]=z2;POS[k]=px;POS[k+1]=py;POS[k+2]=pz;
    if(SC[k]<mnx)mnx=SC[k];if(SC[k]>mxx)mxx=SC[k];if(SC[k+1]<mny)mny=SC[k+1];if(SC[k+1]>mxy)mxy=SC[k+1];}}
  // normali in spazio schermo (differenze finite sulla griglia proiettata)
  for(let i=0;i<NU;i++)for(let j=0;j<NV;j++){const k=(L0+i*NV+j)*3,a=(L0+Math.min(NU-1,i+1)*NV+j)*3,b=(L0+Math.max(0,i-1)*NV+j)*3,c=(L0+i*NV+(j+1)%NV)*3,d=(L0+i*NV+(j+NV-1)%NV)*3;
   const ux=SC[a]-SC[b],uy=SC[a+1]-SC[b+1],uz=SC[a+2]-SC[b+2],vx=SC[c]-SC[d],vy=SC[c+1]-SC[d+1],vz=SC[c+2]-SC[d+2];
   let nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;const l=Math.hypot(nx,ny,nz)||1;NOR[k]=nx/l;NOR[k+1]=ny/l;NOR[k+2]=-nz/l;}
  // curvatura per vertice (variazione della normale) codificata nella lunghezza della normale → creste nitide e continue
  for(let i=0;i<NU;i++)for(let j=0;j<NV;j++){const k=(L0+i*NV+j)*3,a=(L0+Math.min(NU-1,i+1)*NV+j)*3,b=(L0+Math.max(0,i-1)*NV+j)*3,c=(L0+i*NV+(j+1)%NV)*3,d=(L0+i*NV+(j+NV-1)%NV)*3;
   const cu=Math.hypot(NOR[a]-NOR[b],NOR[a+1]-NOR[b+1],NOR[a+2]-NOR[b+2])*NU/300,cv2=Math.hypot(NOR[c]-NOR[d],NOR[c+1]-NOR[d+1],NOR[c+2]-NOR[d+2])*NV/40;CUR[(L0+i*NV+j)]=Math.min(4,Math.max(cu,cv2)*14);}
  for(let q=L0;q<L0+NVERT;q++){const s=1+CUR[q];NOR[q*3]*=s;NOR[q*3+1]*=s;NOR[q*3+2]*=s;}
  }
  // inquadratura: il foglio occupa ~60% dell'altezza, resta nei margini (molle lente)
  const bw=mxx-mnx,bh=mxy-mny,fit=Math.min(.84*2/bh,.72*2*A/bw);
  // vicinanza dal volume (piano = mezza distanza, forte = riempie l'acquario); lo schermo è il vetro: mai fuori
  const fz=Math.min(fit*(.17+.06*this.tame+(this.pres||0)*(.27+.55*(this.lv||0))),fit*1.0);{const h=Math.min(this.dtL||1/60,.05);if(!this.fs){this.fs=fz;this.fv=0;}const w=2.2;this.fv+=(w*w*(fz-this.fs)-2*w*this.fv)*h;const vm=.35*fit;this.fv=cl(this.fv,-vm,vm);this.fs+=this.fv*h;}
  {const h=Math.min(this.dtL||1/60,.05),w=1.6;for(const[k,v,t]of[['ox','oxv',-(mnx+mxx)/2],['oy','oyv',-(mny+mxy)/2]]){this[k]=this[k]||0;this[v]=this[v]||0;this[v]+=(w*w*(t-this[k])-2*w*this[v])*h;this[v]=cl(this[v],-.4,.4);this[k]+=this[v]*h;}}
  {const M=.95,ex=Math.max((mxx+this.ox)*this.fs/A,-(mnx+this.ox)*this.fs/A),ey=Math.max((mxy+this.oy)*this.fs,-(mny+this.oy)*this.fs),e=Math.max(ex,ey);
   if(e>M){const cx=-(mnx+mxx)/2,cy=-(mny+mxy)/2;this.ox=lerp(this.ox,cx,.06);this.oy=lerp(this.oy,cy,.06);}  // vicino al vetro: si ricentra più deciso
   this.wall=e;}
  const sc=(x,K,Lm)=>{const a=Math.abs(x);return a<K?x:Math.sign(x)*(K+(Lm-K)*Math.tanh((a-K)/(Lm-K)));};  // il velo si adagia sul vetro e si ripiega, mai tagliato
  let ex=0;
  for(let k=0;k<NVT*3;k+=3){POS[k]=sc((SC[k]+this.ox)*this.fs/A,.84,.965);POS[k+1]=sc((SC[k+1]+this.oy)*this.fs,.84,.965);POS[k+2]=cl(SC[k+2]*.4,-.99,.99);const q=Math.max(Math.abs(POS[k]),Math.abs(POS[k+1]));if(q>ex)ex=q;}this.ext=ex;
 },
 draw(g,w,h,pal){pal=Object.assign({},P0,pal||{});this.rmF=!!pal.rm;this.build(w,h);
  if(this.gl===undefined)this.gl=mkGL();if(!this.gl)return this.draw2d(g,w,h,pal);
  const {cv,gl,U,B,ni}=this.gl,now=performance.now();
  // risoluzione adattiva: 1x finché il frame resta sotto ~16 ms, poi scende (min 0.5x) e risale se c'è margine
  if(this.lt){const ft=Math.min(now-this.lt,100);this.ema=lerp(this.ema||16,ft,.08);this.cool=(this.cool||0)-1;
   if(this.cool<=0&&this.ema>16.9&&(this.k||1)>.35){this.k=Math.max(.35,(this.k||1)-.1);this.cool=30;}
   else if(this.cool<=0&&this.ema<12&&(this.k||1)<1){this.k=Math.min(1,(this.k||1)+.05);this.cool=60;}}this.lt=now;
  const k=this.forceK||this.k||1,W=Math.round(w*k),H=Math.round(h*k);if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}
  gl.viewport(0,0,W,H);gl.clearColor(0,0,0,0);gl.disable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.bindBuffer(gl.ARRAY_BUFFER,B.P);gl.bufferData(gl.ARRAY_BUFFER,POS,gl.DYNAMIC_DRAW);gl.bindBuffer(gl.ARRAY_BUFFER,B.N);gl.bufferData(gl.ARRAY_BUFFER,NOR,gl.DYNAMIC_DRAW);
  const VPx=pal.kids?VPk:VP;gl.uniform3fv(U.cM,hx(VPx.M));const K=hx(VPx.K),D=hx(VPx.D),L=hx(VPx.L),Wc=hx(VPx.W);
  gl.uniform3fv(U.cK,K);gl.uniform3fv(U.cW,Wc);gl.uniform1f(U.R1,H*.012);
  gl.uniform3fv(U.cD,D);gl.uniform3fv(U.cL,L);gl.uniform3fv(U.cB,hx(pal.bg));gl.uniform1f(U.bal,(this.it-.6)*.35);gl.uniform1f(U.kids,pal.kids?1:0);
  gl.uniform1f(U.shine,.4+.5*this.sm);gl.uniform1f(U.fade,.9+.1*this.on);gl.uniform1f(U.head,cl(.35+.65*Math.max(this.push,this.lv||0),0,1));gl.uniform1f(U.pul,this.pul);gl.uniform1f(U.grain,GRANA);gl.uniform1f(U.vul,1-(this.pres||0));
  { // trasparenza per-pixel: weighted blended OIT (niente ordinamento, niente cuciture seghettate)
   const O=this.gl.oit;if(O.w!==W||O.h!==H){O.w=W;O.h=H;for(const [t,f] of [[O.tA,O.fA],[O.tR,O.fR]]){gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA16F,W,H,0,gl.RGBA,gl.HALF_FLOAT,null);
     gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);}}
   gl.useProgram(this.gl.pr);gl.bindVertexArray(O.mvao);gl.enable(gl.DEPTH_TEST);gl.depthMask(false);gl.depthFunc(gl.ALWAYS);
   gl.bindFramebuffer(gl.FRAMEBUFFER,O.fA);gl.viewport(0,0,W,H);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.blendFunc(gl.ONE,gl.ONE);gl.uniform1f(U.pass,0);gl.drawElements(gl.TRIANGLES,ni,gl.UNSIGNED_INT,0);
   gl.bindFramebuffer(gl.FRAMEBUFFER,O.fR);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.blendFunc(gl.ZERO,gl.ONE_MINUS_SRC_ALPHA);gl.uniform1f(U.pass,1);gl.drawElements(gl.TRIANGLES,ni,gl.UNSIGNED_INT,0);
   gl.disable(gl.DEPTH_TEST);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.disable(gl.BLEND);
   gl.useProgram(O.cp);gl.bindVertexArray(O.vao);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,O.tA);gl.uniform1i(O.uA,0);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,O.tR);gl.uniform1i(O.uR,1);
   gl.drawArrays(gl.TRIANGLE_STRIP,0,4);gl.bindVertexArray(null);gl.useProgram(this.gl.pr);gl.enable(gl.BLEND);}
  // alone morbido: copia ridotta 1/8 e riallargata (blur economico) sotto la versione nitida
  const sm=this.sml||(this.sml=document.createElement('canvas')),sw=Math.ceil(w/10),shh=Math.ceil(h/10);if(sm.width!==sw||sm.height!==shh){sm.width=sw;sm.height=shh;}
  const src=cv.transferToImageBitmap?cv.transferToImageBitmap():cv;this.hf=((this.hf||0)+1)%4;if(!this.noHalo&&(this.hf===1||this.forceK)){const x=sm.getContext('2d');x.clearRect(0,0,sw,shh);x.imageSmoothingQuality='high';x.drawImage(src,0,0,sw,shh);} // alone aggiornato 1 frame su 4 (costo)
  g.save();g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';if(!this.noHalo){g.globalAlpha=.45;g.drawImage(sm,-w*.01,-h*.01,w*1.02,h*1.02);}g.globalAlpha=1;g.drawImage(src,0,0,w,h);g.restore();if(src.close)src.close();},
 draw2d(g,w,h,pal){ // fallback: quad ordinati per profondità, colore per luce
  const D=pal.accent,L=pal.gold,q=[];for(let i=0;i<NU-1;i+=2)for(let j=0;j<NV-1;j+=2){const k=(i*NV+j)*3;q.push([POS[k+2],i,j]);}q.sort((a,b)=>b[0]-a[0]);
  const X=k=>(POS[k]*.5+.5)*w,Y=k=>(.5-POS[k+1]*.5)*h;g.save();for(const [z,i,j] of q){const a=(i*NV+j)*3,b=((i+2)*NV+j)*3,c=((i+2)*NV+j+2)*3,d=(i*NV+j+2)*3;
   const l=cl(-NOR[a]*.45+NOR[a+1]*.65+.5);g.globalAlpha=.9*Math.sin(Math.PI*i/NU);g.fillStyle=l>.5?L:D;g.beginPath();g.moveTo(X(a),Y(a+1));g.lineTo(X(b),Y(b+1));g.lineTo(X(c),Y(c+1));g.lineTo(X(d),Y(d+1));g.fill();}g.restore();}
};
velo.livello=DOMA_I;velo.livelli=DOMA;velo.setLivello=function(x){const i=typeof x==='number'?x:DOMA.findIndex(d=>d.id===x||d.k===x);if(i>=0&&i<3)this.livello=i;return this.livello;}; // skin.livello 0/1/2 o skin.setLivello('principiante'|'facile'|...)
velo.reset();velo.noHalo=!/[?&]halo/.test(location.search);if(/[?&]render/.test(location.search))velo.forceK=1; // render offline: sempre 1x
PALCO.register('forma','ampia',{livelli:DOMA.map(d=>({id:d.id,k:d.k})),label:'Velo',kidsLabel:'Nastro magico',icon:'∞',autore:'generativo',skin:velo});
{const FG=window.FORME_GENERATIVO;if(Array.isArray(FG))FG.push('ampia');else if(FG&&FG.forme)FG.forme.push('ampia');}
})();
