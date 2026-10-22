
(()=>{
'use strict';
const worlds=[
  {name:'Bosque alpino de Nivalia',ground:'#50874c',ground2:'#315c3d',ground3:'#203f30',soil:'#59744a',mountain1:'#a9b9b7',mountain2:'#7b9098',mountain3:'#526b76',top:'#eaf5ff',trunk:'#66503a',leaf:'#2f6347',leaf2:'#579065',flora:'pine',water:null,rock:'#768075',accent:'#a9d28b',sky:'#d7e8ff'},
  {name:'Costas tropicales de Azurea',ground:'#51985c',ground2:'#2a744f',ground3:'#20523e',soil:'#b49c65',mountain1:'#8fa79b',mountain2:'#698b77',mountain3:'#426e62',top:'#e5f3eb',trunk:'#7a5033',leaf:'#158c5b',leaf2:'#6cbd78',flora:'palm',water:'#3fc0d2',rock:'#6b857b',accent:'#f5d996',sky:'#cef5ff'},
  {name:'Desiertos rojos de Aridia',ground:'#c58b54',ground2:'#a96740',ground3:'#7d4936',soil:'#d1a26a',mountain1:'#c78d66',mountain2:'#a56a4c',mountain3:'#824d38',top:'#dbad8d',trunk:'#76543d',leaf:'#83904e',leaf2:'#a9a564',flora:'desert',water:null,rock:'#885b43',accent:'#e0b274',sky:'#ffdfbd'},
  {name:'Valle de cristales de Aurelia',ground:'#8563b4',ground2:'#63488f',ground3:'#412c69',soil:'#b48bd4',mountain1:'#b0a1d9',mountain2:'#8571bf',mountain3:'#5c4b91',top:'#f4d9ff',trunk:'#65539c',leaf:'#82d5da',leaf2:'#cd8ff7',flora:'crystal',water:'#71d2ec',rock:'#74609e',accent:'#eea3fd',sky:'#f7cafd'},
  {name:'Bosques luminosos de Mycoris',ground:'#26575a',ground2:'#193d4b',ground3:'#132e3b',soil:'#43636c',mountain1:'#6685a0',mountain2:'#4a668a',mountain3:'#31476f',top:'#b7c5ed',trunk:'#8a9de2',leaf:'#4fc9c8',leaf2:'#bd82f9',flora:'mushroom',water:'#37d1d3',rock:'#44647b',accent:'#92f5db',sky:'#7b85cf'}
];
function rng(seed){let x=seed>>>0;return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};}
const fmt=n=>Number(n).toFixed(1);
function esc(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function tree(x,y,h,w,r,depth){
  const trunk=w.trunk,leaf=w.leaf,leaf2=w.leaf2, shade=w.ground3;
  const op=depth===0?.56:depth===1?.75:.96;
  if(w.flora==='pine'){
    let out=`<g opacity="${op}"><path d="M${fmt(x-2)} ${fmt(y)}L${fmt(x+2)} ${fmt(y)}L${fmt(x+2)} ${fmt(y-h*.78)}L${fmt(x-2)} ${fmt(y-h*.78)}Z" fill="${trunk}"/>`;
    for(let k=0;k<4;k++){
      const yy=y-h*(.12+k*.18), yyTop=y-h*(.45+k*.155),spread=h*(.25-k*.038);
      out+=`<path d="M${fmt(x-spread)} ${fmt(yy)}Q${fmt(x-spread*.44)} ${fmt(yy-h*.06)} ${fmt(x)} ${fmt(yyTop)}Q${fmt(x+spread*.44)} ${fmt(yy-h*.06)} ${fmt(x+spread)} ${fmt(yy)}Z" fill="${k%2?leaf2:leaf}"/><path d="M${fmt(x-spread*.5)} ${fmt(yy-h*.025)}L${fmt(x)} ${fmt(yyTop+h*.13)}" stroke="${shade}" stroke-width=".8" opacity=".25"/>`;
    }return out+'</g>';
  }
  if(w.flora==='palm'){
    const bend=h*.13, xt=x+bend;    let out=`<g opacity="${op}"><path d="M${fmt(x-3)} ${fmt(y)}Q${fmt(x+2)} ${fmt(y-h*.44)} ${fmt(xt)} ${fmt(y-h)}L${fmt(xt+5)} ${fmt(y-h)}Q${fmt(x+8)} ${fmt(y-h*.45)} ${fmt(x+3)} ${fmt(y)}Z" fill="${trunk}"/>`;
    for(let k=0;k<8;k++){
      let a=k*Math.PI/4,dx=Math.cos(a)*h*.38,dy=Math.sin(a)*h*.16;
      out+=`<path d="M${fmt(xt+1)} ${fmt(y-h)}Q${fmt(xt+dx*.6)} ${fmt(y-h+dy-h*.08)} ${fmt(xt+dx)} ${fmt(y-h+dy+h*.13)}Q${fmt(xt+dx*.58)} ${fmt(y-h+dy*.7+h*.03)} ${fmt(xt+1)} ${fmt(y-h)}Z" fill="${k%2?leaf:leaf2}"/>`;
    }return out+'</g>';
  }
  if(w.flora==='desert'){
    if(r()<.42)return `<g opacity="${op}"><path d="M${fmt(x-3)} ${fmt(y)}L${fmt(x+4)} ${fmt(y)}L${fmt(x+4)} ${fmt(y-h*.78)}Q${fmt(x)} ${fmt(y-h)} ${fmt(x-4)} ${fmt(y-h*.78)}Z" fill="${leaf}"/><path d="M${fmt(x-2)} ${fmt(y-h*.40)}Q${fmt(x-h*.25)} ${fmt(y-h*.4)} ${fmt(x-h*.23)} ${fmt(y-h*.7)}" stroke="${leaf2}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M${fmt(x+2)} ${fmt(y-h*.55)}Q${fmt(x+h*.26)} ${fmt(y-h*.5)} ${fmt(x+h*.24)} ${fmt(y-h*.76)}" stroke="${leaf}" stroke-width="4" fill="none" stroke-linecap="round"/></g>`;
    return `<g opacity="${op}"><path d="M${fmt(x-2)} ${fmt(y)}Q${fmt(x+1)} ${fmt(y-h*.6)} ${fmt(x)} ${fmt(y-h*.8)}" stroke="${trunk}" stroke-width="4" fill="none"/><ellipse cx="${fmt(x)}" cy="${fmt(y-h*.79)}" rx="${fmt(h*.31)}" ry="${fmt(h*.19)}" fill="${leaf}"/><ellipse cx="${fmt(x+h*.1)}" cy="${fmt(y-h*.85)}" rx="${fmt(h*.19)}" ry="${fmt(h*.12)}" fill="${leaf2}"/></g>`;
  }
  if(w.flora==='crystal'){
    const a=h*.27;return `<g opacity="${op}"><path d="M${fmt(x-a)} ${fmt(y)}L${fmt(x-a*.68)} ${fmt(y-h*.62)}L${fmt(x)} ${fmt(y-h)}L${fmt(x+a*.54)} ${fmt(y-h*.73)}L${fmt(x+a)} ${fmt(y)}Z" fill="${leaf}" stroke="${w.top}" stroke-opacity=".7" stroke-width="1.2"/><path d="M${fmt(x)} ${fmt(y-h)}L${fmt(x+a*.11)} ${fmt(y)}L${fmt(x+a*.54)} ${fmt(y-h*.73)}Z" fill="${leaf2}" opacity=".75"/><path d="M${fmt(x-a*.68)} ${fmt(y-h*.62)}L${fmt(x)} ${fmt(y-h)}L${fmt(x-a*.1)} ${fmt(y)}Z" fill="${w.accent}" opacity=".45"/></g>`;
  }
  return `<g opacity="${op}"><path d="M${fmt(x-4)} ${fmt(y)}Q${fmt(x-3)} ${fmt(y-h*.5)} ${fmt(x-1)} ${fmt(y-h*.67)}L${fmt(x+5)} ${fmt(y-h*.67)}Q${fmt(x+2)} ${fmt(y-h*.44)} ${fmt(x+4)} ${fmt(y)}Z" fill="${trunk}"/><path d="M${fmt(x-h*.36)} ${fmt(y-h*.65)}Q${fmt(x-h*.24)} ${fmt(y-h)} ${fmt(x)} ${fmt(y-h)}Q${fmt(x+h*.28)} ${fmt(y-h)} ${fmt(x+h*.37)} ${fmt(y-h*.65)}Z" fill="${r()<.5?leaf:leaf2}"/><ellipse cx="${fmt(x)}" cy="${fmt(y-h*.84)}" rx="${fmt(h*.11)}" ry="${fmt(h*.055)}" fill="${w.accent}" opacity=".7"/></g>`;
}
function renderWorld(w,seed){
 const r=rng(seed), f=n=>fmt(n);
 const id=`w${seed.toString(16)}`;
 let out=`<svg class="terrainWorldSvg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1100" preserveAspectRatio="xMidYMin slice" aria-hidden="true"><defs>
 <linearGradient id="${id}base" x2="0" y2="1"><stop stop-color="${w.ground}"/><stop offset=".6" stop-color="${w.ground2}"/><stop offset="1" stop-color="${w.ground3}"/></linearGradient>
 <linearGradient id="${id}m1" x2="0" y2="1"><stop stop-color="${w.mountain1}"/><stop offset="1" stop-color="${w.mountain2}"/></linearGradient>
 <linearGradient id="${id}m2" x2="0" y2="1"><stop stop-color="${w.mountain2}"/><stop offset="1" stop-color="${w.mountain3}"/></linearGradient>
 <linearGradient id="${id}water" x2="0" y2="1"><stop stop-color="${w.water||w.ground}"/><stop offset="1" stop-color="${w.ground2}"/></linearGradient>
 </defs>`;
 // Far ridgeline; endpoints at 255, terrain starts at 255. Independent of viewport shape.
 const series=(baseline,minAmp,maxAmp,step)=>{
   let d=`M0 ${f(baseline)}`;let pts=[];
   for(let x=0;x<=1200;x+=step){let peak=baseline-minAmp-r()*maxAmp;pts.push([x,peak]);}
   d=`M0 ${f(baseline)}L${f(pts[0][0])} ${f(pts[0][1])}`;
   for(let i=0;i<pts.length-1;i++){let [x,y]=pts[i], [xx,yy]=pts[i+1];let mx=(x+xx)/2,my=(y+yy)/2;d+=`Q${f(x)} ${f(y)} ${f(mx)} ${f(my)}`;}
   d+=`L${f(pts[pts.length-1][0])} ${f(pts[pts.length-1][1])}`;
   return {d:d+`L1200 ${f(baseline+35)}L0 ${f(baseline+35)}Z`,pts};
 };
 const ridge1=series(263,34,134,75),ridge2=series(276,8,88,65);
 out+=`<path d="${ridge1.d}" fill="url(#${id}m1)"/>`;
 // Rock face striations and snow/bright ledges per peak, grounded within mountain masses
 for(let i=1;i<ridge1.pts.length-1;i++){
   const [x,y]=ridge1.pts[i];if(y<171){
     out+=`<path d="M${f(x-21)} ${f(y+33)}L${f(x)} ${f(y)}L${f(x+22)} ${f(y+39)}L${f(x+8)} ${f(y+26)}L${f(x-3)} ${f(y+30)}Z" fill="${w.top}" opacity="${w.flora==='desert'?.36:.84}"/>`;
   }
   if(i%2===0)out+=`<path d="M${f(x)} ${f(y+19)}l${f(-8-r()*13)} ${f(26+r()*18)}" stroke="${w.mountain3}" stroke-width="${f(1+r()*2)}" opacity=".28" fill="none"/>`;
 }
 out+=`<path d="${ridge2.d}" fill="url(#${id}m2)"/>`;
 for(let i=0;i<ridge2.pts.length;i+=2){const [x,y]=ridge2.pts[i];out+=`<path d="M${f(x)} ${f(y+8)}l${f(-12-r()*16)} ${f(22+r()*15)}" stroke="${w.mountain1}" stroke-width="1.8" opacity=".22"/>`;}
 // Overlap ground over all ridge bases (no gaps / no green from old SVG)
 out+=`<path d="M0 259Q210 250 410 258T805 255T1200 259L1200 1100L0 1100Z" fill="url(#${id}base)"/>`;
 out+=`<path d="M0 299Q240 276 470 305T900 301T1200 290L1200 350Q920 380 600 348T0 355Z" fill="${w.ground}" opacity=".72"/>`;
 out+=`<path d="M0 422Q160 400 323 431T690 422T1200 429L1200 505Q1000 475 700 509T0 502Z" fill="${w.ground2}" opacity=".4"/>`;
 out+=`<path d="M0 522Q320 496 570 533T1200 513L1200 1100H0Z" fill="${w.ground3}" opacity=".4"/>`;
 if(w.water){
   out+=`<path d="M0 325Q250 303 432 322T850 327T1200 303L1200 399Q975 410 747 393T300 403T0 395Z" fill="url(#${id}water)" opacity=".96"/>`;
   for(let k=0;k<33;k++){const x=r()*1150,y=334+r()*48;out+=`<path d="M${f(x)} ${f(y)}q${f(10+r()*25)} -2 ${f(31+r()*28)} 1" stroke="${w.accent}" stroke-width="${f(.7+r())}" opacity="${f(.2+r()*.28)}" fill="none"/>`;}
 }
 if(w.flora==='palm'){
   out+=`<path d="M0 293Q189 290 345 318Q500 345 641 321Q890 300 1200 305L1200 330Q894 325 695 341Q480 360 300 336Q143 314 0 319Z" fill="${w.accent}" opacity=".91"/>`;
 }
 // rocks, fine surface strokes and soil flecks across entire footprint
 for(let k=0;k<320;k++){
   const x=r()*1200,y=275+r()*345;const wd=1+r()*8, ht=.5+r()*3.5;
   out+=`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(wd)}" ry="${f(ht)}" fill="${r()<.5?w.soil:w.accent}" opacity="${f(.10+r()*.20)}"/>`;
 }
 for(let k=0;k<86;k++){
   const x=r()*1200,y=304+r()*316,sz=3+r()*18;
   out+=`<path d="M${f(x-sz)} ${f(y)}q${f(sz*.47)} ${f(-sz*.85)} ${f(sz)} ${f(-sz*.45)}q${f(sz*.5)} ${f(-sz*.4)} ${f(sz)} ${f(sz*.45)}Z" fill="${w.rock}" opacity="${f(.14+r()*.31)}"/>`;
 }
 // Deep and foreground vegetation / alien structures; place trees on land edges when water is present
 for(let layer=0;layer<4;layer++){
   const n=[42,36,28,20][layer];
   for(let k=0;k<n;k++){
     const x=r()*1200;
     const y=layer===0?265+r()*52:layer===1?404+r()*86:layer===2?520+r()*96:590+r()*40;
     const h=(layer===0?18:layer===1?34:layer===2?58:78)*(0.65+r()*.85);
     out+=tree(x,y,h,w,r,Math.min(layer,2));
   }
 }
 // Extended foreground: actual painted world content below the original 620-unit boundary.
 // This is part of the same SVG and palette, not a separate color fill.
 out+=`<path d="M0 615Q220 593 470 626T920 615T1200 622L1200 1100H0Z" fill="url(#${id}base)"/>`;
 out+=`<path d="M0 738Q270 705 520 742T1200 730L1200 868Q850 831 550 874T0 851Z" fill="${w.ground2}" opacity=".30"/>`;
 out+=`<path d="M0 927Q250 890 520 937T1200 916L1200 1100H0Z" fill="${w.ground3}" opacity=".33"/>`;
 for(let k=0;k<330;k++){
   const x=r()*1200,y=620+r()*480,wd=1+r()*11,ht=.7+r()*4.4;
   out+=`<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(wd)}" ry="${f(ht)}" fill="${r()<.52?w.soil:w.accent}" opacity="${f(.10+r()*.23)}"/>`;
 }
 for(let k=0;k<85;k++){
   const x=r()*1200,y=650+r()*440,z=4+r()*21;
   out+=`<path d="M${f(x-z)} ${f(y)}q${f(z*.5)} ${f(-z*.7)} ${f(z)} ${f(-z*.35)}q${f(z*.45)} ${f(-z*.5)} ${f(z)} ${f(z*.35)}Z" fill="${w.rock}" opacity="${f(.14+r()*.30)}"/>`;
 }
 for(let layer=0;layer<3;layer++){
   for(let k=0;k<[42,36,30][layer];k++){
     const x=r()*1200,y=layer===0?675+r()*105:layer===1?825+r()*105:980+r()*110;
     const h=[65,85,110][layer]*(0.55+r()*.8);
     out+=tree(x,y,h,w,r,2);
   }
 }
 if(w.flora==='crystal'){
   for(let k=0;k<35;k++){const x=r()*1200,y=660+r()*435,z=10+r()*34;out+=`<path d="M${f(x-z*.4)} ${f(y)}L${f(x)} ${f(y-z*2)}L${f(x+z*.6)} ${f(y)}Z" fill="${k%2?w.leaf2:w.accent}" opacity=".48" stroke="${w.top}" stroke-width="1"/>`;}
 }
 if(w.flora==='mushroom'){
   for(let k=0;k<50;k++){const x=r()*1200,y=650+r()*440;out+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(1+r()*5)}" fill="${w.accent}" opacity="${f(.25+r()*.50)}"/>`;}
 }
 // species-dependent distinctive accents
 if(w.flora==='crystal'){
   for(let k=0;k<16;k++){const x=r()*1200,y=370+r()*222,z=9+r()*26;out+=`<path d="M${f(x-z*.4)} ${f(y)}L${f(x)} ${f(y-z*2)}L${f(x+z*.6)} ${f(y)}Z" fill="${k%2?w.leaf2:w.accent}" opacity=".5" stroke="${w.top}" stroke-width="1"/>`;}
 }
 if(w.flora==='mushroom'){
   for(let k=0;k<24;k++){const x=r()*1200,y=374+r()*233,rr=1+r()*4;out+=`<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="${w.accent}" opacity="${f(.35+r()*.45)}"/>`;}
 }
 out+='</svg>';
 return out;
}
function change(scene){
 const old=Number(scene.dataset.landscapeWorldIndex??-1);
 let idx=Math.floor(Math.random()*(worlds.length-1));
 if(old>=0&&old<worlds.length){if(idx>=old)idx++;}else idx=Math.floor(Math.random()*worlds.length);
 const w=worlds[idx];
 const container=scene.querySelector('.terrainWorld');if(!container)return;
 // The lowest gradient stop and the underlying solid sky are precisely w.sky.
 // Change the entire palette atomically with the new world at the previous flight's boundary.
 const hex=w.sky.replace('#','');
 const channel=i=>parseInt(hex.slice(i,i+2),16);
 const soften=(amount)=>'#'+[0,2,4].map(i=>Math.round(channel(i)+(255-channel(i))*amount).toString(16).padStart(2,'0')).join('');
 const darken=(amount)=>'#'+[0,2,4].map(i=>Math.round(channel(i)*amount).toString(16).padStart(2,'0')).join('');
 scene.style.setProperty('--world-sky',w.sky);
 scene.style.setProperty('--world-sky-top',soften(w.flora==='mushroom'?.05:.22));
 scene.style.setProperty('--world-sky-middle',soften(.10));
 scene.style.setProperty('--world-sky-midspace',darken(.34));
 const seed=(Math.floor(Math.random()*0x7fffffff) ^ (idx*0x4f52))>>>0;
 container.innerHTML=renderWorld(w,seed);
 scene.dataset.landscapeWorldIndex=String(idx);
 scene.dataset.landscapeWorldName=w.name;
}
function bind(scene){
 if(!scene||scene.dataset.landscapeBound)return;
 scene.dataset.landscapeBound='1';
 change(scene);
 const terrain=scene.querySelector('.journeyTerrain');
 if(!terrain)return;
 // Choose the next world at the completed flight boundary. The sky is the
 // 18-second master timeline, not the ground layer: changing the ground when
 // it enters a new frame can leave the previous world visible briefly.
 // animationiteration fires precisely at the end of each completed 18s cycle,
 // before the next scene is painted. Only handle the root animation.
 scene.addEventListener('animationiteration',e=>{
   if(e.target===scene&&e.animationName==='journeySkyWorldV121') change(scene);
 });
 // Rewinding on entering Mission Control / Garage creates a new flight.
 const page=scene.closest('#launchSplash,#dashboard,#garage');
 if(page){new MutationObserver(()=>{if(!page.classList.contains('hidden'))change(scene);}).observe(page,{attributes:true,attributeFilter:['class']});}
}
function init(){document.querySelectorAll('#launchSplash .launchJourney,#dashboard .dashRocket .launchJourney,#garage .garageFlightStage .launchJourney').forEach(bind);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
window.TTRocketLandscapes={next:()=>document.querySelectorAll('.launchJourney').forEach(scene=>{if(scene.dataset.landscapeBound)change(scene);}),worldNames:worlds.map(w=>w.name)};
})();

