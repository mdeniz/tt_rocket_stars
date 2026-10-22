
// Rehydrate all per-pilot in-memory state. A page reload would exit browser fullscreen.
window.TTSwitchProfileInPlace=function(showSelector=false){
  try{
    clearTimeout(autoNextTimer);clearInterval(timer);timer=null;run++;
    history=JSON.parse(window.TTLocalStore.getItem('cosmotablas-history-v1')||'[]')||[];
    data=JSON.parse(window.TTLocalStore.getItem('cosmotablas-v2')||'{}')||{};
    const fresh={coins:0,owned:['body_red','nose_classic','wings_classic','flame_orange','window_round','extra_none'],equipped:{body:'body_red',nose:'nose_classic',wings:'wings_classic',flame:'flame_orange',window:'window_round',extra:'extra_none'},rewardedAchievements:[],rewardedMissions:[],family:'compact',fleet:[],designs:{}};
    const saved=JSON.parse(window.TTLocalStore.getItem(ROCKET_KEY)||'null');
    rocketState=saved&&typeof saved==='object'?{...fresh,...saved,equipped:{...fresh.equipped,...saved.equipped}}:fresh;
    garagePreviewId=null;pendingPurchase=null;
    lang=window.TTLocalStore.getItem('cosmotablas-language')==='es'?'es':'en';
    window.refreshTranslations?.();
    const profile=window.TTProfiles?.active?.();
    // The theme helper is private to its module; restore the current pilot's theme directly.
    const themeMap=JSON.parse(window.TTLocalStore.getItem('tt-rocket-themes-v1')||'{}')||{};
    const theme=themeMap[window.TTLocalStore.getItem('tt-rocket-active-profile-v1')]||'deep';
    document.documentElement.dataset.rocketTheme=['deep','galaxy','red','lilac'].includes(theme)?theme:'deep';
    document.querySelectorAll('.themeChoice').forEach(b=>{
      const selected=b.dataset.theme===document.documentElement.dataset.rocketTheme;
      b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));
    });
    document.getElementById('profileGate')?.classList.add('hidden');
    if(showSelector){window.TTProfiles.show();return}
    document.getElementById('play')?.classList.add('hidden');
    renderPlanets();renderStats();updateCoins();
    navigate('dashboard');renderDashboard();
  }catch(err){console.error('Could not switch pilot in place:',err);alert((window.TTLocalStore.getItem('cosmotablas-language')==='es'?'No se pudo cambiar de piloto: ':'Could not switch pilot: ')+(err?.message||String(err)));}
};

