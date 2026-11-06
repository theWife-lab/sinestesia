/* Registro PALCO minimale: solo quanto serve a generativo/forma-ampia.js (Velo). */
window.PALCO={voci:{forma:[],colori:[],sfondo:[]},register(c,id,o){const R=this.voci[c];if(!R)return;o=Object.assign({id,cat:c},o);const i=R.findIndex(v=>v.id===id);i>=0?R[i]=o:R.push(o);},onRegister(){}};
