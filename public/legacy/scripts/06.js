
(function(){
  const splash=document.getElementById('launchSplash');
  let entered=false;
  const isSpanish=()=>{try{return window.TTLocalStore.getItem('cosmotablas-language')==='es'}catch(e){return false}};
  function splashLanguage(){
    const es=isSpanish();
    const texts={
      splashLead:es?'¡Aprende a multiplicar y dividir en misiones espaciales!':'Learn multiplication and division on space missions!',
      splashNoAds:es?'✓ Sin anuncios':'✓ No ads',
      splashOffline:es?'✓ Funciona sin conexión':'✓ Works offline',
      splashLocal:es?'✓ Progreso guardado en este dispositivo':'✓ Saved on this device',
      splashStart:es?'Toca para iniciar 🚀':'Tap to start 🚀',
      splashHint:es?'¡La aventura está a punto de comenzar!':'The adventure is about to begin!'
    };
    Object.entries(texts).forEach(([id,value])=>{const el=document.getElementById(id);if(el)el.textContent=value});
  }
  let splashSoundStarted=false;
  function isTouchOrCoarsePointerDevice(){
    try{
      if(Number(navigator.maxTouchPoints)>0)return true;
      return typeof window.matchMedia==='function'&&window.matchMedia('(pointer: coarse)').matches;
    }catch(e){return false}
  }
  function enterGame(){
    if(entered)return;
    // Mobile browsers reject audible autoplay. The first gesture starts the
    // whole splash soundtrack and restarts the launch animation in sync;
    // a second gesture takes the player to Mission Control.
    if(!splashSoundStarted){
      splashSoundStarted=true;
      try { window.TTAudio?.start(); } catch(e) {}
      splash.classList.add('splashAudioPlaying');
      const start=document.getElementById('splashStart');
      if(start)start.textContent=isSpanish()?'Entrar al juego →':'Enter the game →';
      const hint=splash.querySelector('.ttSplashSoundHint');
      if(hint)hint.remove();
      // Restart all CSS animations in this scene from their first frame.
      splash.querySelectorAll('.launchJourney, .launchJourney *').forEach(el=>{
        try { el.getAnimations({subtree:false}).forEach(a=>{a.cancel();a.play()}); }catch(e){}
      });
      try { window.TTAudio?.restartLaunch?.(); } catch(e) {}
    }
    entered=true;
    // This must be called synchronously from the tap/click, before any await.
    try{if(isTouchOrCoarsePointerDevice()&&!document.fullscreenElement&&(window.TTFullscreenAdapter?.requestFullscreen||document.documentElement.requestFullscreen)){
      const promise=window.TTFullscreenAdapter?.requestFullscreen
        ? window.TTFullscreenAdapter.requestFullscreen()
        : document.documentElement.requestFullscreen({navigationUI:'hide'});
      if(promise&&promise.catch)promise.catch(()=>{});
    }}catch(e){}
    // Keep the splash visible until dashboard initialization and rendering have
    // completed. Hiding it first exposes the empty dark app during synchronous work.
    // Start immediately with the saved pilot. The pilot selector is only
    // displayed when the pilot button in the top bar is pressed.
    try{
      if(!TTProfiles.active()){
        const saved=TTProfiles.read();
        if(saved.length){
          TTProfiles.choose(saved[0].id);
        }else{
          const error=TTProfiles.create(isSpanish()?'Piloto 1':'Pilot 1');
          if(error)throw new Error(error);
        }
      }
      document.getElementById('profileGate')?.classList.add('hidden');
      navigate('dashboard');
    }catch(error){
      console.error('Could not start with default pilot:',error);
      // Preserve access to the game if storage or profile initialization fails.
      try { navigate('dashboard'); } catch(e) { console.error(e); }
    } finally {
      // Reveal the fully prepared screen in one step, without a black intermediate frame.
      window.TTAccessibility.hideRegion(splash,document.getElementById('menuBtn'));
    }
  }
  splash.addEventListener('click',enterGame);
  splash.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();enterGame()}});
  splashLanguage();
  // The informational splash always comes first. The selector opens only from the pilot button.
  if(window.TTSessionStore.getItem('tt-profile-selected-once')==='1'){
    window.TTSessionStore.removeItem('tt-profile-selected-once');
    window.TTAccessibility.hideRegion(splash,document.getElementById('menuBtn'));
    document.getElementById('profileGate')?.classList.add('hidden');
    try{navigate('dashboard')}catch(e){}
  }
})();

document.addEventListener('fullscreenchange',updateFullscreenMenu);
updateFullscreenMenu();
