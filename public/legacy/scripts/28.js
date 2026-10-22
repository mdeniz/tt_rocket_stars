
(function(){
  const host=document.getElementById('randomSplashRocket');
  if(!host)return;
  const families=['compact','interceptor','heavy'];
  const categories=['body','nose','wings','flame','window','extra'];
  let lastSignature='';
  function refresh(){
    if(typeof rocketSVG!=='function'||typeof rocketParts==='undefined'||typeof rocketState==='undefined')return;
    const savedFamily=rocketState.family;
    const savedFleet=rocketState.fleet;
    try{
      let html='',signature='';
      for(let attempt=0;attempt<8;attempt++){
        const family=families[Math.floor(Math.random()*families.length)];
        rocketState.family=family;
        const equipped={};
        for(const cat of categories){
          const options=rocketParts.filter(p=>p.cat===cat&&(!p.compat||p.compat.includes(family)));
          if(!options.length)throw new Error('No compatible rocket part: '+cat);
          equipped[cat]=options[Math.floor(Math.random()*options.length)].id;
        }
        const supports=rocketParts.filter(p=>p.cat==='support');
        rocketState.fleet=supports.length?Array.from({length:Math.floor(Math.random()*4)},()=>supports[Math.floor(Math.random()*supports.length)].id):[];
        signature=family+'|'+Object.values(equipped).join('|')+'|'+rocketState.fleet.join('|');
        html=rocketSVG(equipped,true);
        if(signature!==lastSignature)break;
      }
      if(signature===lastSignature)return;
      lastSignature=signature;
      host.innerHTML=html;
    }catch(e){console.warn('Splash rocket rotation:',e)}
    finally{rocketState.family=savedFamily;rocketState.fleet=savedFleet}
  }
  // The 18-second flight fades out at its boundary. Replace the spacecraft there,
  // while invisible, so the next flight fades in with a different configuration.
  host.addEventListener('animationiteration',function(ev){
    if(ev.target===host && ev.animationName==='journeyRocket')refresh();
  });
  // The splash is initialized with a random rocket already; don't change it mid-flight.
})();

