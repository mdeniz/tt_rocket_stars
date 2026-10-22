
(function(){
 const ids=['randomSplashRocket','homeRocket','garageRocket'];
 function refresh(el){
   const svg=el.querySelector(':scope > svg')||el.querySelector('svg');
   if(!svg)return;
   const layer=el.querySelector(':scope > .ttBreakupLayer');
   if(layer)layer.remove();
   el.classList.remove('ttRocketBreakup');
   // A breakup is a rare surprise, not an unavoidable event.
   if(Math.random()>=.32)return;
   const wrap=document.createElement('div');
   wrap.className='ttBreakupLayer';
   for(let i=0;i<4;i++){
     const shard=document.createElement('span');
     shard.className='ttShard';
     const clone=svg.cloneNode(true);
     clone.removeAttribute('id');
     clone.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
     shard.appendChild(clone);
     wrap.appendChild(shard);
   }
   const burst=document.createElement('span');burst.className='ttBurst';wrap.appendChild(burst);
   for(let i=0;i<6;i++){const spark=document.createElement('span');spark.className='ttSpark';wrap.appendChild(spark)}
   el.appendChild(wrap);
   el.classList.add('ttRocketBreakup');
 }
 function init(){
  ids.forEach(id=>{
   const el=document.getElementById(id);if(!el)return;
   refresh(el);
   // The rocket animation is the 18s clock; choose independently each lap.
   el.addEventListener('animationiteration',e=>{
    if(e.target===el && e.animationName==='journeyRocket')refresh(el);
   });
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

