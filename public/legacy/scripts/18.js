
(function(){
  function decorateSplashRocket(host){
    const svg=host.querySelector('svg');if(!svg)return;
    if(svg.classList.contains('animatedRocket'))return;
    svg.classList.add('animatedRocket');
    // Only the spacecraft moves/rotates. Atmospheric effects stay in the SVG's
    // independent coordinate system, outside the animated spacecraft group.
    const ns='http://www.w3.org/2000/svg';
    const ship=document.createElementNS(ns,'g');
    ship.setAttribute('class','rocketShipMotion');
    // The three decorative stars at the beginning of rocketSVG belong to
    // the distant sky, not to the rotating spacecraft.
    const distantStars=document.createElementNS(ns,'g');
    distantStars.setAttribute('class','rocketDistantStars');
    for(let i=0;i<3 && svg.firstChild;i++)distantStars.appendChild(svg.firstChild);
    // Fleet escorts are siblings of the ship motion group, not children:
    // the main rocket's pitch must never rotate the escorts around its axis.
    const escorts=[...svg.querySelectorAll('.supportShip')];
    escorts.forEach(escort=>escort.remove());
    while(svg.firstChild)ship.appendChild(svg.firstChild);
    const escortLayer=document.createElementNS(ns,'g');
    escortLayer.setAttribute('class','rocketEscortLayer');
    escorts.forEach((escort,i)=>{
      const motion=document.createElementNS(ns,'g');
      motion.setAttribute('class','rocketEscortMotion rocketEscortMotion'+i);
      motion.appendChild(escort);
      escortLayer.appendChild(motion);
    });
    const background=document.createElementNS(ns,'g');
    background.setAttribute('class','rocketFlightBackground');
    background.innerHTML=`
      <g class="parallaxStars">${Array.from({length:18},(_,i)=>{
        const x=(i*83+19)%270,y=(i*47+13)%285,r=i%4===0?1.9:1;
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="${i%3===0?'#ffeeb3':'#d7ecff'}" opacity=".8"/>`;
      }).join('')}</g>
      <g class="parallaxMountains"><path d="M-50 245L-8 185L28 224L68 171L112 238L154 193L207 239L250 179L318 248V340H-50Z" fill="#4b6088" opacity=".82"/><path d="M-50 267L30 217L69 249L118 204L171 262L231 223L318 266V340H-50Z" fill="#283d65" opacity=".95"/></g>
      <g class="parallaxCloudFar" fill="#e1f2ff" opacity=".45"><ellipse cx="28" cy="35" rx="46" ry="12"/><ellipse cx="45" cy="27" rx="24" ry="16"/><ellipse cx="250" cy="125" rx="49" ry="12"/><ellipse cx="228" cy="118" rx="25" ry="16"/></g>`;
    background.prepend(distantStars);
    svg.appendChild(background);
    svg.appendChild(ship);
    svg.appendChild(escortLayer);
    const group=document.createElementNS(ns,'g');group.setAttribute('class','rocketAtmosphere');group.setAttribute('pointer-events','none');
    group.innerHTML=`<g class="rocketWind"><path d="M78 20L65 43"/><path d="M114 30L128 52"/><path d="M88 4L84 17"/></g>
      <g class="rocketCloud rocketCloudA"><ellipse cx="-30" cy="115" rx="32" ry="11"/><ellipse cx="-9" cy="108" rx="22" ry="15"/></g>
      <g class="rocketCloud rocketCloudB"><ellipse cx="270" cy="184" rx="37" ry="12"/><ellipse cx="249" cy="176" rx="22" ry="16"/></g>
      <g class="rocketSpeed"><path d="M46 80L38 107"/><path d="M226 115L218 145"/><path d="M50 191L44 214"/></g>`;
    svg.appendChild(group);
    if(host.id==='randomSplashRocket'){
      const foreground=document.createElementNS(ns,'g');
      foreground.setAttribute('class','parallaxCloudNear');
      foreground.setAttribute('pointer-events','none');
      foreground.innerHTML='<g fill="#e8f7ff" opacity=".85"><ellipse cx="-18" cy="42" rx="66" ry="19"/><ellipse cx="16" cy="29" rx="36" ry="26"/><ellipse cx="280" cy="202" rx="78" ry="21"/><ellipse cx="238" cy="187" rx="40" ry="29"/></g>';
      svg.appendChild(foreground);
    }
  }
  // Observe main rocket displays because their SVG is recreated when changing parts,
  // changing pilots or returning to Mission Control.
  function observeRocket(hostId){
    const host=document.getElementById(hostId);if(!host)return;
    decorateSplashRocket(host);
    const observer=new MutationObserver(()=>decorateSplashRocket(host));
    observer.observe(host,{childList:true});
  }
  observeRocket('homeRocket');
  observeRocket('garageRocket');
  // A splash ship is a preview only: never modify the active pilot's garage or purchases.
  const target=document.getElementById('randomSplashRocket');
  if(!target || typeof rocketSVG!=='function' || typeof rocketParts==='undefined')return;
  const categories=['body','nose','wings','flame','window','extra'];
  const pick=arr=>arr[Math.floor(Math.random()*arr.length)];
  const originalFamily=rocketState.family, originalFleet=rocketState.fleet;
  try{
    const family=pick(['compact','interceptor','heavy']);
    rocketState.family=family;
    const equipped={};
    for(const cat of categories){
      const options=rocketParts.filter(p=>p.cat===cat && (!p.compat || p.compat.includes(family)));
      if(!options.length)throw new Error('Missing compatible '+cat+' for '+family);
      equipped[cat]=pick(options).id;
    }
    // Optional support ships, also from the real garage collection.
    const supports=rocketParts.filter(p=>p.cat==='support');
    rocketState.fleet=supports.length?Array.from({length:Math.floor(Math.random()*4)},()=>pick(supports).id):[];
    target.innerHTML=rocketSVG(equipped,true);
    decorateSplashRocket(target);
  }catch(error){
    console.warn('Random splash rocket fallback:',error);
    target.innerHTML=rocketSVG();
    decorateSplashRocket(target);
  }finally{
    rocketState.family=originalFamily;
    rocketState.fleet=originalFleet;
  }
})();

