
(function(){
 const ids=['randomSplashRocket','homeRocket','garageRocket'];
 function explode(el){
  if(el.classList.contains('ttTapExploding'))return;
  const svg=el.querySelector(':scope > svg')||el.querySelector('svg');
  if(!svg)return;
  el.classList.add('ttTapExploding');
  window.TTAudio?.sfx('explosion');
  const layer=document.createElement('div');layer.className='ttTapExplosion';
  for(let i=0;i<4;i++){
   const part=document.createElement('span');part.className='ttTapPiece';
   const copy=svg.cloneNode(true);copy.removeAttribute('id');
   copy.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
   part.appendChild(copy);layer.appendChild(part);
  }
  const flash=document.createElement('span');flash.className='ttTapFlash';layer.appendChild(flash);
  for(let i=0;i<6;i++){const spark=document.createElement('span');spark.className='ttTapSpark';layer.appendChild(spark)}
  el.appendChild(layer);
  if(navigator.vibrate)try{navigator.vibrate([55,35,100])}catch(_){}
  // Allow the fragments to fall, then fade out before resetting the entire flight.
  const scene=el.parentElement?.querySelector(':scope > .launchJourney')||
              el.closest('.dashRocket,.garageFlightStage,#launchSplash')?.querySelector('.launchJourney');
  const actors=[scene,el].filter(Boolean);
  setTimeout(()=>{
   actors.forEach(node=>{node.style.transition='opacity .35s ease-in';node.style.opacity='0'});
  },1500);
  setTimeout(()=>{
   // Restart all animated scenery and the rocket together while invisible.
   const nodes=new Set();
   actors.forEach(root=>{nodes.add(root);root.querySelectorAll('*').forEach(n=>{
    if(getComputedStyle(n).animationName!=='none')nodes.add(n);
   })});
   const original=[...nodes].map(n=>[n,n.style.animation]);
   original.forEach(([n])=>n.style.setProperty('animation','none','important'));
   void el.offsetWidth;
   original.forEach(([n,value])=>{if(value)n.style.animation=value;else n.style.removeProperty('animation')});
   layer.remove();
   el.classList.remove('ttTapExploding');
   actors.forEach(node=>{
    node.style.transition='opacity .55s ease-out';
    node.style.opacity='1';
    setTimeout(()=>{node.style.removeProperty('opacity');node.style.removeProperty('transition')},650);
   });
  },1950);
 }
 function init(){
  ids.forEach(id=>{
   const el=document.getElementById(id);if(!el)return;
   let taps=[];
   el.addEventListener('pointerdown',ev=>{
    if(ev.pointerType==='mouse'&&ev.button!==0)return;
    if(el.classList.contains('ttTapExploding'))return;
    const now=performance.now();
    taps=taps.filter(t=>now-t<2500);
    taps.push(now);
    if(taps.length>=5){taps=[];explode(el)}
   },{passive:true});
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

